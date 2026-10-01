import AsyncStorage from "@react-native-async-storage/async-storage";
import { DayRecord, PrayerId, Records } from "./types";

const STORAGE_KEY = "@salah_tracker_records_v1";

export const emptyDay = (): DayRecord => ({
  exempt: false,
  prayers: {
    fajr: null,
    dhuhr: null,
    asr: null,
    maghrib: null,
    isha: null
  }
});

export async function loadRecords(): Promise<Records> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Records;
  } catch {
    // A corrupted local value should not crash the app.
    return {};
  }
}

export async function saveRecords(records: Records): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

export function getDay(records: Records, dateKey: string): DayRecord {
  return records[dateKey] ?? emptyDay();
}

export function updatePrayer(
  records: Records,
  dateKey: string,
  prayer: PrayerId,
  value: DayRecord["prayers"][PrayerId]
): Records {
  const current = getDay(records, dateKey);

  return {
    ...records,
    [dateKey]: {
      ...current,
      prayers: {
        ...current.prayers,
        [prayer]: value
      }
    }
  };
}
