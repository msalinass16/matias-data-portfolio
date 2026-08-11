"use client";

import { useRef, useState } from "react";
import NumberField from "@/components/NumberField";
import { todayKey } from "@/lib/dates";
import { useStore } from "@/lib/StoreProvider";
import type { Goals } from "@/lib/types";

export default function MetasPage() {
  const { ready, goals, saveGoals, exportAll, importAll } = useStore();
  const fileInput = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<string | null>(null);

  if (!ready) return <div className="h-64" aria-hidden />;

  const set = (patch: Partial<Goals>) => saveGoals({ ...goals, ...patch });

  function handleExport() {
    const blob = new Blob([exportAll()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `fit-backup-${todayKey()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleImport(file: File) {
    try {
      importAll(await file.text());
      setMessage("Datos restaurados.");
    } catch {
      setMessage("No se pudo leer ese archivo.");
    }
  }

  return (
    <div className="space-y-4">
      <header className="pt-1">
        <h1 className="text-[27px] font-bold leading-none">Metas</h1>
        <p className="mt-1 text-[13px] text-muted">Se guardan solas al salir del campo</p>
      </header>

      <section className="rounded-2xl border border-border bg-surface/60 p-3">
        <h2 className="mb-2 text-[13px] font-semibold text-muted">Peso objetivo</h2>
        <div className="grid grid-cols-2 gap-2">
          <NumberField
            label="Mínimo (kg)"
            value={goals.weight_target_min_kg}
            onCommit={(v) => set({ weight_target_min_kg: v })}
            decimal
          />
          <NumberField
            label="Máximo (kg)"
            value={goals.weight_target_max_kg}
            onCommit={(v) => set({ weight_target_max_kg: v })}
            decimal
          />
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-surface/60 p-3">
        <h2 className="mb-2 text-[13px] font-semibold text-muted">Nutrición diaria</h2>
        <div className="grid grid-cols-2 gap-2">
          <NumberField
            label="Proteína (g)"
            value={goals.protein_target_g}
            onCommit={(v) => set({ protein_target_g: v ?? 0 })}
          />
          <NumberField
            label="Kcal"
            value={goals.kcal_target}
            onCommit={(v) => set({ kcal_target: v ?? 0 })}
          />
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-surface/60 p-3">
        <h2 className="mb-2 text-[13px] font-semibold text-muted">Sesiones por semana</h2>
        <div className="grid grid-cols-2 gap-2">
          <NumberField
            label="Fuerza"
            value={goals.weekly_strength_sessions_target}
            onCommit={(v) => set({ weekly_strength_sessions_target: v ?? 0 })}
          />
          <NumberField
            label="Running"
            value={goals.weekly_running_sessions_target}
            onCommit={(v) => set({ weekly_running_sessions_target: v ?? 0 })}
          />
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-surface/60 p-3">
        <h2 className="mb-2 text-[13px] font-semibold text-muted">
          Ritmo objetivo (min/km)
        </h2>
        <div className="grid grid-cols-2 gap-2">
          <NumberField
            label="5K"
            value={goals.running_5k_target_pace}
            onCommit={(v) => set({ running_5k_target_pace: v })}
            decimal
          />
          <NumberField
            label="10K"
            value={goals.running_10k_target_pace}
            onCommit={(v) => set({ running_10k_target_pace: v })}
            decimal
          />
        </div>
      </section>

      {/* Los datos viven solo en este teléfono: el respaldo manual es la red de seguridad. */}
      <section className="rounded-2xl border border-border bg-surface/60 p-3">
        <h2 className="text-[13px] font-semibold text-muted">Respaldo</h2>
        <p className="mb-3 mt-1 text-[12px] leading-snug text-muted">
          Tus datos se guardan solo en este dispositivo. Exporta de vez en cuando
          para no depender de él.
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleExport}
            className="h-12 flex-1 rounded-xl border border-border bg-bg text-[15px] font-semibold"
          >
            Exportar
          </button>
          <button
            type="button"
            onClick={() => fileInput.current?.click()}
            className="h-12 flex-1 rounded-xl border border-border bg-bg text-[15px] font-semibold"
          >
            Importar
          </button>
        </div>
        <input
          ref={fileInput}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void handleImport(f);
            e.target.value = "";
          }}
        />
        {message && <p className="mt-2 text-[12px] text-accent">{message}</p>}
      </section>
    </div>
  );
}
