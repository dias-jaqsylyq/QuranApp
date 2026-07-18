import React, { useMemo, useState, useCallback } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../theme/colors';
import { light as hapticLight } from '../utils/haptics';
import { useAuth } from '../context/AuthContext';
import AvatarView from '../components/AvatarView';
import PillButton from '../components/PillButton';
import SettingsRow from '../components/SettingsRow';
import { MOCK_PROFILE } from '../data/mockProfile';
import { pickAndSaveAvatar, AVATAR_KEY } from '../utils/avatarPicker';

const makeStyles = (C) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: C.bg },
    scrollContent: { paddingBottom: 60 },

    header: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: 16, paddingTop: 12, paddingBottom: 12,
    },
    backBtn: { padding: 4 },
    headerTitle: { fontSize: 17, fontWeight: '700', color: C.text },

    avatarRow: { alignItems: 'center', marginTop: 8, marginBottom: 16 },

    fieldsCard: {
      marginHorizontal: 20,
      backgroundColor: C.surfaceGray,
      borderRadius: 20,
      overflow: 'hidden',
    },
    field: { paddingHorizontal: 16, paddingVertical: 12 },
    fieldDivider: { borderTopWidth: 1, borderTopColor: C.separatorOnGray },
    fieldLabel: { fontSize: 12, color: C.textSecondary, marginBottom: 2 },
    fieldInput: { fontSize: 16, color: C.text, padding: 0 },

    bioCard: {
      marginHorizontal: 20,
      marginTop: 16,
      backgroundColor: C.surfaceGray,
      borderRadius: 20,
      padding: 16,
    },
    bioHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    bioLabel: { fontSize: 12, color: C.textSecondary },
    bioCounter: { fontSize: 12, color: C.textSecondary },
    bioInput: { fontSize: 16, color: C.text, minHeight: 60, padding: 0 },

    privateCard: {
      marginHorizontal: 20,
      marginTop: 16,
      backgroundColor: C.surfaceGray,
      borderRadius: 20,
      overflow: 'hidden',
    },

    deleteRow: {
      marginHorizontal: 20,
      marginTop: 16,
      backgroundColor: C.surfaceGray,
      borderRadius: 20,
      overflow: 'hidden',
    },
  });

export default function EditProfileScreen({ navigation }) {
  const C = useTheme();
  const styles = useMemo(() => makeStyles(C), [C]);
  const { user, deleteAccount } = useAuth();
  const [firstName, setFirstName] = useState(MOCK_PROFILE.displayName);
  const [lastName, setLastName] = useState('');
  const [location, setLocation] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUri, setAvatarUri] = useState(null);

  useFocusEffect(
    useCallback(() => {
      AsyncStorage.multiGet([
        'profile_first_name',
        'profile_last_name',
        'profile_location',
        'profile_bio',
        AVATAR_KEY,
      ]).then((pairs) => {
        const map = Object.fromEntries(pairs);
        setFirstName(map.profile_first_name || MOCK_PROFILE.displayName);
        setLastName(map.profile_last_name || '');
        setLocation(map.profile_location || '');
        setBio(map.profile_bio || '');
        setAvatarUri(map[AVATAR_KEY] || null);
      });
    }, []),
  );

  const handleSave = async () => {
    hapticLight();
    await AsyncStorage.multiSet([
      ['profile_first_name', firstName.trim()],
      ['profile_last_name', lastName.trim()],
      ['profile_location', location.trim()],
      ['profile_bio', bio],
    ]);
    navigation.goBack();
  };

  const handleAvatarPress = async () => {
    hapticLight();
    const uri = await pickAndSaveAvatar();
    if (uri) setAvatarUri(uri);
  };

  const goBack = () => {
    hapticLight();
    navigation.goBack();
  };

  const comingSoon = () => {
    hapticLight();
    Alert.alert('Coming soon');
  };

  // TODO: this clears the user's cloud sync rows, session, and local data,
  // but cannot remove the auth.users record itself — that needs a
  // service_role key, which must never ship inside the app. Until a Supabase
  // Edge Function exists for that, the account row must be deleted manually
  // from the Supabase dashboard (Authentication > Users).
  const confirmDelete = () => {
    hapticLight();
    Alert.alert(
      'Delete Account',
      'This removes your synced data and signs you out on this device. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteAccount();
              navigation.navigate('Profile');
            } catch (err) {
              Alert.alert('Something went wrong', err.message);
            }
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={goBack}>
          <Ionicons name="chevron-back" size={24} color={C.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <PillButton variant="primary" label="Save" onPress={handleSave} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.avatarRow}>
          <AvatarView
            initial={(firstName.trim()[0] || MOCK_PROFILE.initial).toUpperCase()}
            imageUri={avatarUri}
            size={88}
            showCameraBadge
            onCameraPress={handleAvatarPress}
          />
        </View>

        <View style={styles.fieldsCard}>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>First Name</Text>
            <TextInput style={styles.fieldInput} value={firstName} onChangeText={setFirstName} placeholderTextColor={C.textSecondary} />
          </View>
          <View style={[styles.field, styles.fieldDivider]}>
            <Text style={styles.fieldLabel}>Last Name</Text>
            <TextInput style={styles.fieldInput} value={lastName} onChangeText={setLastName} placeholderTextColor={C.textSecondary} />
          </View>
        </View>

        <View style={[styles.fieldsCard, { marginTop: 16 }]}>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Location</Text>
            <TextInput
              style={styles.fieldInput}
              value={location}
              onChangeText={setLocation}
              placeholder="Add your location"
              placeholderTextColor={C.textSecondary}
            />
          </View>
        </View>

        <View style={styles.bioCard}>
          <View style={styles.bioHeaderRow}>
            <Text style={styles.bioLabel}>Bio</Text>
            <Text style={styles.bioCounter}>{bio.length}/160</Text>
          </View>
          <TextInput
            style={styles.bioInput}
            value={bio}
            onChangeText={setBio}
            placeholder="Tell us about yourself"
            placeholderTextColor={C.textSecondary}
            multiline
            maxLength={160}
          />
        </View>

        <View style={styles.privateCard}>
          <SettingsRow icon="mail-outline" label="Email" value={user?.email ?? 'Not signed in'} chevron isFirst onPress={comingSoon} />
          <SettingsRow icon="notifications-outline" label="Notification Settings" chevron onPress={comingSoon} />
        </View>

        <View style={styles.deleteRow}>
          <SettingsRow icon="trash-outline" label="Delete Account" destructive chevron isFirst onPress={confirmDelete} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
