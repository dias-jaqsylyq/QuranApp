import React, { useMemo, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme, THEME_OPTIONS } from '../theme/colors';
import { useSettings } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { light as hapticLight, medium as hapticMedium } from '../utils/haptics';
import { RECITERS, DEFAULT_RECITER } from '../data/reciters';
import { AVATAR_KEY } from '../utils/avatarPicker';
import { savePlans } from '../utils/hifz';
import SectionHeader from '../components/SectionHeader';
import SettingsRow from '../components/SettingsRow';

const PROFILE_RESET_KEYS = [
  'profile_first_name',
  'profile_last_name',
  'profile_location',
  'profile_bio',
  AVATAR_KEY,
  'reading_circle',
];

const makeStyles = (C) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: C.bg },

    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 16,
    },
    backBtn: { padding: 4 },
    headerTitle: { fontSize: 28, fontWeight: '700', color: C.text },

    scroll: { flex: 1 },
    scrollContent: { paddingBottom: 140 },

    card: {
      marginHorizontal: 16,
      backgroundColor: C.surfaceGray,
      borderRadius: 20,
      overflow: 'hidden',
    },

    pillRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      gap: 8,
    },
    pillRowDivider: { borderTopWidth: 1, borderTopColor: C.separatorOnGray },
    pillLabel: { fontSize: 15, color: C.text, fontWeight: '500', marginRight: 4 },
    pillsWrap: { flex: 1, flexDirection: 'row', justifyContent: 'flex-end', gap: 6 },
    pill: {
      paddingHorizontal: 14,
      paddingVertical: 6,
      borderRadius: 20,
      backgroundColor: C.bg,
    },
    pillActive: { backgroundColor: C.accent },
    pillText: { fontSize: 13, fontWeight: '600', color: C.textSecondary },
    pillTextActive: { color: '#FFFFFF' },

    themeRow: { paddingHorizontal: 16, paddingVertical: 12 },
    themeLabel: { fontSize: 15, color: C.text, fontWeight: '500', marginBottom: 10 },
    themeOptions: { flexDirection: 'row', gap: 8 },
    themeOption: {
      flex: 1,
      paddingVertical: 10,
      borderRadius: 10,
      borderWidth: 1.5,
      borderColor: 'transparent',
      alignItems: 'center',
      gap: 6,
      backgroundColor: C.bg,
    },
    themeOptionActive: { borderColor: C.accent, backgroundColor: C.cardActive },
    themeOptionText: { fontSize: 12, fontWeight: '600', color: C.textSecondary },
    themeOptionTextActive: { color: C.accent },

    ackText: { fontSize: 14, color: C.textSecondary, lineHeight: 22 },
    ackLink: { fontSize: 14, color: C.accent, fontWeight: '500' },
    ackRow: { paddingHorizontal: 16, paddingVertical: 14 },
    ackDivider: { borderTopWidth: 1, borderTopColor: C.border },
  });

const FONT_OPTIONS = [
  { value: 'small',  label: 'Small' },
  { value: 'medium', label: 'Medium' },
  { value: 'large',  label: 'Large' },
];

const LANG_OPTIONS = [
  { value: 'en', label: 'EN' },
  { value: 'ru', label: 'RU' },
  { value: 'kz', label: 'KZ' },
];

