import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const surahListCache = { data: null };
const surahCache = new Map();
const pageCache = new Map();

export const BASE = 'https://api.alquran.cloud/v1';
export const EDITIONS = 'quran-uthmani,en.transliteration,en.asad,ru.osmanov,kk.khalifahaltai';
// The /page endpoint doesn't support the combined editions/{list} shortcut the
// /surah endpoint does, so each edition is fetched separately and zipped by
// index (every edition shares the same per-page ayah count and order).
const PAGE_EDITIONS = EDITIONS.split(',');

// Bump this if the underlying text/translations are ever corrected at the
// source - old entries are simply orphaned under the previous prefix rather
// than needing an explicit migration.
const CACHE_PREFIX = 'quran-cache-v1';

async function readDiskCache(key) {
  try {
    const raw = await AsyncStorage.getItem(`${CACHE_PREFIX}:${key}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeDiskCache(key, value) {
  AsyncStorage.setItem(`${CACHE_PREFIX}:${key}`, JSON.stringify(value)).catch(() => {});
}

export function useSurahList() {
  const [surahs, setSurahs] = useState(surahListCache.data || []);
  const [loading, setLoading] = useState(!surahListCache.data);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (surahListCache.data) return;

    readDiskCache('surah-list').then(cached => {
      if (cached) {
        surahListCache.data = cached;
        setSurahs(cached);
        setLoading(false);
        return;
      }

      fetch(`${BASE}/surah`)
        .then(r => r.json())
        .then(json => {
          surahListCache.data = json.data;
          setSurahs(json.data);
          setLoading(false);
          writeDiskCache('surah-list', json.data);
        })
        .catch(e => {
          setError(e.message);
          setLoading(false);
        });
    });
  }, []);

  return { surahs, loading, error };
}

export function useSurah(number) {
  const cached = number ? surahCache.get(number) : null;
  const [data, setData] = useState(cached || null);
  const [loading, setLoading] = useState(!!number && !cached);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!number) return;
    if (surahCache.has(number)) {
      setData(surahCache.get(number));
      setLoading(false);
      return;
    }

    setLoading(true);
    readDiskCache(`surah-${number}`).then(cached => {
      if (cached) {
        surahCache.set(number, cached);
        setData(cached);
        setLoading(false);
        return;
      }

      fetch(`${BASE}/surah/${number}/editions/${EDITIONS}`)
        .then(r => r.json())
        .then(json => {
          surahCache.set(number, json.data);
          setData(json.data);
          setLoading(false);
          writeDiskCache(`surah-${number}`, json.data);
        })
        .catch(e => {
          setError(e.message);
          setLoading(false);
        });
    });
  }, [number]);

  return { data, loading, error };
}

// A page can span the tail of one surah and the start of the next, so each
// ayah carries its own surah info (unlike useSurah, where it's constant for
// the whole list).
export function useQuranPage(pageNumber) {
  const cached = pageNumber ? pageCache.get(pageNumber) : null;
  const [data, setData] = useState(cached || null);
  const [loading, setLoading] = useState(!!pageNumber && !cached);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!pageNumber) return;
    if (pageCache.has(pageNumber)) {
      setData(pageCache.get(pageNumber));
      setLoading(false);
      return;
    }

    setLoading(true);
    readDiskCache(`page-${pageNumber}`).then(cached => {
      if (cached) {
        pageCache.set(pageNumber, cached);
        setData(cached);
        setLoading(false);
        return;
      }

      Promise.all(PAGE_EDITIONS.map(ed => fetch(`${BASE}/page/${pageNumber}/${ed}`).then(r => r.json())))
        .then(results => {
          const combined = results.map(r => r.data);
          pageCache.set(pageNumber, combined);
          setData(combined);
          setLoading(false);
          writeDiskCache(`page-${pageNumber}`, combined);
        })
        .catch(e => {
          setError(e.message);
          setLoading(false);
        });
    });
  }, [pageNumber]);

  return { data, loading, error };
}
