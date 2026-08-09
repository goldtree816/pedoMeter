import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { Platform, PermissionsAndroid, Alert, NativeModules } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';

// Set up notification handler so alerts show even when the app is foregrounded
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// react-native-accurate-step-counter uses native Android/iOS hardware.
// It does not work on web — guard every call with isNativeDevice.
const isNativeDevice = Platform.OS === 'android' || Platform.OS === 'ios';

// Only import the native functions if we're on a native platform.
// On web, these will be no-ops.
let startCounter: ((config: any) => void) | null = null;
let stopCounter: (() => void) | null = null;

if (isNativeDevice) {
  // Dynamic require so the web bundler never tries to resolve NativeModules.
  const StepCounter = require('react-native-accurate-step-counter');
  startCounter = StepCounter.startCounter;
  stopCounter = StepCounter.stopCounter;
}

// ─── AsyncStorage Keys ────────────────────────────────────────────────────────
const STORAGE_KEYS = {
  RECORDS: '@stepcounter/records',
  DAILY_GOAL: '@stepcounter/dailyGoal',
  WATER_INTAKE: '@stepcounter/waterIntake',
  SELECTED_GOAL: '@stepcounter/selectedGoal',
  WEIGHT: '@stepcounter/weight',
  HEIGHT: '@stepcounter/height',
  DISTANCE_UNIT: '@stepcounter/distanceUnit',
  WEIGHT_HISTORY: '@stepcounter/weightHistory',
  // SESSION_BASE_STEPS is now handled natively by SharedPreferences in RNWalkCounterService
  REMINDERS_ENABLED: '@stepcounter/remindersEnabled',
};

// ─── Helper: persist a value ──────────────────────────────────────────────────
async function persist(key: string, value: unknown) {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn('[Storage] Failed to save', key, e);
  }
}

// ─── Helper: load a value ─────────────────────────────────────────────────────
async function load<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch (e) {
    console.warn('[Storage] Failed to load', key, e);
    return fallback;
  }
}

export type DistanceUnit = 'Mile' | 'Km';

export interface StepRecord {
  id: string;
  steps: number;
  calories: number;
  distance: number;
  activeDuration: number; // in minutes
  date: Date;
  note?: string;
}

// Raw shape as stored in JSON (dates are strings)
interface StepRecordRaw {
  id: string;
  steps: number;
  calories: number;
  distance: number;
  activeDuration: number;
  date: string;
  note?: string;
}

export interface WeightRecord {
  date: string; // ISO date string
  weight: number; // in kg
}

export type WalkingGoal = 'lose_weight' | 'stay_fit' | 'reduce_stress' | 'sleep_better';

export const GOAL_LABELS: Record<WalkingGoal, { title: string; desc: string; icon: string }> = {
  lose_weight: {
    title: 'LOSE WEIGHT',
    desc: 'Burn fat more effectively',
    icon: 'human-female',
  },
  stay_fit: {
    title: 'STAY FIT',
    desc: 'Improve your health',
    icon: 'heart-pulse',
  },
  reduce_stress: {
    title: 'REDUCE STRESS',
    desc: 'Clear mind, relax and meditate',
    icon: 'flower',
  },
  sleep_better: {
    title: 'SLEEP BETTER',
    desc: 'Get a high-quality sleep',
    icon: 'weather-night',
  },
};

interface SettingsContextType {
  // Step stats
  records: StepRecord[];
  dailyGoal: number;
  isPaused: boolean;
  waterIntake: number;
  waterGoal: number;
  selectedGoal: WalkingGoal;

  // Live sensor state
  isCounterRunning: boolean;
  liveStepsToday: number;

  // Loading state (true until AsyncStorage is read)
  isLoaded: boolean;

  // User profile
  weight: number; // in kg
  height: number; // in cm
  distanceUnit: DistanceUnit;

  // Weight history for graph
  weightHistory: WeightRecord[];

  // Reminders
  remindersEnabled: boolean;
  toggleReminders: (enabled: boolean) => Promise<void>;

  // Actions
  addSteps: (steps: number, date: Date, note?: string) => void;
  updateSteps: (id: string, steps: number, date: Date, note?: string) => void;
  deleteSteps: (id: string) => void;
  addWater: (oz: number) => void;
  setDailyGoal: (goal: number) => void;
  setIsPaused: (paused: boolean) => void;
  setSelectedGoal: (goal: WalkingGoal) => void;
  setWeight: (w: number) => void;
  setHeight: (h: number) => void;
  setDistanceUnit: (unit: DistanceUnit) => void;
  addWeightRecord: (weightKg: number, dateIso?: string) => void;
  clearWeightHistory: () => void;
  resetAllData: () => void;
}

