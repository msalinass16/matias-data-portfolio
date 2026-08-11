type Props = {
  values: (number | undefined)[];
  width?: number;
  height?: number;
};

/**
 * Línea mínima, sin ejes ni librería. Los huecos (días sin dato) se saltan en vez
 * de dibujarse como ceros, que distorsionarían la escala.
 */
export default function Sparkline({ values, width = 120, height = 36 }: Props) {
  const points = values
    .map((v, i) => ({ v, i }))
    .filter((p): p is { v: number; i: number } => typeof p.v === "number");

  if (points.length < 2) return <div style={{ width, height }} aria-hidden />;

  const pad = 3;
  const min = Math.min(...points.map((p) => p.v));
  const max = Math.max(...points.map((p) => p.v));
  const span = max - min || 1;
  const stepX = (width - pad * 2) / Math.max(values.length - 1, 1);

  const xy = points.map((p) => ({
    x: pad + p.i * stepX,
    y: pad + (height - pad * 2) * (1 - (p.v - min) / span),
  }));

  const d = xy.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");
  const last = xy[xy.length - 1];

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label="Tendencia de peso de los últimos días"
      className="overflow-visible"
    >
      <path
        d={d}
        fill="none"
        stroke="var(--accent)"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={last.x} cy={last.y} r={3} fill="var(--accent)" />
    </svg>
  );
}
