/**
 * "Magic hours": the daily window when the Mana Deal Box opens for members.
 * The hours, price and picked products are edited by the admin in Admin → Deal Box (stored in the `dealbox` setting).
 */
export interface DealBoxConfig {
  enabled: boolean;
  /** true = open 24 hours a day, every day (no countdown). false = only during the daily magic hours below. */
  allDay: boolean;
  startHour: number;   // 0–23, India time
  endHour: number;     // 0–23, India time (must be after startHour)
  price: number;       // yearly pass price in ₹
  productIds: string[];
}
export const DEFAULT_DEALBOX: DealBoxConfig = { enabled: true, allDay: true, startHour: 20, endHour: 22, price: 699, productIds: [] };

/** Merge whatever is stored with the defaults, and clamp the values so a bad save can never break the page. */
export function normalizeDealBox(raw: Partial<DealBoxConfig> | null | undefined): DealBoxConfig {
  const c = { ...DEFAULT_DEALBOX, ...(raw ?? {}) };
  const start = Math.min(22, Math.max(0, Math.floor(Number(c.startHour))));
  const end = Math.min(23, Math.max(start + 1, Math.floor(Number(c.endHour))));
  return { enabled: Boolean(c.enabled), allDay: c.allDay !== false, startHour: start, endHour: end, price: Math.max(1, Math.round(Number(c.price) || DEFAULT_DEALBOX.price)), productIds: Array.isArray(c.productIds) ? c.productIds.slice(0, 12) : [] };
}

const IST = 5.5 * 3600e3;
const DAY = 86400e3;
/** (non-breaking spaces, so "8 PM – 10 PM" never splits across two lines) */
const h12 = (h: number) => `${h % 12 === 0 ? 12 : h % 12}\u00a0${h < 12 ? "AM" : "PM"}`;

/** "8 PM – 10 PM" */
export const magicLabel = (c: Pick<DealBoxConfig, "startHour" | "endHour"> & { allDay?: boolean }) => (c.allDay ? "24/7" : `${h12(c.startHour)}\u00a0–\u00a0${h12(c.endHour)}`);

/** Whether the magic hours are on right now, and how many ms until they end (if on) or next start (if off). */
export function magicState(c: Pick<DealBoxConfig, "startHour" | "endHour"> & { allDay?: boolean }, now = Date.now()): { live: boolean; msLeft: number } {
  if (c.allDay) return { live: true, msLeft: 0 };
  const dayStart = Math.floor((now + IST) / DAY) * DAY - IST; // today 00:00 IST, as a UTC timestamp
  const start = dayStart + c.startHour * 3600e3;
  const end = dayStart + c.endHour * 3600e3;
  if (now >= start && now < end) return { live: true, msLeft: end - now };
  return { live: false, msLeft: (now < start ? start : start + DAY) - now };
}

export function clock(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(Math.floor(s / 3600))}:${p(Math.floor((s % 3600) / 60))}:${p(s % 60)}`;
}
