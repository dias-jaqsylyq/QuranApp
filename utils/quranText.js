export function simplifyTranslit(text) {
  if (!text) return '';
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/gu, '')
    .replace(/[ʾʿʻ]/gu, '')
    .normalize('NFC');
}

export function stripTajweed(raw) {
  if (!raw) return '';
  return raw
    .replace(/<[^>]*>/g, '')      // <tajweed class="...">...</tajweed> HTML tags
    .replace(/\[[^\]]*\]/g, '')   // [h:1] [/h] bracket-style markers
    .trim();
}
