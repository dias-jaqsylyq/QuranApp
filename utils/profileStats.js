import AsyncStorage from '@react-native-async-storage/async-storage';

const ACTIVE_DAYS_KEY = 'active_days';
const SURAHS_FINISHED_KEY = 'surahs_finished';
const KHATM_COMPLETED_KEY = 'khatm_completed_count';

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

// Records that real reading activity happened today — the minimum needed to
// honestly compute a streak, since neither `last_read` nor `khatm_plan`
// keep a history of which days were active, only the most recent position.
export async function recordActiveToday() {
  const today = todayISO();
  const raw = await AsyncStorage.getItem(ACTIVE_DAYS_KEY);
  const days = raw ? JSON.parse(raw) : [];
  if (days.includes(today)) return;
  days.push(today);
  await AsyncStorage.setItem(ACTIVE_DAYS_KEY, JSON.stringify(days.slice(-60)));
}

export async function recordSurahFinished(surahNumber) {
  const raw = await AsyncStorage.getItem(SURAHS_FINISHED_KEY);
  const list = raw ? JSON.parse(raw) : [];
  if (list.includes(surahNumber)) return;
  list.push(surahNumber);
  await AsyncStorage.setItem(SURAHS_FINISHED_KEY, JSON.stringify(list));
}

export async function incrementKhatmCompletedCount() {
  const raw = await AsyncStorage.getItem(KHATM_COMPLETED_KEY);
  const count = raw ? parseInt(raw, 10) || 0 : 0;
  await AsyncStorage.setItem(KHATM_COMPLETED_KEY, String(count + 1));
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
  const pairs = await AsyncStorage.multiGet([ACTIVE_DAYS_KEY, SURAHS_FINISHED_KEY, KHATM_COMPLETED_KEY]);
  const map = Object.fromEntries(pairs);

  const activeDays = map[ACTIVE_DAYS_KEY] ? JSON.parse(map[ACTIVE_DAYS_KEY]) : [];
  const surahsFinished = map[SURAHS_FINISHED_KEY] ? JSON.parse(map[SURAHS_FINISHED_KEY]) : [];
  const khatmCompletedCount = map[KHATM_COMPLETED_KEY] ? parseInt(map[KHATM_COMPLETED_KEY], 10) || 0 : 0;

  const stats = {
    streak: computeStreak(activeDays),
    surahsFinishedCount: surahsFinished.length,
    khatmCompletedCount,
  };
  const earnedBadges = BADGES.filter((b) => b.check(stats));

  return { ...stats, earnedBadges };
}
