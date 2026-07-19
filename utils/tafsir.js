import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE = 'https://api.quran.com/api/v4';
const LIST_CACHE_KEY = 'tafsir-list-v1';
const LIST_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const AYAH_CACHE_PREFIX = 'tafsir-v1';

export const DEFAULT_TAFSIR = {
  id: 169,
  slug: 'en-tafisr-ibn-kathir',
  name: 'Tafsir Ibn Kathir',
  authorName: 'Hafiz Ibn Kathir',
};

/** Prefer friendly English display names for known editions. */
const DISPLAY_NAMES = {
  169: { name: 'Tafsir Ibn Kathir', authorName: 'Hafiz Ibn Kathir' },
  168: { name: "Ma'arif al-Qur'an", authorName: 'Mufti Muhammad Shafi' },
  817: { name: 'Tazkirul Quran', authorName: 'Maulana Wahiduddin Khan' },
};

export function stripHtml(html) {
  if (!html) return '';
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/h[1-6]>/gi, '\n\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function formatCitation(edition) {
  const name = edition?.name || DEFAULT_TAFSIR.name;
  const author = edition?.authorName || edition?.author_name;
  if (author) {
    return `${name} (${author}), English translation.`;
  }
  return `${name}, English translation.`;
}

function normalizeEdition(raw) {
  const known = DISPLAY_NAMES[raw.id];
  return {
    id: raw.id,
    slug: raw.slug,
    name: known?.name || raw.translated_name?.name || raw.name,
    authorName: known?.authorName || raw.author_name || '',
    languageName: raw.language_name,
  };
}

function ayahCacheKey(tafsirId, surah, ayah) {
  return `${AYAH_CACHE_PREFIX}:${tafsirId}:${surah}:${ayah}`;
}

/** Fetch/cache English tafsir editions from Quran.com. */
export async function getTafsirList({ forceRefresh = false } = {}) {
  if (!forceRefresh) {
    try {
      const raw = await AsyncStorage.getItem(LIST_CACHE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.fetchedAt && Date.now() - parsed.fetchedAt < LIST_TTL_MS && Array.isArray(parsed.items)) {
          return parsed.items;
        }
      }
    } catch {
      // fall through to network
    }
  }

  const res = await fetch(`${BASE}/resources/tafsirs`);
  if (!res.ok) throw new Error(`Couldn’t load tafsir list (${res.status})`);
  const json = await res.json();
  const items = (json.tafsirs || [])
    .filter((t) => String(t.language_name || '').toLowerCase() === 'english')
    .map(normalizeEdition);

  await AsyncStorage.setItem(
    LIST_CACHE_KEY,
    JSON.stringify({ fetchedAt: Date.now(), items }),
  ).catch(() => {});

  return items;
}

/**
 * Cache-first tafsir for one ayah.
 * Returns { text, resourceName, authorName, slug, fromCache }.
 * Pass forceRefresh: true to bypass cache (e.g. Retry).
 */
export async function getTafsirForAyah(surahNumber, ayahNumber, tafsirId, slug, { forceRefresh = false } = {}) {
  const id = tafsirId ?? DEFAULT_TAFSIR.id;
  const editionSlug = slug || DEFAULT_TAFSIR.slug;
  const key = ayahCacheKey(id, surahNumber, ayahNumber);

  let cached = null;
  try {
    const raw = await AsyncStorage.getItem(key);
    if (raw) cached = JSON.parse(raw);
  } catch {
    cached = null;
  }

  if (!forceRefresh && cached?.text) {
    return { ...cached, fromCache: true };
  }

  try {
    const res = await fetch(`${BASE}/tafsirs/${editionSlug}/by_ayah/${surahNumber}:${ayahNumber}`);
    if (!res.ok) throw new Error(`Couldn’t load tafsir (${res.status})`);
    const json = await res.json();
    const tafsir = json.tafsir;
    if (!tafsir?.text) throw new Error('No tafsir text for this ayah.');

    const known = DISPLAY_NAMES[id];
    const result = {
      text: stripHtml(tafsir.text),
      resourceName: known?.name || tafsir.resource_name || tafsir.translated_name?.name || DEFAULT_TAFSIR.name,
      authorName: known?.authorName || '',
      slug: tafsir.slug || editionSlug,
      fromCache: false,
    };

    await AsyncStorage.setItem(key, JSON.stringify(result)).catch(() => {});
    return result;
  } catch (err) {
    if (cached?.text) {
      return { ...cached, fromCache: true };
    }
    throw err;
  }
}

/** Resolve a display edition object from stored id/slug + optional list. */
export function resolveEdition(tafsirId, tafsirSlug, list = []) {
  const fromList = list.find((t) => t.id === tafsirId);
  if (fromList) return fromList;
  const known = DISPLAY_NAMES[tafsirId];
  return {
    id: tafsirId ?? DEFAULT_TAFSIR.id,
    slug: tafsirSlug || DEFAULT_TAFSIR.slug,
    name: known?.name || DEFAULT_TAFSIR.name,
    authorName: known?.authorName || DEFAULT_TAFSIR.authorName,
  };
}
