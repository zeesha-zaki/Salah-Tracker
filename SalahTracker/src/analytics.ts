import { addDays, dateToKey, endOfMonth, startOfMonth, startOfWeek } from "./dateUtils";
import { DayRecord, PRAYERS, PrayerStatus, Records } from "./types";

export type Stats = {
  prayed: number;
  delayed: number;
  missed: number;
  exempt: number;
  eligible: number;
  checkedDays: number;
  prayedPct: number;
  delayedPct: number;
  missedPct: number;
};

function isChecked(day: DayRecord | undefined): boolean {
  if (!day) return false;
  // An exemption is a deliberate completed action, so it makes that date
  // a checked day even though all prayers are excluded from the denominator.
  return day.exempt || PRAYERS.some(({ id }) => day.prayers[id] !== null);
}

export function calculateStats(
  records: Records,
  mode: "week" | "month",
  anchorDate: Date
): Stats {
  const start = mode === "week" ? startOfWeek(anchorDate) : startOfMonth(anchorDate);
  const end = mode === "week" ? addDays(start, 6) : endOfMonth(anchorDate);

  let prayed = 0;
  let delayed = 0;
  let missed = 0;
  let exempt = 0;
  let checkedDays = 0;

  for (let cursor = new Date(start); cursor <= end; cursor = addDays(cursor, 1)) {
    const day = records[dateToKey(cursor)];
    if (!isChecked(day)) continue;

    checkedDays++;

    if (!day) continue;

    if (day.exempt) {
      exempt += PRAYERS.length;
      continue;
    }

    for (const { id } of PRAYERS) {
      const status = day.prayers[id] as PrayerStatus | null;
      if (status === "prayed") prayed++;
      if (status === "delayed") delayed++;
      if (status === "missed") missed++;
    }
  }

  // Required formula:
  // denominator = (Total Days Checked * 5) - Exempt Prayers.
  // Only checked days are included, so an untouched future/past day does not
  // silently lower the user's percentage.
  const denominator = Math.max(0, checkedDays * PRAYERS.length - exempt);

  return {
    prayed,
    delayed,
    missed,
    exempt,
    eligible: denominator,
    checkedDays,
    prayedPct: denominator ? (prayed / denominator) * 100 : 0,
    delayedPct: denominator ? (delayed / denominator) * 100 : 0,
    missedPct: denominator ? (missed / denominator) * 100 : 0
  };
}
