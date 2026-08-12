"use client";

import { useEffect, useState } from "react";
import WeeklyBars from "@/components/WeeklyBars";
import WeightChart from "@/components/WeightChart";
import { daySlashMonth, lastNDays, todayKey } from "@/lib/dates";
import { movingAverageSeries, weeklyBuckets } from "@/lib/stats";
import { useStore } from "@/lib/StoreProvider";

const WEEKS = 8;

export default function TendenciasPage() {
  const { ready, days, workouts, goals } = useStore();
  const [today, setToday] = useState("");

  useEffect(() => setToday(todayKey()), []);

  if (!ready || !today) return <div className="h-64" aria-hidden />;

  const keys = lastNDays(WEEKS * 7, today);
  const ma = movingAverageSeries(days, keys);
  const buckets = weeklyBuckets(
    days,
    workouts,
    WEEKS,
    goals.weekly_strength_sessions_target,
    goals.weekly_running_sessions_target,
    today,
  );

  const labels = buckets.map((b) => daySlashMonth(b.start));
  const hasAnything = keys.some((k) => days[k] || workouts.some((w) => w.date === k));

  return (
    <div className="space-y-4">
      <header className="pt-1">
        <h1 className="text-[27px] font-bold leading-none">Tendencias</h1>
        <p className="mt-1 text-[13px] text-muted">Últimas {WEEKS} semanas</p>
      </header>

      {!hasAnything && (
        <p className="rounded-2xl border border-border bg-surface/60 p-4 text-[13px] text-muted">
          Todavía no hay historial. Registra unos días en Hoy y esta pantalla se llena sola.
        </p>
      )}

      <section className="rounded-2xl border border-border bg-surface/60 p-3">
        <h2 className="mb-2 text-[13px] font-semibold text-muted">Peso</h2>
        <WeightChart keys={keys} days={days} ma={ma} goals={goals} />
      </section>

      <section className="rounded-2xl border border-border bg-surface/60 p-3">
        <h2 className="text-[13px] font-semibold text-muted">Adherencia a entrenos</h2>
        <p className="mb-3 mt-0.5 text-[11px] text-muted">
          % del objetivo semanal ({goals.weekly_strength_sessions_target} fuerza +{" "}
          {goals.weekly_running_sessions_target} running)
        </p>
        <WeeklyBars
          data={buckets.map((b, i) => ({
            label: labels[i],
            value: Math.round(b.adherence * 100),
          }))}
          max={100}
          format={(v) => `${v}%`}
          ariaLabel="Porcentaje de sesiones cumplidas por semana"
        />
      </section>

      <section className="rounded-2xl border border-border bg-surface/60 p-3">
        <h2 className="mb-3 text-[13px] font-semibold text-muted">
          Proteína · promedio diario
        </h2>
        <WeeklyBars
          data={buckets.map((b, i) => ({
            label: labels[i],
            value: b.avgProtein != null ? Math.round(b.avgProtein) : undefined,
          }))}
          max={Math.max(goals.protein_target_g * 1.2, ...maxOf(buckets.map((b) => b.avgProtein)))}
          target={goals.protein_target_g}
          targetLabel={`Objetivo ${goals.protein_target_g} g`}
          format={(v) => `${Math.round(v)}`}
          ariaLabel="Proteína promedio por semana frente al objetivo"
        />
      </section>

      <section className="rounded-2xl border border-border bg-surface/60 p-3">
        <h2 className="mb-3 text-[13px] font-semibold text-muted">
          Calorías · promedio diario
        </h2>
        <WeeklyBars
          data={buckets.map((b, i) => ({
            label: labels[i],
            value: b.avgKcal != null ? Math.round(b.avgKcal) : undefined,
          }))}
          max={Math.max(goals.kcal_target * 1.2, ...maxOf(buckets.map((b) => b.avgKcal)))}
          target={goals.kcal_target}
          targetLabel={`Objetivo ${goals.kcal_target} kcal`}
          format={(v) => (v >= 1000 ? `${(v / 1000).toFixed(1)}k` : `${Math.round(v)}`)}
          ariaLabel="Calorías promedio por semana frente al objetivo"
        />
      </section>
    </div>
  );
}

/** Los valores presentes, o [0] si no hay ninguno: evita `Math.max()` = -Infinity. */
function maxOf(values: (number | undefined)[]): number[] {
  const present = values.filter((v): v is number => typeof v === "number");
  return present.length ? present : [0];
}