const defaultGoal: WalkingGoal = 'stay_fit';

const makeDate = (daysAgo: number, hour: number, minute: number) => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(hour, minute, 0, 0);
  return d;
};

// ─── No seed records, start fresh ───
const SEED_RECORDS: StepRecord[] = [];

// ─── Helper: check if two Date objects are the same calendar day ───
const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

// ─── Helper: today's date string YYYY-MM-DD (local timezone safe) ───
const todayISO = () => {
  const date = new Date();
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60 * 1000);
  return localDate.toISOString().split('T')[0];
};

// ─── Deserialise records: parse date strings back to Date objects ───
function deserialiseRecords(raw: StepRecordRaw[]): StepRecord[] {
  return raw.map((r) => ({ ...r, date: new Date(r.date) }));
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [records, setRecordsState] = useState<StepRecord[]>(SEED_RECORDS);
  const [dailyGoal, setDailyGoalState] = useState(6000);
  const [isPaused, setIsPausedState] = useState(false);
  const [waterIntake, setWaterIntakeState] = useState(0);
  const [waterGoal] = useState(24);
  const [selectedGoal, setSelectedGoalState] = useState<WalkingGoal>(defaultGoal);
  const [weight, setWeightState] = useState(70);
  const [height, setHeightState] = useState(175);
  const [distanceUnit, setDistanceUnitState] = useState<DistanceUnit>('Mile');
  const [isCounterRunning, setIsCounterRunning] = useState(false);
  const [weightHistory, setWeightHistoryState] = useState<WeightRecord[]>([]);
  const [remindersEnabled, setRemindersEnabledState] = useState(false);

  // liveSteps holds the raw step count from the sensor since the counter last started this session.
  const [liveSteps, setLiveSteps] = useState(0);

  // nativeBaseSteps: the step total loaded from native SharedPreferences on app open.
  // The native service is the source of truth — we only read this once on startup.
  const nativeBaseSteps = useRef(0);

  // ─── Derived: total steps for today = native base + current session sensor reading ───
  const liveStepsToday = nativeBaseSteps.current + liveSteps;

  // ─── Metric calculations ───
  const calculateMetrics = (steps: number, h = height, w = weight, unit = distanceUnit) => {
    const strideLengthMeters = (h * 0.414) / 100;
    const distanceKm = (steps * strideLengthMeters) / 1000;
    const distanceVal = unit === 'Mile' ? distanceKm * 0.621371 : distanceKm;
    const weightFactor = w / 70;
    const caloriesVal = steps * 0.04 * weightFactor;
    const durationMins = Math.round(steps * 0.008);
    return {
      calories: Number(caloriesVal.toFixed(1)),
      distance: Number(distanceVal.toFixed(2)),
      activeDuration: durationMins,
    };
  };

  // ─── Setters that also persist ────────────────────────────────────────────────
  const setRecords = (updater: StepRecord[] | ((prev: StepRecord[]) => StepRecord[])) => {
    setRecordsState((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      persist(STORAGE_KEYS.RECORDS, next);
      return next;
    });
  };

  const setDailyGoal = (goal: number) => {
    setDailyGoalState(goal);
    persist(STORAGE_KEYS.DAILY_GOAL, goal);
  };

  const setIsPaused = (paused: boolean) => {
    setIsPausedState(paused);
    // Note: isPaused itself is intentionally NOT persisted across restarts —
    // the counter always starts fresh on app open.
  };

  const setWaterIntake = (value: number | ((prev: number) => number)) => {
    setWaterIntakeState((prev) => {
      const next = typeof value === 'function' ? value(prev) : value;
      // Reset water at midnight — only persist if it's still the same day
      persist(STORAGE_KEYS.WATER_INTAKE, { value: next, date: todayISO() });
      return next;
    });
  };

  const setSelectedGoal = (goal: WalkingGoal) => {
    setSelectedGoalState(goal);
    persist(STORAGE_KEYS.SELECTED_GOAL, goal);
  };

  const setWeight = (w: number) => {
    // When weight is set from Settings or elsewhere, also record it in history
    addWeightRecord(w);
  };

  const setHeight = (h: number) => {
    setHeightState(h);
    persist(STORAGE_KEYS.HEIGHT, h);
  };

  const setDistanceUnit = (unit: DistanceUnit) => {
    setDistanceUnitState(unit);
    persist(STORAGE_KEYS.DISTANCE_UNIT, unit);
  };

  const setWeightHistory = (updater: WeightRecord[] | ((prev: WeightRecord[]) => WeightRecord[])) => {
    setWeightHistoryState((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      persist(STORAGE_KEYS.WEIGHT_HISTORY, next);
      return next;
    });
  };

  // ─── Load all persisted state on first mount ──────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [
        storedRecordsRaw,
        storedGoal,
        storedWaterRaw,
        storedSelectedGoal,
        storedWeight,
        storedHeight,
        storedDistanceUnit,
        storedWeightHistory,
        storedRemindersEnabled,
      ] = await Promise.all([
        load<StepRecordRaw[] | null>(STORAGE_KEYS.RECORDS, null),
        load<number | null>(STORAGE_KEYS.DAILY_GOAL, null),
        load<{ value: number; date: string } | null>(STORAGE_KEYS.WATER_INTAKE, null),
        load<WalkingGoal | null>(STORAGE_KEYS.SELECTED_GOAL, null),
        load<number | null>(STORAGE_KEYS.WEIGHT, null),
        load<number | null>(STORAGE_KEYS.HEIGHT, null),
        load<DistanceUnit | null>(STORAGE_KEYS.DISTANCE_UNIT, null),
        load<WeightRecord[]>(STORAGE_KEYS.WEIGHT_HISTORY, []),
        load<boolean | null>(STORAGE_KEYS.REMINDERS_ENABLED, null),
      ]);

      if (cancelled) return;

      // ── Records ──────────────────────────────────────────────────────────────
      if (storedRecordsRaw && storedRecordsRaw.length > 0) {
        setRecordsState(deserialiseRecords(storedRecordsRaw));
      }
      // else keep SEED_RECORDS (first launch)

      // ── Settings ─────────────────────────────────────────────────────────────
      if (storedGoal !== null) setDailyGoalState(storedGoal);
      if (storedSelectedGoal !== null) setSelectedGoalState(storedSelectedGoal);
      if (storedWeight !== null) setWeightState(storedWeight);
      if (storedHeight !== null) setHeightState(storedHeight);
      if (storedDistanceUnit !== null) setDistanceUnitState(storedDistanceUnit);
      if (storedWeightHistory.length > 0) setWeightHistoryState(storedWeightHistory);
      if (storedRemindersEnabled !== null) setRemindersEnabledState(storedRemindersEnabled);

      // ── Water intake — reset if it's a new day ────────────────────────────────
      if (storedWaterRaw !== null) {
        if (storedWaterRaw.date === todayISO()) {
          setWaterIntakeState(storedWaterRaw.value);
        } else {
          // New day: clear water and persist the reset
          persist(STORAGE_KEYS.WATER_INTAKE, { value: 0, date: todayISO() });
        }
      }

      // ── Today's steps — load from native SharedPreferences (source of truth) ──
      // The native service persists steps independently of AsyncStorage,
      // so this value is valid even after a force-close or crash.
      if (Platform.OS === 'android' && NativeModules.RNWalkCounter?.getTodaySteps) {
        try {
          const result = await NativeModules.RNWalkCounter.getTodaySteps();
          nativeBaseSteps.current = result?.steps ?? 0;
        } catch (e) {
          console.warn('[StepCounter] Could not read native step count:', e);
          nativeBaseSteps.current = 0;
        }
      }

      setIsLoaded(true);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // ─── Keep historical seed records in sync when profile changes ───
  useEffect(() => {
    if (!isLoaded) return;
    setRecords((prev) =>
      prev.map((r) => {
        // Skip today's live record — it will be kept in sync separately
        if (isSameDay(new Date(r.date), new Date())) return r;
        const metrics = calculateMetrics(r.steps);
        return { ...r, calories: metrics.calories, distance: metrics.distance, activeDuration: metrics.activeDuration };
      })
    );
  }, [weight, height, distanceUnit]);

  // ─── Keep today's record in sync with the live step count ───
  useEffect(() => {
    if (liveStepsToday === 0) return;
    const metrics = calculateMetrics(liveStepsToday);
    setRecords((prev) => {
      const today = new Date();
      const idx = prev.findIndex((r) => isSameDay(new Date(r.date), today));
      if (idx !== -1) {
        const updated = [...prev];
        updated[idx] = {
          ...updated[idx],
          steps: liveStepsToday,
          calories: metrics.calories,
          distance: metrics.distance,
          activeDuration: metrics.activeDuration,
        };
        return updated;
      }
      // Create today's record for the first time
      const newRec: StepRecord = {
        id: `today-live-${Date.now()}`,
        steps: liveStepsToday,
        calories: metrics.calories,
        distance: metrics.distance,
        activeDuration: metrics.activeDuration,
        date: today,
        note: 'Live tracking',
      };
      return [newRec, ...prev];
    });
  }, [liveStepsToday, weight, height, distanceUnit]);

  // ─── Request Android permission ───
  const requestPermission = async (): Promise<boolean> => {
    if (Platform.OS !== 'android') return true;
    try {
      const permissions = [PermissionsAndroid.PERMISSIONS.ACTIVITY_RECOGNITION];
      
      // POST_NOTIFICATIONS is required for Android 13+ (SDK 33+)
      if (Platform.Version >= 33) {
        const postNotificationPermission = (PermissionsAndroid.PERMISSIONS as any).POST_NOTIFICATIONS;
        if (postNotificationPermission) {
          permissions.push(postNotificationPermission);
        }
      }
      
      const granted = await PermissionsAndroid.requestMultiple(permissions);
      const activityGranted = granted[PermissionsAndroid.PERMISSIONS.ACTIVITY_RECOGNITION] === PermissionsAndroid.RESULTS.GRANTED;
      return activityGranted;
    } catch (e) {
      console.warn('[Permission] Failed to request permissions', e);
      return false;
    }
  };

  // ─── Start the native step counter ───
  const startSensor = async () => {
    if (!isNativeDevice || !startCounter) {
      console.log('[StepCounter] Skipping sensor start — not a native device.');
      return;
    }

    const hasPermission = await requestPermission();
    if (!hasPermission) {
      Alert.alert(
        'Permission Denied',
        'Step counting requires the Activity Recognition permission. Please enable it in your device settings.'
      );
      return;
    }

    // Reset the per-session counter before starting.
    // The native service will pick up from its own SharedPreferences automatically.
    setLiveSteps(0);

    startCounter({
      default_threshold: 15.0,
      default_delay: 150000000,
      cheatInterval: 3000,
      onStepCountChange: (stepCount: number) => {
        // stepCount is cumulative since startCounter was called this session.
        // The native service also counts independently; this just updates the UI.
        setLiveSteps(stepCount);
      },
      onCheat: () => {
        console.warn('[StepCounter] Cheat/shake detected — counter paused briefly.');
      },
    });

    setIsCounterRunning(true);
  };

  // ─── Stop the native step counter ───
  const stopSensor = () => {
    if (isNativeDevice && stopCounter) {
      stopCounter();
    }
    // No need to save to AsyncStorage — native SharedPreferences is the source of truth.
    // Update the base reference so the UI stays correct between sessions.
    nativeBaseSteps.current = nativeBaseSteps.current + liveSteps;
    setLiveSteps(0);
    setIsCounterRunning(false);
  };

  // ─── Start counter on mount (after storage is loaded); clean up on unmount ───
  useEffect(() => {
    if (!isLoaded) return;
    if (!isPaused) {
      startSensor();
    }
    return () => {
      // Always stop cleanly when the provider unmounts
      if (isNativeDevice && stopCounter) stopCounter();
    };
  }, [isLoaded]); // Run once after storage load

  // ─── React to pause/resume toggling ───
  useEffect(() => {
    if (!isLoaded) return;
    if (isPaused) {
      stopSensor();
    } else {
      // Only restart if it isn't already running
      if (!isCounterRunning) {
        startSensor();
      }
    }
  }, [isPaused]);

  // ─── Manual record management (used by the edit/add record screens) ───
  const addSteps = (steps: number, date: Date, note?: string) => {
    const metrics = calculateMetrics(steps);
    const sameDayIndex = records.findIndex((r) => isSameDay(new Date(r.date), date));

    if (sameDayIndex !== -1) {
      setRecords((prev) => {
        const updated = [...prev];
        const current = updated[sameDayIndex];
        const newSteps = current.steps + steps;
        const newMetrics = calculateMetrics(newSteps);
        updated[sameDayIndex] = {
          ...current,
          steps: newSteps,
          calories: newMetrics.calories,
          distance: newMetrics.distance,
          activeDuration: newMetrics.activeDuration,
          note: note || current.note,
        };
        return updated;
      });
    } else {
      const newRec: StepRecord = {
        id: `step-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        steps,
        calories: metrics.calories,
        distance: metrics.distance,
        activeDuration: metrics.activeDuration,
        date,
        note,
      };
      setRecords((prev) => [newRec, ...prev]);
    }
  };

  const updateSteps = (id: string, steps: number, date: Date, note?: string) => {
    const metrics = calculateMetrics(steps);
    setRecords((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              steps,
              calories: metrics.calories,
              distance: metrics.distance,
              activeDuration: metrics.activeDuration,
              date,
              note,
            }
          : r
      )
    );
  };

  const deleteSteps = (id: string) => {
    setRecords((prev) => prev.filter((r) => r.id !== id));
  };

  const addWater = (oz: number) => {
    setWaterIntake((prev) => {
      const next = prev + oz;
      return next > waterGoal ? 0 : next;
    });
  };

  function addWeightRecord(weightKg: number, dateIso?: string) {
    const today = dateIso ?? todayISO();
    setWeightHistory((prev) => {
      // Replace entry for that date if it already exists, otherwise append
      const idx = prev.findIndex((r) => r.date === today);
      if (idx !== -1) {
        const updated = [...prev];
        updated[idx] = { date: today, weight: weightKg };
        // Keep sorted by date
        return updated.sort((a, b) => a.date.localeCompare(b.date));
      }
      return [...prev, { date: today, weight: weightKg }].sort(
        (a, b) => a.date.localeCompare(b.date)
      );
    });
    setWeightState(weightKg);
    persist(STORAGE_KEYS.WEIGHT, weightKg);
  }

  const clearWeightHistory = () => {
    setWeightHistoryState([]);
    persist(STORAGE_KEYS.WEIGHT_HISTORY, []);
  };

  const scheduleDailyReminders = async () => {
    // Clear existing
    await Notifications.cancelAllScheduledNotificationsAsync();

    // Water reminders (9am, 1pm, 5pm)
    const waterTimes = [9, 13, 17];
    for (const hour of waterTimes) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "💧 Time to hydrate!",
          body: "Drink a glass of water to stay healthy.",
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: hour,
          minute: 0,
        },
      });
    }

    // Workout reminder (6pm)
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "🏃 Workout Time!",
        body: "Time for your daily workout.",
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: 18,
        minute: 0,
      },
    });
  };

  const toggleReminders = async (enabled: boolean) => {
    if (enabled) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== 'granted') {
        Alert.alert('Permission required', 'Please enable notifications in settings to use reminders.');
        return;
      }
      await scheduleDailyReminders();
    } else {
      await Notifications.cancelAllScheduledNotificationsAsync();
    }
    setRemindersEnabledState(enabled);
    persist(STORAGE_KEYS.REMINDERS_ENABLED, enabled);
  };

  const resetAllData = () => {
    stopSensor();
    nativeBaseSteps.current = 0;
    setLiveSteps(0);

    // Clear all persisted data
    AsyncStorage.multiRemove(Object.values(STORAGE_KEYS)).catch((e) =>
      console.warn('[Storage] Failed to clear data', e)
    );

    setRecordsState(SEED_RECORDS);
    setDailyGoalState(6000);
    setIsPausedState(false);
    setWaterIntakeState(0);
    setSelectedGoalState(defaultGoal);
    setWeightState(70);
    setHeightState(175);
    setDistanceUnitState('Mile');
    setWeightHistoryState([]);

    // Restart sensor after reset
    startSensor();
  };

  return (
    <SettingsContext.Provider
      value={{
        records,
        dailyGoal,
        isPaused,
        waterIntake,
        waterGoal,
        selectedGoal,
        weight,
        height,
        distanceUnit,
        weightHistory,
        isCounterRunning,
        liveStepsToday,
        isLoaded,
        remindersEnabled,
        toggleReminders,
        addSteps,
        updateSteps,
        deleteSteps,
        addWater,
        setDailyGoal,
        setIsPaused,
        setSelectedGoal,
        setWeight,
        setHeight,
        setDistanceUnit,
        addWeightRecord,
        clearWeightHistory,
        resetAllData,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
