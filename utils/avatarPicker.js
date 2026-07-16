import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { File, Paths } from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const AVATAR_KEY = 'profile_avatar_uri';
const AVATAR_FILENAME = 'profile-avatar.jpg';

// Picks an image, copies it into the app's own document directory (so it
// survives the OS clearing the picker's temp/cache file), and persists the
// resulting stable URI. Returns the new URI, or null if cancelled/denied.
export async function pickAndSaveAvatar() {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) {
    Alert.alert('Permission needed', 'Allow photo library access to set a profile picture.');
    return null;
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.7,
  });
  if (result.canceled || !result.assets?.length) return null;

  try {
    const destFile = new File(Paths.document, AVATAR_FILENAME);
    if (destFile.exists) destFile.delete();
    new File(result.assets[0].uri).copy(destFile);

    // Cache-bust: the destination path is always the same filename, so without
    // a changing query string <Image> would keep showing the old bytes.
    const stampedUri = `${destFile.uri}?t=${Date.now()}`;
    await AsyncStorage.setItem(AVATAR_KEY, stampedUri);
    return stampedUri;
  } catch (e) {
    console.warn('Avatar save error:', e.message);
    Alert.alert('Could not save photo', 'Something went wrong saving your profile picture.');
    return null;
  }
}
