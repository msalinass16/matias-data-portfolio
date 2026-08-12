export type WorkoutType =
  | "fuerza_upper"
  | "fuerza_lower"
  | "fuerza_full"
  | "running";

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

/**
 * Una entrada por sesión. Fuerza y running usan campos distintos a propósito:
 * en fuerza solo interesa cuánto duró, y en running la distancia y el ritmo
 * (de los que se deriva el tiempo).
 */
export type WorkoutLog = {
  id: string;
  date: string;
  type: WorkoutType;
  completed: boolean;
  /** Solo fuerza. */
  duration_min?: number;
  /** Solo running. */
  distance_km?: number;
  /** Solo running. Segundos por kilómetro: entero, sin decimales que arrastren error. */
  pace_sec_per_km?: number;
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

/** Los tipos que se eligen con un chip. Running tiene su propia sección. */
export const STRENGTH_TYPES: WorkoutType[] = [
  "fuerza_upper",
  "fuerza_lower",
  "fuerza_full",
];

export const WORKOUT_LABELS: Record<WorkoutType, string> = {
  fuerza_upper: "Upper",
  fuerza_lower: "Lower",
  fuerza_full: "Full body",
  running: "Running",
};

export const WORKOUT_SHORT: Record<WorkoutType, string> = {
  fuerza_upper: "UPR",
  fuerza_lower: "LWR",
  fuerza_full: "FULL",
  running: "RUN",
};

export const DEFAULT_DISTANCE_KM = 5;
export const DEFAULT_PACE_SEC = 360; // 6:00 min/km

export function isStrength(type: WorkoutType): boolean {
  return type.startsWith("fuerza_");
}

export function isRunning(type: WorkoutType): boolean {
  return type === "running";
}

/** 360 → '6:00'. */
export function formatPace(secPerKm: number): string {
  const m = Math.floor(secPerKm / 60);
  const s = Math.round(secPerKm % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

/** Minutos totales de una carrera, derivados de distancia y ritmo. */
export function runDurationMin(w: WorkoutLog): number | undefined {
  if (w.distance_km == null || w.pace_sec_per_km == null) return undefined;
  return (w.distance_km * w.pace_sec_per_km) / 60;
}

/** '52 min' o '1 h 12 min'. */
export function formatMinutes(min: number): string {
  const total = Math.round(min);
  if (total < 60) return `${total} min`;
  return `${Math.floor(total / 60)} h ${String(total % 60).padStart(2, "0")} min`;
}

/** Un día cuenta como "completo" si tiene peso y al menos proteína o kcal. */
export function isCompleteLog(log: DailyLog | undefined): boolean {
  if (!log) return false;
  const hasWeight = typeof log.weight_kg === "number";
  const hasMacros =
    typeof log.protein_g === "number" || typeof log.kcal_total === "number";
  return hasWeight && hasMacros;
}
