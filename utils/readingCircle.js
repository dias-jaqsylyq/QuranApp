import AsyncStorage from '@react-native-async-storage/async-storage';
import { pushUpdate } from '../lib/sync';

export const STORAGE_KEY = 'reading_circle';
const SYNC_TABLE = 'reading_circle';

export async function loadCircle() {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function saveCircle(circle) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(circle));
  pushUpdate(SYNC_TABLE, circle);
}

// Applies a pulled cloud value to local storage only — used by the sign-in
// sync pass, which must not immediately push the value it just downloaded
// back up to the cloud.
export async function applyRemoteCircle(circle) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(circle ?? []));
}
