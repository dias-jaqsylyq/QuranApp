import AsyncStorage from '@react-native-async-storage/async-storage';
import { pushUpdate } from '../lib/sync';

export const STORAGE_KEY = 'bookmarks';
const SYNC_TABLE = 'bookmarks';

export async function loadBookmarks() {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function saveBookmarks(bookmarks) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(bookmarks));
  pushUpdate(SYNC_TABLE, bookmarks);
}

// Applies a pulled cloud value to local storage only — used by the sign-in
// sync pass, which must not immediately push the value it just downloaded
// back up to the cloud.
export async function applyRemoteBookmarks(bookmarks) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(bookmarks ?? []));
}
