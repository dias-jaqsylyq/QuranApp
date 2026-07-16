const ARABIC_INDIC_DIGITS = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];

export function toArabicDigits(n) {
  return String(n).replace(/[0-9]/g, (d) => ARABIC_INDIC_DIGITS[Number(d)]);
}
