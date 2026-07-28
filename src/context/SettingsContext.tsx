import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { Platform, PermissionsAndroid, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
  SESSION_BASE_STEPS: '@stepcounter/sessionBaseSteps',
  SESSION_DATE: '@stepcounter/sessionDate',
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

  // liveSteps holds the raw step count from the sensor since the counter last started.
  const [liveSteps, setLiveSteps] = useState(0);

  // Accumulated steps from previous sessions today (e.g. after pause/resume).
  const sessionBaseSteps = useRef(0);

  // ─── Derived: total steps for today = base (past sessions) + current sensor reading ───
  const liveStepsToday = sessionBaseSteps.current + liveSteps;

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
        storedSessionInfo,
      ] = await Promise.all([
        load<StepRecordRaw[] | null>(STORAGE_KEYS.RECORDS, null),
        load<number | null>(STORAGE_KEYS.DAILY_GOAL, null),
        load<{ value: number; date: string } | null>(STORAGE_KEYS.WATER_INTAKE, null),
        load<WalkingGoal | null>(STORAGE_KEYS.SELECTED_GOAL, null),
        load<number | null>(STORAGE_KEYS.WEIGHT, null),
        load<number | null>(STORAGE_KEYS.HEIGHT, null),
        load<DistanceUnit | null>(STORAGE_KEYS.DISTANCE_UNIT, null),
        load<WeightRecord[]>(STORAGE_KEYS.WEIGHT_HISTORY, []),
        load<{ steps: number; date: string } | null>(STORAGE_KEYS.SESSION_BASE_STEPS, null),
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

      // ── Water intake — reset if it's a new day ────────────────────────────────
      if (storedWaterRaw !== null) {
        if (storedWaterRaw.date === todayISO()) {
          setWaterIntakeState(storedWaterRaw.value);
        } else {
          // New day: clear water and persist the reset
          persist(STORAGE_KEYS.WATER_INTAKE, { value: 0, date: todayISO() });
        }
      }

      // ── Today's accumulated step base (resets on new day) ─────────────────────
      if (storedSessionInfo !== null && storedSessionInfo.date === todayISO()) {
        sessionBaseSteps.current = storedSessionInfo.steps;
      } else if (storedSessionInfo !== null && storedSessionInfo.date !== todayISO()) {
        // New day: reset session base
        sessionBaseSteps.current = 0;
        persist(STORAGE_KEYS.SESSION_BASE_STEPS, { steps: 0, date: todayISO() });
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
    if (Platform.OS !== 'android') return true; // iOS doesn't need this permission for accelerometer
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACTIVITY_RECOGNITION,
        {
          title: 'Step Counter Permission',
          message:
            'This app needs access to your physical activity to count your steps accurately.',
          buttonPositive: 'Allow',
          buttonNegative: 'Deny',
        }
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch {
      return false;
    }
  };

  // ─── Start the native step counter ───
  const startSensor = async () => {
    // Step counting is only available on Android/iOS native builds.
    if (!isNativeDevice || !startCounter) {
      console.log('[StepCounter] Skipping sensor start — not a native device (web/simulator).');
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

    // Reset the per-session counter before starting
    setLiveSteps(0);

    startCounter({
      default_threshold: 15.0,   // Sensitivity — lower = more sensitive
      default_delay: 150000000,  // Min time between steps (nanoseconds = 150ms)
      cheatInterval: 3000,       // Lock-out period after shake detected (ms)
      onStepCountChange: (stepCount: number) => {
        // stepCount is cumulative since startCounter was called this session
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
    // Save whatever the sensor reported into the base so it isn't lost on next start
    const newBase = sessionBaseSteps.current + liveSteps;
    sessionBaseSteps.current = newBase;
    persist(STORAGE_KEYS.SESSION_BASE_STEPS, { steps: newBase, date: todayISO() });
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

  const resetAllData = () => {
    stopSensor();
    sessionBaseSteps.current = 0;
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
