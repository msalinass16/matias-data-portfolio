"use client";

import { useEffect, useState } from "react";
import Sparkline from "@/components/Sparkline";
import { addDays, lastNDays, shortLabel, todayKey, weekStart } from "@/lib/dates";
import { currentStreak, movingAverage, movingAverageSeries, weekSessions } from "@/lib/stats";
import { useStore } from "@/lib/StoreProvider";
import { WORKOUT_SHORT, isCompleteLog } from "@/lib/types";

export default function SemanaPage() {
  const { ready, days, workouts, goals } = useStore();
  const [today, setToday] = useState("");

  useEffect(() => setToday(todayKey()), []);

  if (!ready || !today) return <div className="h-64" aria-hidden />;

  const keys = lastNDays(7, today);
  const ma7 = movingAverage(days, today);
  const ma7Prev = movingAverage(days, addDays(today, -7));
  const delta = ma7 != null && ma7Prev != null ? ma7 - ma7Prev : undefined;
  const sparkValues = movingAverageSeries(days, lastNDays(14, today));

  const sessions = weekSessions(workouts, today);
  const streak = currentStreak(days, today);
  const completeThisWeek = lastNDays(7, today).filter((k) =>
    isCompleteLog(days[k]),
  ).length;
  const start = weekStart(today);

  return (
    <div className="space-y-4">
      <header className="pt-1">
        <h1 className="text-[27px] font-bold leading-none">Semana</h1>
        <p className="mt-1 text-[13px] text-muted">Últimos 7 días</p>
      </header>

      {/* Peso: lo que importa es la media móvil, no el dato crudo de hoy. */}
      <section className="rounded-2xl border border-border bg-surface/60 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-[12px] font-semibold uppercase tracking-wide text-muted">
              Peso · media 7d
            </h2>
            <p className="mt-1 text-[34px] font-bold leading-none tabular-nums">
              {ma7 != null ? ma7.toFixed(1) : "—"}
              {ma7 != null && (
                <span className="ml-1 text-[15px] font-medium text-muted">kg</span>
              )}
            </p>
            {delta != null && (
              <p className="mt-1 text-[13px] tabular-nums text-muted">
                {delta >= 0 ? "+" : "−"}
                {Math.abs(delta).toFixed(2)} kg vs. semana pasada
              </p>
            )}
          </div>
          <div className="pt-1">
            <Sparkline values={sparkValues} />
          </div>
        </div>
        {(goals.weight_target_min_kg != null || goals.weight_target_max_kg != null) && (
          <p className="mt-3 border-t border-border pt-2 text-[12px] text-muted">
            Objetivo: {goals.weight_target_min_kg ?? "—"}–{goals.weight_target_max_kg ?? "—"} kg
          </p>
        )}
      </section>

      {/* Sesiones: semana calendario, que es contra lo que se define el objetivo. */}
      <section className="rounded-2xl border border-border bg-surface/60 p-4">
        <h2 className="text-[12px] font-semibold uppercase tracking-wide text-muted">
          Sesiones · semana en curso
        </h2>
        <p className="mb-3 mt-0.5 text-[11px] text-muted">
          Desde el {shortLabel(start)}
        </p>
        <div className="space-y-3">
          <ProgressRow
            label="Fuerza"
            done={sessions.strength}
            target={goals.weekly_strength_sessions_target}
          />
          <ProgressRow
            label="Running"
            done={sessions.running}
            target={goals.weekly_running_sessions_target}
          />
          {sessions.other > 0 && (
            <p className="text-[12px] text-muted">+{sessions.other} otras sesiones</p>
          )}
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-border bg-surface/60 p-4">
          <p className="text-[12px] font-semibold uppercase tracking-wide text-muted">
            Racha
          </p>
          <p className="mt-1 text-[28px] font-bold leading-none tabular-nums">{streak}</p>
          <p className="mt-1 text-[12px] text-muted">
            {streak === 1 ? "día seguido completo" : "días seguidos completos"}
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-surface/60 p-4">
          <p className="text-[12px] font-semibold uppercase tracking-wide text-muted">
            Completos
          </p>
          <p className="mt-1 text-[28px] font-bold leading-none tabular-nums">
            {completeThisWeek}
            <span className="text-[16px] font-medium text-muted">/7</span>
          </p>
          <p className="mt-1 text-[12px] text-muted">peso + macros</p>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-border bg-surface/60">
        {[...keys].reverse().map((key, i) => {
          const log = days[key];
          const dayWorkouts = workouts.filter((w) => w.date === key && w.completed);
          return (
            <div
              key={key}
              className={`flex items-center gap-3 px-4 py-2.5 ${
                i > 0 ? "border-t border-border" : ""
              }`}
            >
              <span
                className={`w-14 shrink-0 text-[13px] font-semibold ${
                  key === today ? "text-accent" : "text-muted"
                }`}
              >
                {key === today ? "Hoy" : shortLabel(key)}
              </span>
              <span className="w-14 shrink-0 text-[15px] tabular-nums">
                {log?.weight_kg != null ? log.weight_kg.toFixed(1) : "—"}
              </span>
              <span
                className="w-6 shrink-0 text-center text-[14px]"
                title={log?.protein_g != null ? "Macros registrados" : "Sin macros"}
              >
                {log?.protein_g != null || log?.kcal_total != null ? (
                  <span className="text-accent">✓</span>
                ) : (
                  <span className="text-muted/50">—</span>
                )}
              </span>
              <span className="flex flex-1 flex-wrap justify-end gap-1">
                {dayWorkouts.map((w) => (
                  <span
                    key={w.id}
                    className="rounded-md bg-accent-soft px-1.5 py-0.5 text-[11px] font-semibold text-accent"
                  >
                    {WORKOUT_SHORT[w.type]}
                  </span>
                ))}
              </span>
            </div>
          );
        })}
      </section>
    </div>
  );
}

function ProgressRow({
  label,
  done,
  target,
}: {
  label: string;
  done: number;
  target: number;
}) {
  const pct = target > 0 ? Math.min(done / target, 1) * 100 : 0;
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between">
        <span className="text-[14px] font-medium">{label}</span>
        <span className="text-[14px] font-semibold tabular-nums">
          {done}
          <span className="text-muted">/{target}</span>
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-surface-2">
        <div
          className="h-full rounded-full bg-accent transition-[width]"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
