import { addDays, lastNDays, toKey, weekStart } from "./dates";
import {
  isCompleteLog,
  isRunning,
  isStrength,
  type DailyLog,
  type WorkoutLog,
} from "./types";

/** Promedio de los pesos registrados en la ventana de N días que termina en `end`. */
export function movingAverage(
  days: Record<string, DailyLog>,
  end: string,
  window = 7,
): number | undefined {
  const vals: number[] = [];
  for (const key of lastNDays(window, end)) {
    const w = days[key]?.weight_kg;
    if (typeof w === "number") vals.push(w);
  }
  if (vals.length === 0) return undefined;
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

/**
 * Serie de medias móviles, un punto por día. Los días sin suficiente historial
 * quedan como `undefined` para que el gráfico no invente una línea plana.
 */
export function movingAverageSeries(
  days: Record<string, DailyLog>,
  keys: string[],
  window = 7,
): (number | undefined)[] {
  return keys.map((k) => movingAverage(days, k, window));
}

/**
 * Racha de días consecutivos con log completo (peso + macros). Si hoy todavía no
 * está completo, cuenta hasta ayer — así la racha no se muestra en cero toda la
 * mañana antes de registrar el día.
 */
export function currentStreak(
  days: Record<string, DailyLog>,
  today = toKey(new Date()),
): number {
  let cursor = isCompleteLog(days[today]) ? today : addDays(today, -1);
  let n = 0;
  while (isCompleteLog(days[cursor])) {
    n++;
    cursor = addDays(cursor, -1);
  }
  return n;
}

export type SessionCounts = { strength: number; running: number; other: number };

/** Sesiones completadas dentro de un rango de fechas inclusivo. */
export function countSessions(
  workouts: WorkoutLog[],
  from: string,
  to: string,
): SessionCounts {
  const counts: SessionCounts = { strength: 0, running: 0, other: 0 };
  for (const w of workouts) {
    if (!w.completed || w.date < from || w.date > to) continue;
    if (isStrength(w.type)) counts.strength++;
    else if (isRunning(w.type)) counts.running++;
    else counts.other++;
  }
  return counts;
}

/** Sesiones de la semana calendario (lunes a domingo) que contiene `key`. */
export function weekSessions(workouts: WorkoutLog[], key: string): SessionCounts {
  const start = weekStart(key);
  return countSessions(workouts, start, addDays(start, 6));
}

export type WeekBucket = {
  start: string;
  strength: number;
  running: number;
  adherence: number; // 0-1, sesiones cumplidas vs objetivo semanal
  avgProtein?: number;
  avgKcal?: number;
  avgWeight?: number;
  completeDays: number;
};

/** Agrupa en semanas calendario, de la más antigua a la más reciente. */
export function weeklyBuckets(
  days: Record<string, DailyLog>,
  workouts: WorkoutLog[],
  nWeeks: number,
  strengthTarget: number,
  runningTarget: number,
  today = toKey(new Date()),
): WeekBucket[] {
  const thisWeek = weekStart(today);
  const out: WeekBucket[] = [];

  for (let i = nWeeks - 1; i >= 0; i--) {
    const start = addDays(thisWeek, -7 * i);
    const end = addDays(start, 6);
    const counts = countSessions(workouts, start, end);

    const protein: number[] = [];
    const kcal: number[] = [];
    const weight: number[] = [];
    let completeDays = 0;

    for (let d = 0; d < 7; d++) {
      const log = days[addDays(start, d)];
      if (!log) continue;
      if (typeof log.protein_g === "number") protein.push(log.protein_g);
      if (typeof log.kcal_total === "number") kcal.push(log.kcal_total);
      if (typeof log.weight_kg === "number") weight.push(log.weight_kg);
      if (isCompleteLog(log)) completeDays++;
    }

    const target = strengthTarget + runningTarget;
    const done =
      Math.min(counts.strength, strengthTarget) +
      Math.min(counts.running, runningTarget);

    out.push({
      start,
      strength: counts.strength,
      running: counts.running,
      adherence: target > 0 ? done / target : 0,
      avgProtein: mean(protein),
      avgKcal: mean(kcal),
      avgWeight: mean(weight),
      completeDays,
    });
  }
  return out;
}

function mean(xs: number[]): number | undefined {
  if (xs.length === 0) return undefined;
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}
