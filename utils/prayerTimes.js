import { Coordinates, CalculationMethod, PrayerTimes as AdhanPrayerTimes } from 'adhan';

export const PRAYER_ORDER = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'];

export const PRAYER_LABELS = {
  fajr: 'Fajr',
  sunrise: 'Sunrise',
  dhuhr: 'Dhuhr',
  asr: 'Asr',
  maghrib: 'Maghrib',
  isha: 'Isha',
};

export const PRAYER_ICONS = {
  fajr: 'partly-sunny-outline',
  sunrise: 'sunny-outline',
  dhuhr: 'sunny',
  asr: 'partly-sunny',
  maghrib: 'cloudy-night-outline',
  isha: 'moon',
};

export function calculatePrayerTimes(coordinates, date = new Date()) {
  const coords = new Coordinates(coordinates.latitude, coordinates.longitude);
  return new AdhanPrayerTimes(coords, date, CalculationMethod.MuslimWorldLeague());
}
