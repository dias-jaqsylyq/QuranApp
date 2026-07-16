import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE, EDITIONS } from './useQuranData';
import { CURATED_AYAHS } from '../data/ayahOfDay';
import { stripTajweed } from '../utils/quranText';

const CACHE_PREFIX = 'ayah-of-day-v1';

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

// Deterministic per-day pick — same verse for everyone on a given date,
// rolls over to the next entry at local midnight.
function pickTodayRef() {
  const seed = Number(todayISO().replace(/-/g, ''));
  return CURATED_AYAHS[seed % CURATED_AYAHS.length];
}

export function useAyahOfTheDay() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const ref = pickTodayRef();
    const cacheKey = `${CACHE_PREFIX}:${todayISO()}`;

    AsyncStorage.getItem(cacheKey).then(async (raw) => {
      if (raw) {
        if (!cancelled) {
          setData(JSON.parse(raw));
          setLoading(false);
        }
        return;
      }

      try {
        const res = await fetch(`${BASE}/ayah/${ref.surahNumber}:${ref.ayahNumber}/editions/${EDITIONS}`);
        const json = await res.json();
        const [uthmani, translit, en, ru, kz] = json.data;
        const built = {
          surahNumber: uthmani.surah.number,
          surahName: uthmani.surah.name,
          surahNameEn: uthmani.surah.englishName,
          ayahNumber: uthmani.numberInSurah,
          reference: `${uthmani.surah.englishName} ${uthmani.surah.number}:${uthmani.numberInSurah}`,
          arabic: stripTajweed(uthmani.text),
          transliteration: translit?.text ?? '',
          en: en?.text ?? '',
          ru: ru?.text ?? '',
          kz: kz?.text ?? '',
        };
        if (!cancelled) {
          setData(built);
          setLoading(false);
        }
        AsyncStorage.setItem(cacheKey, JSON.stringify(built)).catch(() => {});
      } catch (e) {
        if (!cancelled) {
          setError(e.message);
          setLoading(false);
        }
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return { data, loading, error };
}
