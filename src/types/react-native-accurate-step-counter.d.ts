/**
 * Type declarations for react-native-accurate-step-counter
 * (The package has no official @types, so we declare them manually here)
 */
declare module 'react-native-accurate-step-counter' {
  export interface StepCounterConfig {
    /** Accelerometer sensitivity. Higher = less sensitive. Default: 15.0 */
    default_threshold?: number;
    /** Minimum time between steps in nanoseconds. Default: 150000000 (150ms) */
    default_delay?: number;
    /** Lockout period in ms after a cheat (shake) is detected. Default: 3000 */
    cheatInterval?: number;
    /** Called every time the step count changes. Receives the cumulative count for this session. */
    onStepCountChange: (stepCount: number) => void;
    /** Optional callback when shake/cheat is detected */
    onCheat?: () => void;
  }

  /** Start counting steps with the given configuration */
  export function startCounter(config: StepCounterConfig): void;

  /** Stop counting steps and remove all event listeners */
  export function stopCounter(): void;
}
