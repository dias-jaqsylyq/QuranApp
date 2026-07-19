import AsyncStorage from '@react-native-async-storage/async-storage';
import { pushUpdate } from '../lib/sync';

export const STORAGE_KEY = 'profile_stats';
const SYNC_TABLE = 'profile_stats';

// Legacy keys from before the single-blob shape — migrated on first load.
const LEGACY_ACTIVE_DAYS_KEY = 'active_days';
const LEGACY_SURAHS_FINISHED_KEY = 'surahs_finished';
const LEGACY_KHATM_COMPLETED_KEY = 'khatm_completed_count';

const EMPTY_BLOB = {
  activeDays: [],
  surahsFinished: [],
  khatmCompletedCount: 0,
};

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function normalizeBlob(raw) {
  if (!raw || typeof raw !== 'object') return { ...EMPTY_BLOB };
  return {
    activeDays: Array.isArray(raw.activeDays) ? raw.activeDays : [],
    surahsFinished: Array.isArray(raw.surahsFinished) ? raw.surahsFinished : [],
    khatmCompletedCount:
      typeof raw.khatmCompletedCount === 'number' ? raw.khatmCompletedCount : 0,
  };
}

async function migrateLegacyKeysIfNeeded() {
  const existing = await AsyncStorage.getItem(STORAGE_KEY);
  if (existing) return;

  const pairs = await AsyncStorage.multiGet([
    LEGACY_ACTIVE_DAYS_KEY,
    LEGACY_SURAHS_FINISHED_KEY,
    LEGACY_KHATM_COMPLETED_KEY,
  ]);
  const map = Object.fromEntries(pairs);
  const hasLegacy = pairs.some(([, v]) => v != null);
  if (!hasLegacy) return;

  const blob = {
    activeDays: map[LEGACY_ACTIVE_DAYS_KEY] ? JSON.parse(map[LEGACY_ACTIVE_DAYS_KEY]) : [],
    surahsFinished: map[LEGACY_SURAHS_FINISHED_KEY]
      ? JSON.parse(map[LEGACY_SURAHS_FINISHED_KEY])
      : [],
    khatmCompletedCount: map[LEGACY_KHATM_COMPLETED_KEY]
      ? parseInt(map[LEGACY_KHATM_COMPLETED_KEY], 10) || 0
      : 0,
  };
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(blob));
  await AsyncStorage.multiRemove([
    LEGACY_ACTIVE_DAYS_KEY,
    LEGACY_SURAHS_FINISHED_KEY,
    LEGACY_KHATM_COMPLETED_KEY,
  ]);
}

export async function loadStatsBlob() {
  try {
    await migrateLegacyKeysIfNeeded();
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return normalizeBlob(raw ? JSON.parse(raw) : null);
  } catch {
    return { ...EMPTY_BLOB };
  }
}

export async function saveStatsBlob(blob) {
  const normalized = normalizeBlob(blob);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
  pushUpdate(SYNC_TABLE, normalized);
}

// Applies a pulled cloud value to local storage only — used by the sign-in
// sync pass, which must not immediately push the value it just downloaded
// back up to the cloud.
export async function applyRemoteStats(blob) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(normalizeBlob(blob)));
}

// Records that real reading activity happened today — the minimum needed to
// honestly compute a streak, since neither `last_read` nor `khatm_plan`
// keep a history of which days were active, only the most recent position.
export async function recordActiveToday() {
  const today = todayISO();
  const blob = await loadStatsBlob();
  if (blob.activeDays.includes(today)) return;
  blob.activeDays = [...blob.activeDays, today].slice(-60);
  await saveStatsBlob(blob);
}

export async function recordSurahFinished(surahNumber) {
  const blob = await loadStatsBlob();
  if (blob.surahsFinished.includes(surahNumber)) return;
  blob.surahsFinished = [...blob.surahsFinished, surahNumber];
  await saveStatsBlob(blob);
}

export async function incrementKhatmCompletedCount() {
  const blob = await loadStatsBlob();
  blob.khatmCompletedCount = (blob.khatmCompletedCount || 0) + 1;
  await saveStatsBlob(blob);
}

// Consecutive days ending today (or, if today has no activity yet, ending
// yesterday — so the streak isn't shown as broken before the day is over).
export function computeStreak(activeDays) {
  const set = new Set(activeDays);
  const cursor = new Date();
  if (!set.has(cursor.toISOString().slice(0, 10))) {
    cursor.setDate(cursor.getDate() - 1);
  }
  let streak = 0;
  while (set.has(cursor.toISOString().slice(0, 10))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export const BADGES = [
  { id: 'streak3', label: '3-Day Streak', icon: 'flame-outline', check: (s) => s.streak >= 3 },
  { id: 'streak7', label: '7-Day Streak', icon: 'flame', check: (s) => s.streak >= 7 },
  { id: 'firstSurah', label: 'Finished Your First Surah', icon: 'book-outline', check: (s) => s.surahsFinishedCount >= 1 },
  { id: 'khatmComplete', label: 'Completed a Khatm', icon: 'checkmark-done-circle-outline', check: (s) => s.khatmCompletedCount >= 1 },
];

export async function loadProfileStats() {
  const blob = await loadStatsBlob();
  const stats = {
    streak: computeStreak(blob.activeDays),
    surahsFinishedCount: blob.surahsFinished.length,
    khatmCompletedCount: blob.khatmCompletedCount,
  };
  const earnedBadges = BADGES.filter((b) => b.check(stats));
  return { ...stats, earnedBadges };
}
