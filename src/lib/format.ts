export const TZ = "Africa/Johannesburg";

/** R1 250.00 */
export function money(v: number | string | null | undefined): string {
  const n = Number(v ?? 0);
  const [int, dec] = Math.abs(n).toFixed(2).split(".");
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return `${n < 0 ? "-" : ""}R${grouped}.${dec}`;
}

/** 23 Oct 2026 */
export function date(v: string | Date | null | undefined): string {
  if (!v) return "-";
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: TZ,
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(v));
}

/** 23 Oct 2026, 18:00 */
export function dateTime(v: string | Date | null | undefined): string {
  if (!v) return "-";
  const d = new Date(v);
  const t = new Intl.DateTimeFormat("en-GB", {
    timeZone: TZ,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(d);
  return `${date(d)}, ${t}`;
}

export function savings(price: number, ref: number | null | undefined) {
  if (!ref || ref <= price) return null;
  const amount = ref - price;
  return { amount, pct: (amount / ref) * 100 };
}

/** "bag" -> "bags", "box" -> "boxes"; leaves the unit as is for a quantity of 1 */
export function plural(unit: string, n = 2): string {
  if (n === 1 || !unit) return unit;
  return /(s|x|z|ch|sh)$/i.test(unit) ? `${unit}es` : `${unit}s`;
}

/** "10 bags", "1 carton" */
export function qty(n: number, unit: string): string {
  return `${n} ${plural(unit, n)}`;
}

export function pct(part: number, whole: number) {
  if (!whole) return 0;
  return Math.min(100, Math.round((part / whole) * 100));
}

/** Normalise SA mobile numbers to +27XXXXXXXXX. Returns null if invalid. */
export function normaliseSaMobile(input: string): string | null {
  const digits = input.replace(/[^\d+]/g, "");
  let d = digits.startsWith("+") ? digits.slice(1) : digits;
  if (d.startsWith("0")) d = "27" + d.slice(1);
  if (!/^27[6-8]\d{8}$/.test(d)) return null;
  return "+" + d;
}

/** Convert a datetime-local value (interpreted as SAST) to ISO */
export function sastLocalToIso(local: string): string {
  return new Date(local + ":00+02:00").toISOString();
}
export function isoToSastLocal(iso: string): string {
  const d = new Date(new Date(iso).getTime() + 2 * 3600 * 1000);
  return d.toISOString().slice(0, 16);
}

export const PROVINCES = [
  "Eastern Cape",
  "Free State",
  "Gauteng",
  "KwaZulu-Natal",
  "Limpopo",
  "Mpumalanga",
  "North West",
  "Northern Cape",
  "Western Cape",
];
