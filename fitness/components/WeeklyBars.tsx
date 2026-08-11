type Bar = { label: string; value?: number };

type Props = {
  data: Bar[];
  max: number;
  /** Línea de referencia. Punteada a propósito: marca un umbral, no una rejilla. */
  target?: number;
  /** Texto de la leyenda del objetivo. La línea nunca se rotula in situ: chocaría
   *  con las etiquetas de las barras que llegan justo a ella. */
  targetLabel?: string;
  format: (v: number) => string;
  ariaLabel: string;
};

const PLOT_H = 88;
/** Bajo este % de altura la etiqueta no cabe dentro de la barra y sale encima. */
const INSIDE_MIN_PCT = 26;

/**
 * Barras semanales en HTML/CSS: una sola serie, un solo eje, sin librería.
 * Nacen en la línea base (cero) y solo redondean el extremo de datos.
 */
export default function WeeklyBars({
  data,
  max,
  target,
  targetLabel,
  format,
  ariaLabel,
}: Props) {
  const scale = max > 0 ? max : 1;

  return (
    <figure className="m-0" role="img" aria-label={ariaLabel}>
      <div className="relative" style={{ height: PLOT_H }}>
        {target != null && target <= scale && (
          <div
            className="absolute inset-x-0 border-t border-dashed border-muted/60"
            style={{ bottom: `${(target / scale) * 100}%` }}
          />
        )}
        <div className="flex h-full items-end gap-[3px]">
          {data.map((b, i) => {
            const pct = b.value != null ? Math.min(b.value / scale, 1) * 100 : 0;
            const inside = pct >= INSIDE_MIN_PCT;
            return (
              <div key={i} className="flex h-full flex-1 flex-col justify-end">
                {b.value != null && !inside && (
                  <span className="mb-0.5 text-center text-[9px] leading-none tabular-nums text-muted">
                    {format(b.value)}
                  </span>
                )}
                <div
                  className="flex w-full justify-center rounded-t bg-accent"
                  style={{
                    height: b.value != null ? `${pct}%` : 2,
                    opacity: b.value != null ? 1 : 0.18,
                  }}
                >
                  {b.value != null && inside && (
                    <span className="pt-1 text-[9px] font-semibold leading-none tabular-nums text-accent-fg">
                      {format(b.value)}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-1 flex gap-[3px] border-t border-border pt-1">
        {data.map((b, i) => (
          <span key={i} className="flex-1 text-center text-[9px] leading-tight text-muted">
            {b.label}
          </span>
        ))}
      </div>

      {targetLabel && (
        <figcaption className="mt-1.5 flex items-center gap-1.5 text-[11px] text-muted">
          <svg width="16" height="6" aria-hidden>
            <line
              x1="0"
              y1="3"
              x2="16"
              y2="3"
              stroke="var(--muted)"
              strokeWidth="1"
              strokeDasharray="3 2"
            />
          </svg>
          {targetLabel}
        </figcaption>
      )}
    </figure>
  );
}
