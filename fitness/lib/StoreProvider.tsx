"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { localStore } from "./localStore";
import type { Snapshot } from "./store";
import { DEFAULT_GOALS, type DailyLog, type Goals, type WorkoutLog } from "./types";

type Ctx = {
  ready: boolean;
  days: Record<string, DailyLog>;
  workouts: WorkoutLog[];
  goals: Goals;
  upsertDay: (date: string, patch: Partial<DailyLog>) => void;
  upsertWorkout: (w: WorkoutLog) => void;
  removeWorkout: (id: string) => void;
  saveGoals: (g: Goals) => void;
  exportAll: () => string;
  importAll: (json: string) => void;
};

const EMPTY: Snapshot = { days: {}, workouts: [], goals: DEFAULT_GOALS };

const StoreContext = createContext<Ctx | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  // Arranca vacío porque localStorage no existe en el render del servidor; el
  // efecto de abajo lo rellena en el primer frame del cliente.
  const [snap, setSnap] = useState<Snapshot>(EMPTY);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setSnap(localStore.load());
    setReady(true);
    // Le pide a iOS que no desaloje los datos si el disco se llena.
    navigator.storage?.persist?.().catch(() => {});
  }, []);

  const upsertDay = useCallback((date: string, patch: Partial<DailyLog>) => {
    localStore.upsertDay(date, patch);
    setSnap((s) => {
      const next: DailyLog = { ...s.days[date], ...patch, date };
      for (const k of Object.keys(next) as (keyof DailyLog)[]) {
        if (next[k] === undefined || next[k] === null) delete next[k];
      }
      return { ...s, days: { ...s.days, [date]: next } };
    });
  }, []);

  const upsertWorkout = useCallback((w: WorkoutLog) => {
    localStore.upsertWorkout(w);
    setSnap((s) => {
      const i = s.workouts.findIndex((x) => x.id === w.id);
      const workouts = [...s.workouts];
      if (i >= 0) workouts[i] = w;
      else workouts.push(w);
      return { ...s, workouts };
    });
  }, []);

  const removeWorkout = useCallback((id: string) => {
    localStore.removeWorkout(id);
    setSnap((s) => ({ ...s, workouts: s.workouts.filter((w) => w.id !== id) }));
  }, []);

  const saveGoals = useCallback((goals: Goals) => {
    localStore.saveGoals(goals);
    setSnap((s) => ({ ...s, goals }));
  }, []);

  const importAll = useCallback((json: string) => {
    localStore.importAll(json);
    setSnap(localStore.load());
  }, []);

  const value = useMemo<Ctx>(
    () => ({
      ready,
      days: snap.days,
      workouts: snap.workouts,
      goals: snap.goals,
      upsertDay,
      upsertWorkout,
      removeWorkout,
      saveGoals,
      exportAll: localStore.exportAll,
      importAll,
    }),
    [ready, snap, upsertDay, upsertWorkout, removeWorkout, saveGoals, importAll],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): Ctx {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore debe usarse dentro de <StoreProvider>");
  return ctx;
}
