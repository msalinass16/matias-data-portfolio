import { dayMonth } from "@/lib/dates";
import type { DailyLog, Goals } from "@/lib/types";

type Props = {
  keys: string[];
  days: Record<string, DailyLog>;
  ma: (number | undefined)[];
  goals: Goals;
};

const W = 360;
const H = 170;
const PAD = { top: 12, right: 12, bottom: 22, left: 30 };

/**
 * Peso diario (puntos) sobre media móvil de 7 días (línea).
 * Las dos series se distinguen por FORMA además de color: punto vs. línea. El par
 * gris/verde no separa lo suficiente bajo daltonismo deutan, y la forma sí.
 */
export default function WeightChart({ keys, days, ma, goals }: Props) {
  const raw = keys.map((k, i) => ({ i, v: days[k]?.weight_kg }));
  const present = raw.filter((p): p is { i: number; v: number } => typeof p.v === "number");

  if (present.length < 2) {
    return (
      <p className="py-8 text-center text-[13px] text-muted">
        Registra peso unos días más y aquí aparece la tendencia.
      </p>
    );
  }

  const candidates = [
    ...present.map((p) => p.v),
    ...ma.filter((v): v is number => typeof v === "number"),
    ...(goals.weight_target_min_kg != null ? [goals.weight_target_min_kg] : []),
    ...(goals.weight_target_max_kg != null ? [goals.weight_target_max_kg] : []),
  ];
  const lo = Math.min(...candidates);
  const hi = Math.max(...candidates);
  const span = hi - lo || 1;
  const min = lo - span * 0.12;
  const max = hi + span * 0.12;

  const x = (i: number) =>
    PAD.left + ((W - PAD.left - PAD.right) * i) / Math.max(keys.length - 1, 1);
  const y = (v: number) =>
    PAD.top + (H - PAD.top - PAD.bottom) * (1 - (v - min) / (max - min));

  // La media móvil puede tener huecos; se dibuja en tramos continuos para no
  // inventar una línea recta donde no hubo datos.
  const segments: string[] = [];
  let current: string[] = [];
  ma.forEach((v, i) => {
    if (typeof v === "number") {
      current.push(`${current.length === 0 ? "M" : "L"}${x(i).toFixed(1)} ${y(v).toFixed(1)}`);
    } else if (current.length) {
      segments.push(current.join(" "));
      current = [];
    }
  });
  if (current.length) segments.push(current.join(" "));

  const lastMaIndex = ma.reduce<number>((acc, v, i) => (typeof v === "number" ? i : acc), -1);
  const lastMa = lastMaIndex >= 0 ? (ma[lastMaIndex] as number) : undefined;

  const bandTop = goals.weight_target_max_kg;
  const bandBottom = goals.weight_target_min_kg;

  return (
    <figure className="m-0">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-auto w-full"
        role="img"
        aria-label={`Peso de los últimos ${keys.length} días con media móvil de 7 días`}
      >
        {/* Franja de peso objetivo, si está configurada. */}
        {bandTop != null && bandBottom != null && (
          <rect
            x={PAD.left}
            y={y(bandTop)}
            width={W - PAD.left - PAD.right}
            height={Math.max(y(bandBottom) - y(bandTop), 1)}
            fill="var(--accent)"
            opacity={0.09}
          />
        )}

        {/* Ejes: hairlines discretas, nunca punteadas. */}
        <line
          x1={PAD.left}
          y1={H - PAD.bottom}
          x2={W - PAD.right}
          y2={H - PAD.bottom}
          stroke="var(--border)"
          strokeWidth={1}
        />

        {[max, min].map((v, i) => (
          <text
            key={i}
            x={PAD.left - 5}
            y={y(v) + 3}
            textAnchor="end"
            className="fill-[var(--muted)] text-[9px] tabular-nums"
          >
            {v.toFixed(1)}
          </text>
        ))}

        {present.map((p) => (
          <circle key={p.i} cx={x(p.i)} cy={y(p.v)} r={2} fill="var(--chart-2)" opacity={0.7} />
        ))}

        {segments.map((d, i) => (
          <path
            key={i}
            d={d}
            fill="none"
            stroke="var(--accent)"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
        ))}

        {lastMa != null && (
          <circle
            cx={x(lastMaIndex)}
            cy={y(lastMa)}
            r={3.5}
            fill="var(--accent)"
            stroke="var(--bg)"
            strokeWidth={2}
          />
        )}

        <text
          x={PAD.left}
          y={H - 6}
          className="fill-[var(--muted)] text-[9px]"
        >
          {dayMonth(keys[0])}
        </text>
        <text
          x={W - PAD.right}
          y={H - 6}
          textAnchor="end"
          className="fill-[var(--muted)] text-[9px]"
        >
          {dayMonth(keys[keys.length - 1])}
        </text>
      </svg>

      <figcaption className="mt-1 flex items-center gap-3 text-[11px] text-muted">
        <span className="flex items-center gap-1.5">
          <svg width="14" height="8" aria-hidden>
            <circle cx="7" cy="4" r="2" fill="var(--chart-2)" opacity="0.7" />
          </svg>
          Peso diario
        </span>
        <span className="flex items-center gap-1.5">
          <svg width="14" height="8" aria-hidden>
            <line x1="1" y1="4" x2="13" y2="4" stroke="var(--accent)" strokeWidth="2" />
          </svg>
          Media 7d
          {lastMa != null && (
            <strong className="font-semibold tabular-nums text-fg">
              {lastMa.toFixed(1)} kg
            </strong>
          )}
        </span>
      </figcaption>
    </figure>
  );
}
