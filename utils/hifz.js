import AsyncStorage from '@react-native-async-storage/async-storage';
import { clamp, todayISO, formatFinishDate } from './khatm';
import { pushUpdate } from '../lib/sync';

export { formatFinishDate };

export const STORAGE_KEY = 'hifz_plans';
const SYNC_TABLE = 'hifz_plans';

export async function loadPlans() {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function savePlans(plans) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(plans));
  pushUpdate(SYNC_TABLE, plans);
}

// Applies a pulled cloud value to local storage only — used by the sign-in
// sync pass, which must not immediately push the value it just downloaded
// back up to the cloud.
export async function applyRemotePlans(plans) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(plans ?? []));
}

export function ayahsPerDayFromDays(totalAyahs, days) {
  return clamp(Math.ceil(totalAyahs / Math.max(1, days)), 1, totalAyahs);
}

export function daysFromAyahsPerDay(totalAyahs, ayahsPerDay) {
  return clamp(Math.ceil(totalAyahs / Math.max(1, ayahsPerDay)), 1, totalAyahs);
}

export function buildPlan({ surahNumber, surahNameEn, totalAyahs, ayahsPerDay }) {
  return {
    id: `${surahNumber}-${Date.now()}`,
    surahNumber,
    surahNameEn,
    totalAyahs,
    ayahsPerDay,
    currentAyah: 1,
    status: 'memorizing',
    startDateISO: todayISO(),
    lastMarkedDateISO: null,
  };
}

export function buildAlreadyMemorizedPlan({ surahNumber, surahNameEn, totalAyahs }) {
  return {
    id: `${surahNumber}-${Date.now()}`,
    surahNumber,
    surahNameEn,
    totalAyahs,
    ayahsPerDay: totalAyahs,
    currentAyah: totalAyahs + 1,
    status: 'memorized',
    startDateISO: todayISO(),
    lastMarkedDateISO: todayISO(),
  };
}

export function todayTarget(plan) {
  if (plan.status !== 'memorizing') return null;
  const endAyah = Math.min(plan.currentAyah + plan.ayahsPerDay - 1, plan.totalAyahs);
  return { startAyah: plan.currentAyah, endAyah };
}

export function isDoneToday(plan) {
  return plan.lastMarkedDateISO === todayISO();
}

export function pctComplete(plan) {
  if (!plan.totalAyahs) return 0;
  const done = clamp(plan.currentAyah - 1, 0, plan.totalAyahs);
  return Math.round((done / plan.totalAyahs) * 100);
}

export function markMemorizedToday(plan) {
  const nextAyah = Math.min(plan.currentAyah + plan.ayahsPerDay, plan.totalAyahs + 1);
  return {
    ...plan,
    currentAyah: nextAyah,
    lastMarkedDateISO: todayISO(),
    status: nextAyah > plan.totalAyahs ? 'memorized' : 'memorizing',
  };
}

export function pluralAyah(n) {
  return n === 1 ? 'ayah' : 'ayahs';
}

// Aggregates open plans into one summary so the Discover promo card and the
// Home "Today" card always agree on what's left, instead of each computing
// their own slightly different view of the same data.
export function summarizeToday(plans) {
  const hasAnyPlan = plans.length > 0;
  const open = plans.filter((p) => p.status === 'memorizing' && !isDoneToday(p));
  if (open.length === 0) {
    return { hasAnyPlan, hasOpenTarget: false, ayahsToday: 0, surahNameEn: null, moreCount: 0 };
  }
  const [next, ...rest] = open;
  const target = todayTarget(next);
  return {
    hasAnyPlan,
    hasOpenTarget: true,
    ayahsToday: target.endAyah - target.startAyah + 1,
    surahNameEn: next.surahNameEn,
    targetStart: target.startAyah,
    targetEnd: target.endAyah,
    planId: next.id,
    moreCount: rest.length,
  };
}

// --- Spaced-repetition review queue for memorized surahs ---

export const REVIEW_INTERVALS_DAYS = [1, 3, 7, 14, 30];
const MAX_REVIEW_STAGE = REVIEW_INTERVALS_DAYS.length - 1;

function addDaysISO(dateISO, days) {
  const date = new Date(dateISO);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function intervalDaysForStage(stage) {
  return REVIEW_INTERVALS_DAYS[clamp(stage, 0, MAX_REVIEW_STAGE)];
}

export function scheduleFirstReview(plan) {
  return {
    ...plan,
    reviewStage: 0,
    nextReviewDateISO: addDaysISO(todayISO(), intervalDaysForStage(0)),
    lastReviewedDateISO: null,
  };
}

export function isReviewDueToday(plan) {
  return plan.status === 'memorized' && !!plan.nextReviewDateISO && plan.nextReviewDateISO <= todayISO();
}

export function isReviewDoneToday(plan) {
  return plan.lastReviewedDateISO === todayISO();
}

export function daysUntilReview(plan) {
  if (!plan.nextReviewDateISO) return null;
  return Math.round((new Date(plan.nextReviewDateISO) - new Date(todayISO())) / 86400000);
}

export function reviewRemembered(plan) {
  const nextStage = clamp((plan.reviewStage ?? 0) + 1, 0, MAX_REVIEW_STAGE);
  return {
    ...plan,
    reviewStage: nextStage,
    nextReviewDateISO: addDaysISO(todayISO(), intervalDaysForStage(nextStage)),
    lastReviewedDateISO: todayISO(),
  };
}

export function reviewForgot(plan) {
  const nextStage = clamp((plan.reviewStage ?? 0) - 2, 0, MAX_REVIEW_STAGE);
  return {
    ...plan,
    reviewStage: nextStage,
    nextReviewDateISO: addDaysISO(todayISO(), intervalDaysForStage(nextStage)),
    lastReviewedDateISO: todayISO(),
  };
}

// Picks the single most-overdue surah to surface on the dashboard card, the
// same "one item + moreCount" shape summarizeToday uses for memorizing targets.
export function nextDueReview(plans) {
  const due = plans
    .filter((p) => isReviewDueToday(p) && !isReviewDoneToday(p))
    .sort((a, b) => a.nextReviewDateISO.localeCompare(b.nextReviewDateISO));
  if (due.length === 0) return null;
  const [next, ...rest] = due;
  return { planId: next.id, surahNameEn: next.surahNameEn, moreCount: rest.length };
}

// Self-healing load: back-fills review scheduling for any memorized plan that
// doesn't have one yet (created before this feature, or just flipped to
// "memorized" by markMemorizedToday/buildAlreadyMemorizedPlan, which don't
// know about review scheduling on purpose).
export async function loadPlansWithReviews() {
  const plans = await loadPlans();
  let changed = false;
  const migrated = plans.map((plan) => {
    if (plan.status === 'memorized' && !plan.nextReviewDateISO) {
      changed = true;
      return scheduleFirstReview(plan);
    }
    return plan;
  });
  if (changed) await savePlans(migrated);
  return migrated;
}
