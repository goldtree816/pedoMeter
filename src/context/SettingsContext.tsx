import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { Platform, PermissionsAndroid, Alert } from 'react-native';

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

  // User profile
  weight: number; // in kg
  height: number; // in cm
  distanceUnit: DistanceUnit;

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
  resetAllData: () => void;
}

const defaultGoal: WalkingGoal = 'stay_fit';

const makeDate = (daysAgo: number, hour: number, minute: number) => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(hour, minute, 0, 0);
  return d;
};

// ─── Seed records for the previous 6 days only (today is handled by the live sensor) ───
const SEED_RECORDS: StepRecord[] = [
  {
    id: 'seed-1',
    steps: 6681,
    calories: 267.2,
    distance: 3.12,
    activeDuration: 53,
    date: makeDate(1, 17, 15),
    note: 'Evening walk',
  },
  {
    id: 'seed-2',
    steps: 6400,
    calories: 256.0,
    distance: 2.98,
    activeDuration: 51,
    date: makeDate(2, 16, 45),
    note: 'Walk back from work',
  },
  {
    id: 'seed-3',
    steps: 5900,
    calories: 236.0,
    distance: 2.75,
    activeDuration: 47,
    date: makeDate(3, 10, 0),
    note: 'Park walk',
  },
  {
    id: 'seed-4',
    steps: 3800,
    calories: 152.0,
    distance: 1.77,
    activeDuration: 30,
    date: makeDate(4, 15, 30),
    note: 'Shopping run',
  },
  {
    id: 'seed-5',
    steps: 6200,
    calories: 248.0,
    distance: 2.89,
    activeDuration: 49,
    date: makeDate(5, 18, 0),
    note: 'After dinner stroll',
  },
  {
    id: 'seed-6',
    steps: 5100,
    calories: 204.0,
    distance: 2.38,
    activeDuration: 40,
    date: makeDate(6, 12, 15),
    note: 'Lunch walk',
  },
];

// ─── Helper: check if two Date objects are the same calendar day ───
const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [records, setRecords] = useState<StepRecord[]>(SEED_RECORDS);
  const [dailyGoal, setDailyGoal] = useState(6000);
  const [isPaused, setIsPaused] = useState(false);
  const [waterIntake, setWaterIntake] = useState(0);
  const [waterGoal] = useState(24);
  const [selectedGoal, setSelectedGoal] = useState<WalkingGoal>(defaultGoal);
  const [weight, setWeight] = useState(70);
  const [height, setHeight] = useState(175);
  const [distanceUnit, setDistanceUnit] = useState<DistanceUnit>('Mile');
  const [isCounterRunning, setIsCounterRunning] = useState(false);

  // liveSteps holds the raw step count from the sensor since the counter last started.
  // We keep it separate so we don't double-count on restarts.
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

  // ─── Keep historical seed records in sync when profile changes ───
  useEffect(() => {
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
    sessionBaseSteps.current += liveSteps;
    setLiveSteps(0);
    setIsCounterRunning(false);
  };

  // ─── Start counter on mount; clean up on unmount ───
  useEffect(() => {
    if (!isPaused) {
      startSensor();
    }
    return () => {
      // Always stop cleanly when the provider unmounts
      if (isNativeDevice && stopCounter) stopCounter();
    };
  }, []); // Run once on mount

  // ─── React to pause/resume toggling ───
  useEffect(() => {
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

  const resetAllData = () => {
    stopSensor();
    sessionBaseSteps.current = 0;
    setLiveSteps(0);
    setRecords(SEED_RECORDS);
    setDailyGoal(6000);
    setIsPaused(false);
    setWaterIntake(0);
    setSelectedGoal(defaultGoal);
    setWeight(70);
    setHeight(175);
    setDistanceUnit('Mile');
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
        isCounterRunning,
        liveStepsToday,
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
