export type PrayerId = "fajr" | "dhuhr" | "asr" | "maghrib" | "isha";

export type PrayerStatus = "prayed" | "delayed" | "missed";

export type PrayerValue = PrayerStatus | null;

export type DayRecord = {
  exempt: boolean;
  prayers: Record<PrayerId, PrayerValue>;
};

export type Records = Record<string, DayRecord>;

export const PRAYERS: { id: PrayerId; name: string }[] = [
  { id: "fajr", name: "Fajr" },
  { id: "dhuhr", name: "Dhuhr" },
  { id: "asr", name: "Asr" },
  { id: "maghrib", name: "Maghrib" },
  { id: "isha", name: "Isha" }
];
