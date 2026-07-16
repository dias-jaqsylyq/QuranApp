export { TOTAL_PAGES, TOTAL_JUZ } from './quranMeta';
export const DEFAULT_TOTAL_DAYS = 30;

export function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n));
}

export function pagesPerDayFromDays(totalPages, days) {
  return clamp(Math.ceil(totalPages / Math.max(1, days)), 1, totalPages);
}

export function daysFromPagesPerDay(totalPages, pagesPerDay) {
  return clamp(Math.ceil(totalPages / Math.max(1, pagesPerDay)), 1, totalPages);
}

export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function formatFinishDate(days) {
  const d = new Date();
  d.setDate(d.getDate() + Math.max(0, days - 1));
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// Page range covered by a Juz span, derived from the cached page index.
export function pagesForJuzRange(index, fromJuz, toJuz) {
  const from = index.juzRange[fromJuz];
  const to = index.juzRange[toJuz];
  const startPage = from ? from.startPage : 1;
  const endPage = to ? to.endPage : index.totalPages;
  return { startPage, endPage, totalPages: Math.max(1, endPage - startPage + 1) };
}

// What the user owes today: the page span starting at their current position,
// resolved down to the surah/ayah it starts and ends on.
export function buildTodayTarget(index, plan) {
  if (!index || !plan) return null;
  const { currentPage, endPage, pagesPerDay } = plan;
  if (currentPage > endPage) return null;
  const targetEndPage = Math.min(currentPage + pagesPerDay - 1, endPage);
  return {
    startPage: currentPage,
    endPage: targetEndPage,
    start: index.pageStart[currentPage],
    end: index.pageEnd[targetEndPage],
  };
}

export function formatTargetRange(target) {
  if (!target?.start || !target?.end) return '';
  const { start, end } = target;
  if (start.surahNumber === end.surahNumber) {
    return `${start.surahNameEn} ${start.ayah}–${end.ayah}`;
  }
  return `${start.surahNameEn} ${start.ayah} – ${end.surahNameEn} ${end.ayah}`;
}
