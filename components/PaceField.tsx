"use client";

import NumberField from "./NumberField";

type Props = {
  /** Segundos por kilómetro. */
  value: number | undefined;
  onCommit: (secPerKm: number | undefined) => void;
};

/**
 * Ritmo como minutos + segundos separados, no como un campo "5:45": el teclado
 * numérico de iOS no trae los dos puntos, y cambiar a texto para escribirlos
 * abriría el teclado completo en el único sitio donde importa la velocidad.
 */
export default function PaceField({ value, onCommit }: Props) {
  const min = value != null ? Math.floor(value / 60) : undefined;
  const sec = value != null ? Math.round(value % 60) : undefined;

  function setMin(m: number | undefined) {
    if (m == null && sec == null) return onCommit(undefined);
    onCommit(Math.max(0, m ?? 0) * 60 + (sec ?? 0));
  }

  function setSec(s: number | undefined) {
    if (s == null && min == null) return onCommit(undefined);
    // Los segundos se recortan a 0-59: "5:75" no es un ritmo.
    const clamped = Math.min(Math.max(s ?? 0, 0), 59);
    onCommit((min ?? 0) * 60 + clamped);
  }

  return (
    <div className="flex items-end gap-1.5">
      <div className="w-16">
        <NumberField value={min} onCommit={setMin} ariaLabel="Minutos del ritmo por kilómetro" />
      </div>
      <span className="pb-3 text-[17px] font-semibold text-muted">:</span>
      <div className="w-16">
        <NumberField
          value={sec}
          onCommit={setSec}
          ariaLabel="Segundos del ritmo por kilómetro"
        />
      </div>
      <span className="pb-3.5 text-[13px] text-muted">min/km</span>
    </div>
  );
}
