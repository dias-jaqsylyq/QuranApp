// Curated references for the Home "Ayah of the Day" card — well-known,
// widely-cited verses. One is picked deterministically per calendar day (see
// hooks/useAyahOfTheDay.js). Only the reference lives here; the actual
// Arabic text and translations are fetched live from the same sources used
// everywhere else in the app (hooks/useQuranData.js's EDITIONS), so they
// stay accurate and follow the reader's chosen translation language.
export const CURATED_AYAHS = [
  { surahNumber: 2, ayahNumber: 255 },   // Ayat al-Kursi
  { surahNumber: 2, ayahNumber: 286 },   // Allah does not burden a soul beyond what it can bear
  { surahNumber: 94, ayahNumber: 6 },    // Indeed, with hardship comes ease
  { surahNumber: 65, ayahNumber: 3 },    // Whoever relies upon Allah, He is sufficient for him
  { surahNumber: 13, ayahNumber: 28 },   // Hearts find rest in the remembrance of Allah
  { surahNumber: 3, ayahNumber: 139 },   // Do not weaken and do not grieve
  { surahNumber: 39, ayahNumber: 53 },   // Do not despair of the mercy of Allah
  { surahNumber: 2, ayahNumber: 153 },   // Seek help through patience and prayer
  { surahNumber: 17, ayahNumber: 24 },   // Dua for parents
  { surahNumber: 49, ayahNumber: 13 },   // We created you from male and female, made you peoples and tribes
  { surahNumber: 3, ayahNumber: 159 },   // Gentleness and consultation
  { surahNumber: 20, ayahNumber: 25 },   // My Lord, expand for me my breast
  { surahNumber: 112, ayahNumber: 1 },   // Say, He is Allah, the One
  { surahNumber: 24, ayahNumber: 35 },   // Ayat an-Nur — Allah is the Light of the heavens and the earth
  { surahNumber: 3, ayahNumber: 26 },    // Say, O Allah, Owner of Sovereignty
  { surahNumber: 55, ayahNumber: 13 },   // So which of the favors of your Lord would you deny?
  { surahNumber: 21, ayahNumber: 87 },   // Dua of Yunus
  { surahNumber: 29, ayahNumber: 69 },   // Those who strive for Us, We will guide to Our ways
  { surahNumber: 94, ayahNumber: 1 },    // Did We not expand for you your breast?
  { surahNumber: 3, ayahNumber: 8 },     // Our Lord, let not our hearts deviate
  { surahNumber: 9, ayahNumber: 51 },    // Nothing will befall us except what Allah has decreed for us
  { surahNumber: 16, ayahNumber: 97 },   // Whoever does righteousness, We will give a good life
  { surahNumber: 2, ayahNumber: 152 },   // Remember Me; I will remember you
];
