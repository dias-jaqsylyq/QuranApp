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
import { useI18n } from '../hooks/useI18n';
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
    pillLabelCol: { marginRight: 4, maxWidth: '42%' },
    pillLabel: { fontSize: 15, color: C.text, fontWeight: '500' },
    pillSubtitle: { fontSize: 12, color: C.textSecondary, marginTop: 2, lineHeight: 16 },
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
  { value: 'small',  labelKey: 'settings.fontSmall' },
  { value: 'medium', labelKey: 'settings.fontMedium' },
  { value: 'large',  labelKey: 'settings.fontLarge' },
];

const THEME_LABEL_KEYS = {
  light: 'settings.themeLight',
  dark: 'settings.themeDark',
};

const LANG_OPTIONS = [
  { value: 'en', label: 'EN' },
  { value: 'ru', label: 'RU' },
  { value: 'kz', label: 'KZ' },
];

export default function SettingsScreen({ navigation }) {
  const C = useTheme();
  const styles = useMemo(() => makeStyles(C), [C]);
  const { t } = useI18n();
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

  const handleSignOut = () => {
    hapticLight();
    Alert.alert(t('settings.signOut'), t('settings.signOutConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('settings.signOut'),
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
      t('settings.resetProfile'),
      t('settings.resetProfileMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.reset'),
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
      t('settings.resetProgress'),
      t('settings.resetProgressMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.reset'),
          style: 'destructive',
          onPress: async () => {
            hapticMedium();
            await savePlans([]);
          },
        },
      ],
    );
  };

  const themeLabel = (opt) =>
    t(opt.value == null ? 'settings.themeSystem' : (THEME_LABEL_KEYS[opt.value] || opt.label));

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={goBack}>
          <Ionicons name="chevron-back" size={24} color={C.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('settings.title')}</Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* ── Account ── */}
        <SectionHeader title={t('settings.account')} />
        <View style={styles.card}>
          <SettingsRow label={t('settings.editProfile')} chevron isFirst onPress={() => navigation.navigate('EditProfile')} />
          <SettingsRow icon="refresh-outline" label={t('settings.resetProfile')} destructive onPress={resetProfile} />
        </View>

        {isAuthenticated && (
          <View style={[styles.card, { marginTop: 16 }]}>
            <SettingsRow icon="mail-outline" label={t('settings.signedInAs')} value={user?.email} isFirst />
            <SettingsRow icon="log-out-outline" label={t('settings.signOut')} destructive onPress={handleSignOut} />
          </View>
        )}

        {/* ── General ── */}
        <SectionHeader title={t('settings.general')} />
        <View style={styles.card}>
          <View style={styles.themeRow}>
            <Text style={styles.themeLabel}>{t('settings.theme')}</Text>
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
                      {themeLabel(opt)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>

        {/* ── Quran Reading ── */}
        <SectionHeader title={t('settings.quranReading')} />
        <View style={styles.card}>
          <View style={styles.pillRow}>
            <View style={styles.pillLabelCol}>
              <Text style={styles.pillLabel}>{t('settings.translation')}</Text>
              <Text style={styles.pillSubtitle}>{t('settings.languageSubtitle')}</Text>
            </View>
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
            <Text style={styles.pillLabel}>{t('settings.fontSize')}</Text>
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
                    <Text style={[styles.pillText, active && styles.pillTextActive]}>{t(opt.labelKey)}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={styles.pillRowDivider}>
            <SettingsRow
              label={t('settings.defaultReciter')}
              value={reciterName}
              chevron
              isFirst
              onPress={() => navigation.navigate('Reciters')}
            />
          </View>
        </View>

        {/* ── Audio & Recitation ── */}
        <SectionHeader title={t('settings.audioRecitation')} />
        <View style={styles.card}>
          <SettingsRow
            label={t('settings.showAudioProgressBar')}
            switchValue={showAudioProgress}
            onSwitchChange={setShowAudioProgress}
            isFirst
          />
        </View>

        {/* ── Quran Memorization ── */}
        <SectionHeader title={t('settings.quranMemorization')} />
        <View style={styles.card}>
          <SettingsRow
            icon="refresh-outline"
            label={t('settings.resetProgress')}
            subtitle={t('settings.resetProgressSubtitle')}
            destructive
            isFirst
            onPress={resetMemorization}
          />
        </View>

        {/* ── Sources ── */}
        <SectionHeader title={t('settings.sources')} />
        <View style={styles.card}>
          <View style={styles.ackRow}>
            <Text style={styles.ackText}>{t('settings.ackAlquran')}</Text>
          </View>
          <View style={[styles.ackRow, styles.ackDivider]}>
            <Text style={styles.ackText}>{t('settings.ackEveryayah')}</Text>
          </View>
          <View style={[styles.ackRow, styles.ackDivider]}>
            <Text style={styles.ackText}>{t('settings.ackAmiri')}</Text>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}
