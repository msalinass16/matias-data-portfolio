import type { Snapshot, Store } from "./store";
import { DEFAULT_GOALS, type DailyLog, type Goals, type WorkoutLog } from "./types";

const K_DAYS = "fit:days";
const K_WORKOUTS = "fit:workouts";
const K_GOALS = "fit:goals";
const K_VERSION = "fit:v";
const SCHEMA_VERSION = 2;

/**
 * v1 tenía push/pull/lower/full/5k/10k/otro y un campo `rpe`. v2 deja tres tipos de
 * fuerza y un único `running` con distancia y ritmo. Se remapea al cargar para que
 * los entrenos ya registrados no queden con un tipo que la app ya no sabe pintar.
 */
const V1_TYPE_MAP: Record<string, string> = {
  fuerza_push: "fuerza_upper",
  fuerza_pull: "fuerza_upper",
  fuerza_lower: "fuerza_lower",
  fuerza_full: "fuerza_full",
  otro: "fuerza_full",
  running_5k: "running",
  running_10k: "running",
};

const V1_DISTANCE: Record<string, number> = {
  running_5k: 5,
  running_10k: 10,
};

function migrateWorkouts(raw: WorkoutLog[]): WorkoutLog[] {
  return raw.map((w) => {
    const oldType = w.type as string;
    const mapped = V1_TYPE_MAP[oldType];
    if (!mapped) return w;

    const next = { ...w, type: mapped as WorkoutLog["type"] };
    if (V1_DISTANCE[oldType] != null && next.distance_km == null) {
      next.distance_km = V1_DISTANCE[oldType];
    }
    // `rpe` ya no existe en el modelo; se descarta al reescribir.
    delete (next as Record<string, unknown>).rpe;
    return next;
  });
}

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    // Storage corrupto o bloqueado: preferimos arrancar vacío antes que romper la app.
    return fallback;
  }
}

function write(key: string, value: unknown): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Cuota llena o modo privado. Silencioso a propósito: perder una escritura no
    // debe tumbar el formulario mientras el usuario está escribiendo.
  }
}

export const localStore: Store = {
  load(): Snapshot {
    let workouts = read<WorkoutLog[]>(K_WORKOUTS, []);

    if (typeof window !== "undefined") {
      const stored = Number(window.localStorage.getItem(K_VERSION) ?? 0);
      if (stored < SCHEMA_VERSION) {
        workouts = migrateWorkouts(workouts);
        write(K_WORKOUTS, workouts);
        write(K_VERSION, SCHEMA_VERSION);
      }
    }

    return {
      days: read<Record<string, DailyLog>>(K_DAYS, {}),
      workouts,
      goals: { ...DEFAULT_GOALS, ...read<Partial<Goals>>(K_GOALS, {}) },
    };
  },

  upsertDay(date, patch) {
    const days = read<Record<string, DailyLog>>(K_DAYS, {});
    const next: DailyLog = { ...days[date], ...patch, date };
    // Un campo borrado se elimina en vez de guardarse como undefined, para que
    // JSON.stringify no lo deje como clave fantasma.
    for (const k of Object.keys(next) as (keyof DailyLog)[]) {
      if (next[k] === undefined || next[k] === null) delete next[k];
    }
    days[date] = next;
    write(K_DAYS, days);
  },

  upsertWorkout(w) {
    const workouts = read<WorkoutLog[]>(K_WORKOUTS, []);
    const i = workouts.findIndex((x) => x.id === w.id);
    if (i >= 0) workouts[i] = w;
    else workouts.push(w);
    write(K_WORKOUTS, workouts);
  },

  removeWorkout(id) {
    write(
      K_WORKOUTS,
      read<WorkoutLog[]>(K_WORKOUTS, []).filter((w) => w.id !== id),
    );
  },

  saveGoals(goals) {
    write(K_GOALS, goals);
  },

  exportAll() {
    const snap = localStore.load();
    return JSON.stringify({ version: SCHEMA_VERSION, ...snap }, null, 2);
  },

  importAll(json) {
    const parsed = JSON.parse(json) as Partial<Snapshot>;
    if (!parsed || typeof parsed !== "object") throw new Error("Archivo inválido");
    write(K_DAYS, parsed.days ?? {});
    // Un respaldo viejo puede traer los tipos de v1; se remapea igual que al cargar.
    write(K_WORKOUTS, migrateWorkouts(parsed.workouts ?? []));
    write(K_GOALS, { ...DEFAULT_GOALS, ...(parsed.goals ?? {}) });
    write(K_VERSION, SCHEMA_VERSION);
  },
};