export default function SettingsScreen({ navigation }) {
  const C = useTheme();
  const styles = useMemo(() => makeStyles(C), [C]);
  const {
    colorMode, setColorMode,
    fontSize, setFontSize,
    defaultLang, setDefaultLang,
    showAudioProgress, setShowAudioProgress,
  } = useSettings();
  const { isAuthenticated, user, signOut } = useAuth();
  const [reciterName, setReciterName] = useState(DEFAULT_RECITER.name);

  // Mirrors ReciterScreen.js's own AsyncStorage lookup, read-only, so the
  // selected reciter's name can be shown here without owning the selection state.
  useFocusEffect(
    useCallback(() => {
      AsyncStorage.getItem('selected_reciter').then((id) => {
        const found = RECITERS.find((r) => r.id === id);
        setReciterName(found ? found.name : DEFAULT_RECITER.name);
      });
    }, []),
  );

  const choose = (setter, val) => {
    hapticLight();
    setter(val);
  };

  const goBack = () => {
    hapticLight();
    navigation.goBack();
  };

  const comingSoon = () => {
    hapticLight();
    Alert.alert('Coming soon');
  };

  const handleSignOut = () => {
    hapticLight();
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          hapticMedium();
          await signOut();
          navigation.navigate('Profile');
        },
      },
    ]);
  };

  const resetProfile = () => {
    hapticLight();
    Alert.alert(
      'Reset Profile',
      "This clears your name, avatar, bio, and local Reading Circle list. Your reading progress, bookmarks, and Khatm plans are not affected — there's no account to sign out of.",
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            hapticMedium();
            await AsyncStorage.multiRemove(PROFILE_RESET_KEYS);
            navigation.navigate('Profile');
          },
        },
      ],
    );
  };

  const resetMemorization = () => {
    hapticLight();
    Alert.alert(
      'Reset Your Progress',
      'This wipes all memorization plans and review history. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            hapticMedium();
            await savePlans([]);
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={goBack}>
          <Ionicons name="chevron-back" size={24} color={C.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* ── Account ── */}
        <SectionHeader title="Account" />
        <View style={styles.card}>
          <SettingsRow label="Edit Profile" chevron isFirst onPress={() => navigation.navigate('EditProfile')} />
          <SettingsRow icon="refresh-outline" label="Reset Profile" destructive onPress={resetProfile} />
        </View>

        {isAuthenticated && (
          <View style={[styles.card, { marginTop: 16 }]}>
            <SettingsRow icon="mail-outline" label="Signed in as" value={user?.email} isFirst />
            <SettingsRow icon="log-out-outline" label="Sign Out" destructive onPress={handleSignOut} />
          </View>
        )}

        {/* ── General ── */}
        <SectionHeader title="General" />
        <View style={styles.card}>
          <View style={styles.themeRow}>
            <Text style={styles.themeLabel}>Theme</Text>
            <View style={styles.themeOptions}>
              {THEME_OPTIONS.map(opt => {
                const active = colorMode === opt.value;
                return (
                  <TouchableOpacity
                    key={String(opt.value)}
                    style={[styles.themeOption, active && styles.themeOptionActive]}
                    onPress={() => choose(setColorMode, opt.value)}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={opt.icon}
                      size={20}
                      color={active ? C.accent : C.textSecondary}
                    />
                    <Text style={[styles.themeOptionText, active && styles.themeOptionTextActive]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>

        {/* ── Quran Reading ── */}
        <SectionHeader title="Quran Reading" />
        <View style={styles.card}>
          <View style={styles.pillRow}>
            <Text style={styles.pillLabel}>Translation</Text>
            <View style={styles.pillsWrap}>
              {LANG_OPTIONS.map(opt => {
                const active = defaultLang === opt.value;
                return (
                  <TouchableOpacity
                    key={opt.value}
                    style={[styles.pill, active && styles.pillActive]}
                    onPress={() => choose(setDefaultLang, opt.value)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.pillText, active && styles.pillTextActive]}>{opt.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={[styles.pillRow, styles.pillRowDivider]}>
            <Text style={styles.pillLabel}>Font Size</Text>
            <View style={styles.pillsWrap}>
              {FONT_OPTIONS.map(opt => {
                const active = fontSize === opt.value;
                return (
                  <TouchableOpacity
                    key={opt.value}
                    style={[styles.pill, active && styles.pillActive]}
                    onPress={() => choose(setFontSize, opt.value)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.pillText, active && styles.pillTextActive]}>{opt.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={styles.pillRowDivider}>
            <SettingsRow
              label="Default Reciter"
              value={reciterName}
              chevron
              isFirst
              onPress={() => navigation.navigate('Reciters')}
            />
          </View>
        </View>

        {/* ── Audio & Recitation ── */}
        <SectionHeader title="Audio & Recitation" />
        <View style={styles.card}>
          <SettingsRow
            label="Show Audio Progress Bar"
            switchValue={showAudioProgress}
            onSwitchChange={setShowAudioProgress}
            isFirst
          />
        </View>

        {/* ── Quran Memorization ── */}
        <SectionHeader title="Quran Memorization" />
        <View style={styles.card}>
          <SettingsRow
            icon="refresh-outline"
            label="Reset Your Progress"
            subtitle="Wipe all memorization data"
            destructive
            isFirst
            onPress={resetMemorization}
          />
        </View>

        {/* ── Sources ── */}
        <SectionHeader title="Sources" />
        <View style={styles.card}>
          <View style={styles.ackRow}>
            <Text style={styles.ackText}>
              Quran text, translations, and metadata from{' '}
              <Text style={styles.ackLink}>alquran.cloud</Text>
            </Text>
          </View>
          <View style={[styles.ackRow, styles.ackDivider]}>
            <Text style={styles.ackText}>
              Audio recitations from{' '}
              <Text style={styles.ackLink}>everyayah.com</Text>
            </Text>
          </View>
          <View style={[styles.ackRow, styles.ackDivider]}>
            <Text style={styles.ackText}>
              Arabic typography uses the{' '}
              <Text style={styles.ackLink}>Amiri</Text>
              {' '}font by Khaled Hosny (SIL Open Font License)
            </Text>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}
