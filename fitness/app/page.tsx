"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import NumberField from "@/components/NumberField";
import { longLabel, todayKey } from "@/lib/dates";
import { currentStreak } from "@/lib/stats";
import { useStore } from "@/lib/StoreProvider";
import {
  WORKOUT_LABELS,
  WORKOUT_TYPES,
  type DailyLog,
  type Mood,
  type WorkoutLog,
  type WorkoutType,
} from "@/lib/types";

export default function HomePage() {
  const { ready, days, workouts, upsertDay, upsertWorkout, removeWorkout } = useStore();
  const [today, setToday] = useState("");
  const [saved, setSaved] = useState(false);
  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // La fecha se calcula en el cliente: el servidor puede estar en otra zona horaria.
  useEffect(() => setToday(todayKey()), []);
  useEffect(() => () => { if (savedTimer.current) clearTimeout(savedTimer.current); }, []);

  const flashSaved = useCallback(() => {
    setSaved(true);
    if (savedTimer.current) clearTimeout(savedTimer.current);
    savedTimer.current = setTimeout(() => setSaved(false), 1600);
  }, []);

  const log: DailyLog = (today && days[today]) || { date: today };
  const todayWorkouts = workouts.filter((w) => w.date === today);

  // Las kcal se autocalculan desde los macros hasta que se escriben a mano; a partir
  // de ahí manda el número de Cronometer y dejamos de tocarlo.
  const [kcalManual, setKcalManual] = useState(false);
  useEffect(() => {
    if (ready && today) setKcalManual(typeof days[today]?.kcal_total === "number");
    // Solo al hidratar: después el estado lo maneja el propio campo de kcal.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, today]);

  const patch = useCallback(
    (p: Partial<DailyLog>) => {
      if (!today) return;
      upsertDay(today, p);
      flashSaved();
    },
    [today, upsertDay, flashSaved],
  );

  function setMacro(key: "protein_g" | "carbs_g" | "fat_g", value: number | undefined) {
    const p: Partial<DailyLog> = { [key]: value };
    if (!kcalManual) {
      const next = { ...log, [key]: value };
      const prot = next.protein_g ?? 0;
      const carb = next.carbs_g ?? 0;
      const fat = next.fat_g ?? 0;
      p.kcal_total =
        prot || carb || fat ? Math.round(4 * prot + 4 * carb + 9 * fat) : undefined;
    }
    patch(p);
  }

  function toggleWorkout(type: WorkoutType) {
    const existing = todayWorkouts.find((w) => w.type === type);
    if (existing) removeWorkout(existing.id);
    else
      upsertWorkout({
        id: crypto.randomUUID(),
        date: today,
        type,
        completed: true,
      });
    flashSaved();
  }

  function editWorkout(w: WorkoutLog, p: Partial<WorkoutLog>) {
    upsertWorkout({ ...w, ...p });
    flashSaved();
  }

  if (!ready || !today) return <HomeSkeleton />;

  const streak = currentStreak(days, today);

  return (
    <div className="space-y-4">
      <header className="flex items-start justify-between gap-3 pt-1">
        <div className="min-w-0">
          <h1 className="text-[27px] font-bold leading-none">Hoy</h1>
          <p className="mt-1 truncate text-[13px] text-muted first-letter:uppercase">
            {longLabel(today)}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          {streak > 0 && (
            <span className="rounded-full bg-accent-soft px-2.5 py-1 text-[12px] font-semibold text-accent">
              {streak} {streak === 1 ? "día seguido" : "días seguidos"}
            </span>
          )}
          <span
            aria-live="polite"
            className={`text-[11px] font-medium text-accent transition-opacity ${
              saved ? "opacity-100" : "opacity-0"
            }`}
          >
            Guardado ✓
          </span>
        </div>
      </header>

      {/* 1. Peso — lo primero de la mañana, el campo más grande de la app. */}
      <section
        className={`rounded-2xl border border-border bg-surface/60 px-3 pb-3 ${
          log.weight_kg == null ? "pt-3" : "pt-2"
        }`}
      >
        <div className="mb-1.5 flex items-center justify-between">
          <h2 className="text-[13px] font-semibold text-muted">Peso al despertar</h2>
          {log.weight_kg != null && <span className="text-[13px] text-accent">✓</span>}
        </div>
        <NumberField
          value={log.weight_kg}
          onCommit={(v) => patch({ weight_kg: v })}
          decimal
          size="lg"
          suffix="kg"
          ariaLabel="Peso en kilos"
        />
      </section>

      {/* 2. Macros — cuatro campos en una fila, sin scroll. */}
      <section className="rounded-2xl border border-border bg-surface/60 p-3">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-[13px] font-semibold text-muted">Macros</h2>
          {!kcalManual && log.kcal_total != null && (
            <span className="text-[11px] text-muted">kcal calculadas</span>
          )}
        </div>
        <div className="grid grid-cols-4 gap-2">
          <NumberField
            label="Prot"
            value={log.protein_g}
            onCommit={(v) => setMacro("protein_g", v)}
            ariaLabel="Proteína en gramos"
          />
          <NumberField
            label="Carbs"
            value={log.carbs_g}
            onCommit={(v) => setMacro("carbs_g", v)}
            ariaLabel="Carbohidratos en gramos"
          />
          <NumberField
            label="Grasa"
            value={log.fat_g}
            onCommit={(v) => setMacro("fat_g", v)}
            ariaLabel="Grasa en gramos"
          />
          <NumberField
            label="Kcal"
            value={log.kcal_total}
            onCommit={(v) => {
              setKcalManual(v != null);
              patch({ kcal_total: v });
            }}
            ariaLabel="Calorías totales"
          />
        </div>
      </section>

      {/* 3. Entrenos — un tap marca la sesión y despliega RPE y duración. */}
      <section className="rounded-2xl border border-border bg-surface/60 p-3">
        <h2 className="mb-2 text-[13px] font-semibold text-muted">Entrenos de hoy</h2>
        <div className="flex flex-wrap gap-2">
          {WORKOUT_TYPES.map((type) => {
            const active = todayWorkouts.some((w) => w.type === type);
            return (
              <button
                key={type}
                type="button"
                aria-pressed={active}
                onClick={() => toggleWorkout(type)}
                className={`h-11 min-w-[68px] rounded-xl border px-3 text-[15px] font-semibold transition-colors ${
                  active
                    ? "border-accent bg-accent text-accent-fg"
                    : "border-border bg-bg text-fg"
                }`}
              >
                {WORKOUT_LABELS[type]}
              </button>
            );
          })}
        </div>

        {todayWorkouts.length > 0 && (
          <ul className="mt-3 space-y-2">
            {todayWorkouts.map((w) => (
              <li key={w.id} className="rounded-xl bg-bg p-3">
                <div className="mb-1.5 flex items-baseline justify-between">
                  <span className="text-[14px] font-semibold">
                    {WORKOUT_LABELS[w.type]}
                  </span>
                  <span className="text-[13px] tabular-nums text-muted">
                    RPE {w.rpe ?? "—"}
                  </span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={10}
                  step={1}
                  value={w.rpe ?? 7}
                  aria-label={`RPE de ${WORKOUT_LABELS[w.type]}`}
                  onChange={(e) => editWorkout(w, { rpe: Number(e.target.value) })}
                  className="h-7 w-full"
                />
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-[12px] text-muted">Duración</span>
                  <div className="w-24">
                    <NumberField
                      value={w.duration_min}
                      onCommit={(v) => editWorkout(w, { duration_min: v })}
                      placeholder="min"
                      ariaLabel={`Duración de ${WORKOUT_LABELS[w.type]} en minutos`}
                    />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* 4. Opcional — colapsado para que no empuje nada de lo anterior. */}
      <details className="rounded-2xl border border-border bg-surface/60">
        <summary className="cursor-pointer list-none px-3 py-3 text-[13px] font-semibold text-muted marker:hidden">
          Opcional · ánimo, sueño, notas
        </summary>
        <div className="space-y-3 px-3 pb-3">
          <div>
            <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-muted">
              Ánimo
            </span>
            <div className="flex gap-2">
              {([1, 2, 3, 4, 5] as Mood[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  aria-pressed={log.mood === m}
                  onClick={() => patch({ mood: log.mood === m ? undefined : m })}
                  className={`h-11 flex-1 rounded-xl border text-[15px] font-semibold ${
                    log.mood === m
                      ? "border-accent bg-accent text-accent-fg"
                      : "border-border bg-bg text-fg"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
          <div className="w-32">
            <NumberField
              label="Sueño (h)"
              value={log.sleep_hours}
              onCommit={(v) => patch({ sleep_hours: v })}
              decimal
            />
          </div>
          <label className="block">
            <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-muted">
              Notas
            </span>
            <input
              type="text"
              defaultValue={log.notes ?? ""}
              onBlur={(e) => patch({ notes: e.target.value.trim() || undefined })}
              placeholder="Opcional"
              className="h-12 w-full rounded-xl border border-border bg-surface px-3 text-[16px] outline-none placeholder:text-muted/60 focus:border-accent"
            />
          </label>
        </div>
      </details>
    </div>
  );
}

function HomeSkeleton() {
  return (
    <div className="space-y-4" aria-hidden>
      <div className="h-12" />
      <div className="h-28 rounded-2xl bg-surface/60" />
      <div className="h-28 rounded-2xl bg-surface/60" />
      <div className="h-28 rounded-2xl bg-surface/60" />
    </div>
  );
}
