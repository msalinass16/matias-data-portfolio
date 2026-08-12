export type WorkoutType =
  | "fuerza_push"
  | "fuerza_pull"
  | "fuerza_lower"
  | "fuerza_full"
  | "running_5k"
  | "running_10k"
  | "otro";

export type Mood = 1 | 2 | 3 | 4 | 5;

/** Una entrada por día. `date` es la clave única, en formato 'YYYY-MM-DD' local. */
export type DailyLog = {
  date: string;
  weight_kg?: number;
  protein_g?: number;
  carbs_g?: number;
  fat_g?: number;
  kcal_total?: number;
  mood?: Mood;
  sleep_hours?: number;
  notes?: string;
};

/** Una entrada por sesión de entrenamiento. Varias por día. */
export type WorkoutLog = {
  id: string;
  date: string;
  type: WorkoutType;
  completed: boolean;
  rpe?: number;
  duration_min?: number;
  notes?: string;
};

export type Goals = {
  weight_target_min_kg?: number;
  weight_target_max_kg?: number;
  protein_target_g: number;
  kcal_target: number;
  weekly_strength_sessions_target: number;
  weekly_running_sessions_target: number;
  /** min/km */
  running_5k_target_pace?: number;
  /** min/km */
  running_10k_target_pace?: number;
};

export const DEFAULT_GOALS: Goals = {
  protein_target_g: 160,
  kcal_target: 2500,
  weekly_strength_sessions_target: 3,
  weekly_running_sessions_target: 2,
};

export const WORKOUT_TYPES: WorkoutType[] = [
  "fuerza_push",
  "fuerza_pull",
  "fuerza_lower",
  "fuerza_full",
  "running_5k",
  "running_10k",
  "otro",
];

export const WORKOUT_LABELS: Record<WorkoutType, string> = {
  fuerza_push: "Push",
  fuerza_pull: "Pull",
  fuerza_lower: "Lower",
  fuerza_full: "Full body",
  running_5k: "5K",
  running_10k: "10K",
  otro: "Otro",
};

export const WORKOUT_SHORT: Record<WorkoutType, string> = {
  fuerza_push: "PSH",
  fuerza_pull: "PLL",
  fuerza_lower: "LWR",
  fuerza_full: "FLL",
  running_5k: "5K",
  running_10k: "10K",
  otro: "—",
};

export function isStrength(type: WorkoutType): boolean {
  return type.startsWith("fuerza_");
}

export function isRunning(type: WorkoutType): boolean {
  return type.startsWith("running_");
}

/** Un día cuenta como "completo" si tiene peso y al menos proteína o kcal. */
export function isCompleteLog(log: DailyLog | undefined): boolean {
  if (!log) return false;
  const hasWeight = typeof log.weight_kg === "number";
  const hasMacros =
    typeof log.protein_g === "number" || typeof log.kcal_total === "number";
  return hasWeight && hasMacros;
}
