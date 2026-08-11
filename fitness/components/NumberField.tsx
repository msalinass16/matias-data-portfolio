"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  value: number | undefined;
  onCommit: (value: number | undefined) => void;
  label?: string;
  suffix?: string;
  placeholder?: string;
  decimal?: boolean;
  size?: "md" | "lg";
  ariaLabel?: string;
};

/**
 * Input numérico con autoguardado: confirma 400ms después de dejar de escribir y
 * también al perder el foco, así nunca hace falta pulsar "Guardar".
 * El tamaño de fuente nunca baja de 16px porque iOS hace zoom automático si lo hace.
 */
export default function NumberField({
  value,
  onCommit,
  label,
  suffix,
  placeholder,
  decimal = false,
  size = "md",
  ariaLabel,
}: Props) {
  const [text, setText] = useState(value == null ? "" : String(value));
  const focused = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Refleja cambios que vienen de fuera (p. ej. las kcal autocalculadas), pero
  // nunca mientras el campo está enfocado: pisaría lo que se está escribiendo.
  useEffect(() => {
    if (!focused.current) setText(value == null ? "" : String(value));
  }, [value]);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  function commit(raw: string) {
    const cleaned = raw.trim().replace(",", ".");
    if (cleaned === "") return onCommit(undefined);
    const n = decimal ? parseFloat(cleaned) : parseInt(cleaned, 10);
    if (Number.isFinite(n)) onCommit(n);
  }

  function handleChange(raw: string) {
    setText(raw);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => commit(raw), 400);
  }

  const big = size === "lg";

  return (
    <label className="block">
      {label && (
        <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-muted">
          {label}
        </span>
      )}
      <span className="relative flex items-center">
        <input
          type="text"
          inputMode={decimal ? "decimal" : "numeric"}
          enterKeyHint="done"
          aria-label={ariaLabel ?? label}
          value={text}
          placeholder={placeholder ?? "—"}
          onFocus={(e) => {
            focused.current = true;
            e.currentTarget.select();
          }}
          onChange={(e) => handleChange(e.target.value)}
          onBlur={(e) => {
            focused.current = false;
            if (timer.current) clearTimeout(timer.current);
            commit(e.target.value);
          }}
          className={`w-full rounded-xl border border-border bg-surface text-fg tabular-nums outline-none placeholder:text-muted/60 focus:border-accent ${
            big
              ? "h-16 px-4 text-[34px] font-bold"
              : "h-12 px-3 text-center text-[17px] font-semibold"
          } ${suffix && big ? "pr-14" : ""}`}
        />
        {suffix && big && (
          <span className="pointer-events-none absolute right-4 text-[15px] font-medium text-muted">
            {suffix}
          </span>
        )}
      </span>
    </label>
  );
}
