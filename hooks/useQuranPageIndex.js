import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TOTAL_PAGES, TOTAL_JUZ } from '../utils/quranMeta';

const STORAGE_KEY = 'quran_page_index_v2';

let memoryCache = null;
let inflightPromise = null;

// Walking the full Uthmani edition once gives us, for every page 1..604, which
// surah/ayah it starts and ends on, the page span of every Juz, and which page
// each surah's first ayah falls on. Ayahs come back in strict Quran order, so
// first-seen = page/surah start and last-seen = page end.
function buildIndex(surahs) {
  const pageStart = new Array(TOTAL_PAGES + 1).fill(null);
  const pageEnd = new Array(TOTAL_PAGES + 1).fill(null);
  const juzRange = new Array(TOTAL_JUZ + 1).fill(null);
  const surahStartPage = new Array(surahs.length + 1).fill(null);

  for (const s of surahs) {
    for (const a of s.ayahs) {
      const entry = { surahNumber: s.number, surahName: s.name, surahNameEn: s.englishName, ayah: a.numberInSurah };
      if (!pageStart[a.page]) pageStart[a.page] = entry;
      pageEnd[a.page] = entry;

      if (!juzRange[a.juz]) juzRange[a.juz] = { startPage: a.page, endPage: a.page };
      else juzRange[a.juz].endPage = a.page;

      if (a.numberInSurah === 1) surahStartPage[s.number] = a.page;
    }
  }

  return { pageStart, pageEnd, juzRange, surahStartPage, totalPages: TOTAL_PAGES, totalJuz: TOTAL_JUZ };
}

async function loadIndex() {
  if (memoryCache) return memoryCache;
  if (inflightPromise) return inflightPromise;

  inflightPromise = (async () => {
    const cached = await AsyncStorage.getItem(STORAGE_KEY);
    if (cached) {
      try {
        memoryCache = JSON.parse(cached);
        return memoryCache;
      } catch {
        // corrupted cache entry - fall through to rebuild from network below
      }
    }
    const res = await fetch('https://api.alquran.cloud/v1/quran/quran-uthmani');
    const json = await res.json();
    const index = buildIndex(json.data.surahs);
    memoryCache = index;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(index)).catch(() => {});
    return index;
  })();

  return inflightPromise;
}

export function useQuranPageIndex() {
  const [index, setIndex] = useState(memoryCache);
  const [loading, setLoading] = useState(!memoryCache);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (memoryCache) return;
    loadIndex()
      .then(setIndex)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return { index, loading, error };
}
