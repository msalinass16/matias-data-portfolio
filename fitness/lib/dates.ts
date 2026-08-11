/**
 * Todo el manejo de fechas es LOCAL, nunca UTC: `new Date().toISOString()` puede
 * devolver el día equivocado según la zona horaria, y aquí el "día" es el día del
 * usuario, no el del meridiano de Greenwich.
 */

/** 'YYYY-MM-DD' en hora local. */
export function toKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function fromKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function todayKey(): string {
  return toKey(new Date());
}

export function addDays(key: string, n: number): string {
  const d = fromKey(key);
  d.setDate(d.getDate() + n);
  return toKey(d);
}

/** Los N días terminando en `end` (inclusive), del más antiguo al más reciente. */
export function lastNDays(n: number, end: string = todayKey()): string[] {
  const out: string[] = [];
  for (let i = n - 1; i >= 0; i--) out.push(addDays(end, -i));
  return out;
}

/** Lunes de la semana que contiene `key`. */
export function weekStart(key: string): string {
  const d = fromKey(key);
  const dow = (d.getDay() + 6) % 7; // 0 = lunes
  return addDays(key, -dow);
}

const DOW = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const MONTHS = [
  "ene",
  "feb",
  "mar",
  "abr",
  "may",
  "jun",
  "jul",
  "ago",
  "sep",
  "oct",
  "nov",
  "dic",
];

/** 'Lun 11' */
export function shortLabel(key: string): string {
  const d = fromKey(key);
  return `${DOW[(d.getDay() + 6) % 7]} ${d.getDate()}`;
}

/** '11 ago' */
export function dayMonth(key: string): string {
  const d = fromKey(key);
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

/** '11/8' — compacto, para ejes con muchas columnas. */
export function daySlashMonth(key: string): string {
  const d = fromKey(key);
  return `${d.getDate()}/${d.getMonth() + 1}`;
}

/** 'Lunes 11 de agosto' */
export function longLabel(key: string): string {
  const d = fromKey(key);
  return new Intl.DateTimeFormat("es", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(d);
}
