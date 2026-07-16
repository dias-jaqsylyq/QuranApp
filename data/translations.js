// Display metadata for the editions already fetched in hooks/useQuranData.js's
// EDITIONS string. Keep this list in sync with that constant — it does not
// trigger any fetching itself, it just labels the data already requested.
export const TRANSLATION_OPTIONS = [
  { key: 'en', label: 'English', translator: 'Muhammad Asad', edition: 'en.asad' },
  { key: 'ru', label: 'Russian', translator: 'Magomed-Nuri Osmanov', edition: 'ru.osmanov' },
  { key: 'kz', label: 'Kazakh', translator: 'Khalifa Altai', edition: 'kk.khalifahaltai' },
];
