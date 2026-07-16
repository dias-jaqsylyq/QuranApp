import { useState, useEffect, useCallback } from 'react';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Prayer } from 'adhan';
import { calculatePrayerTimes } from '../utils/prayerTimes';

const LOCATION_KEY = 'last_known_location';

export function usePrayerTimes() {
  const [coords, setCoords] = useState(null);
  const [locationName, setLocationName] = useState(null);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(new Date());

  const loadLocation = useCallback(async () => {
    setLoading(true);
    setPermissionDenied(false);

    const cached = await AsyncStorage.getItem(LOCATION_KEY);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        setCoords({ latitude: parsed.latitude, longitude: parsed.longitude });
        setLocationName(parsed.name ?? null);
      } catch {
        // corrupted cache entry - fall through to a fresh GPS fix below
      }
    }

    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      setPermissionDenied(true);
      setLoading(false);
      return;
    }

    try {
      const position = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = position.coords;
      setCoords({ latitude, longitude });

      let name = null;
      try {
        const places = await Location.reverseGeocodeAsync({ latitude, longitude });
        name = places?.[0]?.city || places?.[0]?.region || null;
      } catch {
        // reverse geocoding is best-effort - countdown still works without a place name
      }
      setLocationName(name);

      await AsyncStorage.setItem(LOCATION_KEY, JSON.stringify({ latitude, longitude, name }));
    } catch {
      // GPS fix failed (e.g. location services off) - keep whatever cached coords were set above
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLocation();
  }, [loadLocation]);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const times = coords ? calculatePrayerTimes(coords, now) : null;

  let nextKey = null;
  let nextTime = null;
  if (times) {
    const next = times.nextPrayer(now);
    if (next === Prayer.None) {
      // Past today's Isha - the next prayer is tomorrow's Fajr.
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      nextKey = 'fajr';
      nextTime = calculatePrayerTimes(coords, tomorrow).fajr;
    } else {
      nextKey = next;
      nextTime = times.timeForPrayer(next);
    }
  }

  const countdownMs = nextTime ? Math.max(0, nextTime.getTime() - now.getTime()) : null;

  return {
    loading,
    permissionDenied,
    locationName,
    times,
    nextKey,
    nextTime,
    countdownMs,
    retry: loadLocation,
  };
}
