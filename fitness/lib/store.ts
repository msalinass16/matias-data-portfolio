import type { DailyLog, Goals, WorkoutLog } from "./types";

/**
 * Contrato de persistencia. Toda la app habla con esta interfaz y nunca con
 * `localStorage` directamente, así que migrar a Supabase/SQLite más adelante es
 * escribir una implementación nueva sin tocar ninguna pantalla.
 */
export type Snapshot = {
  days: Record<string, DailyLog>;
  workouts: WorkoutLog[];
  goals: Goals;
};

export interface Store {
  /** Carga todo a memoria. Los volúmenes son diminutos (~400 filas/año). */
  load(): Snapshot;
  upsertDay(date: string, patch: Partial<DailyLog>): void;
  upsertWorkout(w: WorkoutLog): void;
  removeWorkout(id: string): void;
  saveGoals(goals: Goals): void;
  exportAll(): string;
  importAll(json: string): void;
}
