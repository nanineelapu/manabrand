/**
 * "Magic hours": the daily window when the Mana Deal Box opens for members.
 * Change the two hours below (24-hour clock, India time) and the whole site follows.
 */
export const MAGIC = { startHour: 20, endHour: 22 } as const; // 8 PM – 10 PM IST

const IST = 5.5 * 3600e3;
const DAY = 86400e3;
const h12 = (h: number) => `${h % 12 === 0 ? 12 : h % 12} ${h < 12 ? "AM" : "PM"}`;

/** "8 PM – 10 PM" */
export const MAGIC_LABEL = `${h12(MAGIC.startHour)} – ${h12(MAGIC.endHour)}`;

/** Whether the magic hours are on right now, and how many ms until they end (if on) or next start (if off). */
export function magicState(now = Date.now()): { live: boolean; msLeft: number } {
  const dayStart = Math.floor((now + IST) / DAY) * DAY - IST; // today 00:00 IST, as a UTC timestamp
  const start = dayStart + MAGIC.startHour * 3600e3;
  const end = dayStart + MAGIC.endHour * 3600e3;
  if (now >= start && now < end) return { live: true, msLeft: end - now };
  return { live: false, msLeft: (now < start ? start : start + DAY) - now };
}

export function clock(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(Math.floor(s / 3600))}:${p(Math.floor((s % 3600) / 60))}:${p(s % 60)}`;
}
