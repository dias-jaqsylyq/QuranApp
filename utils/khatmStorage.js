import AsyncStorage from '@react-native-async-storage/async-storage';
import { pushUpdate } from '../lib/sync';

export const STORAGE_KEY = 'khatm_plan';
const SYNC_TABLE = 'khatm_progress';

export async function loadKhatmPlan() {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export async function saveKhatmPlan(plan) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(plan));
  pushUpdate(SYNC_TABLE, plan);
}

export async function clearKhatmPlan() {
  await AsyncStorage.removeItem(STORAGE_KEY);
  pushUpdate(SYNC_TABLE, null);
}

// Applies a pulled cloud value to local storage only — used by the sign-in
// sync pass, which must not immediately push the value it just downloaded
// back up to the cloud.
export async function applyRemoteKhatmPlan(plan) {
  if (plan) {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(plan));
  } else {
    await AsyncStorage.removeItem(STORAGE_KEY);
  }
}
