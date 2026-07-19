import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../theme/colors';
import { light as hapticLight } from '../utils/haptics';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/AppContext';
import PillButton from '../components/PillButton';
import PrayerTimesCard from '../components/PrayerTimesCard';
import TodayHifzCard from '../components/TodayHifzCard';
import AuthBenefitsSheet from '../components/AuthBenefitsSheet';
import { CLOSE_DURATION } from '../components/settings/Sheet';
import { useAyahOfTheDay } from '../hooks/useAyahOfTheDay';
import { loadProfileStats } from '../utils/profileStats';
import { AYAH_OF_THE_DAY } from '../data/mockHome';

const AUTH_PROMPT_DISMISSED_KEY = 'auth_prompt_dismissed';

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 18) return 'Good Afternoon';
  return 'Good Evening';
}

const makeStyles = (C) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: C.bg },
    scrollContent: { paddingBottom: 140 },

    segmentRow: {
      flexDirection: 'row',
      marginHorizontal: 20,
      marginTop: 12,
      backgroundColor: C.surfaceGray,
      borderRadius: 12,
      padding: 4,
      gap: 4,
    },
    segment: { flex: 1, paddingVertical: 8, borderRadius: 9, alignItems: 'center' },
    segmentActive: { backgroundColor: C.bg },
    segmentText: { fontSize: 14, fontWeight: '600', color: C.textSecondary },
    segmentTextActive: { color: C.text },

    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingTop: 24,
    },
    greeting: { fontSize: 28, fontWeight: '700', color: C.text },
    streakRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
    streakText: { fontSize: 14, color: C.textSecondary, fontWeight: '500' },

    heroCard: {
      marginHorizontal: 20,
      marginTop: 24,
      borderRadius: 24,
      padding: 20,
      overflow: 'hidden',
    },
    heroLabel: { fontSize: 13, fontWeight: '700', color: '#D4A017', letterSpacing: 0.5, textTransform: 'uppercase' },
    heroReference: { fontSize: 17, fontWeight: '700', color: '#FFFFFF', marginTop: 6 },
    heroArabic: {
      fontSize: 26, color: '#FFFFFF', fontFamily: 'Amiri_400Regular',
      textAlign: 'right', lineHeight: 42, marginTop: 16,
    },
    heroTranslation: { fontSize: 14, color: 'rgba(255,255,255,0.75)', lineHeight: 21, marginTop: 12 },

    engagementRow: { flexDirection: 'row', alignItems: 'center', gap: 20, marginTop: 20 },
    engagementItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    engagementText: { fontSize: 13, color: 'rgba(255,255,255,0.75)' },

    ctaRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 20 },
    dismissBtn: { padding: 6 },

    placeholder: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 100, gap: 8 },
    placeholderText: { fontSize: 15, color: C.textSecondary },
  });

export default function HomeScreen({ navigation }) {
  const C = useTheme();
  const styles = useMemo(() => makeStyles(C), [C]);
  const { isAuthenticated } = useAuth();
  const { defaultLang } = useSettings();
  const [segment, setSegment] = useState('today');
  const [dismissed, setDismissed] = useState(false);
  const [streak, setStreak] = useState(0);
  const [engagement, setEngagement] = useState({
    liked: false,
    likeCount: AYAH_OF_THE_DAY.likeCount,
  });

  useFocusEffect(
    useCallback(() => {
      loadProfileStats().then((stats) => setStreak(stats.streak));
    }, []),
  );

  // Rotates daily from a curated list (see data/ayahOfDay.js); falls back to
  // the static verse while the day's pick is loading or if the fetch fails,
  // so the hero card is never left empty. Engagement counts stay static for
  // now — there's no backend to make likes/comments/shares real yet.
  const { data: todaysAyah } = useAyahOfTheDay();
  const ayah = todaysAyah ?? AYAH_OF_THE_DAY;
  const ayahTranslation = todaysAyah
    ? (defaultLang === 'ru' ? todaysAyah.ru : defaultLang === 'kz' ? todaysAyah.kz : todaysAyah.en)
    : AYAH_OF_THE_DAY.translation;

  const [authSheetOpen, setAuthSheetOpen] = useState(false);
  const [authSheetMounted, setAuthSheetMounted] = useState(false);

  useEffect(() => {
    if (isAuthenticated) return;
    AsyncStorage.getItem(AUTH_PROMPT_DISMISSED_KEY).then((dismissedFlag) => {
      if (!dismissedFlag) setAuthSheetOpen(true);
    });
    // Runs once on first Home mount per app launch — re-checking on every
    // focus would reopen the sheet each time the user revisits this tab.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (authSheetOpen) {
      setAuthSheetMounted(true);
    } else if (authSheetMounted) {
      const t = setTimeout(() => setAuthSheetMounted(false), CLOSE_DURATION);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authSheetOpen, authSheetMounted]);

  const closeAuthSheet = () => {
    setAuthSheetOpen(false);
    AsyncStorage.setItem(AUTH_PROMPT_DISMISSED_KEY, '1');
  };

  const toggleLike = () => {
    hapticLight();
    setEngagement((prev) => ({
      liked: !prev.liked,
      likeCount: prev.liked ? prev.likeCount - 1 : prev.likeCount + 1,
    }));
  };

  const selectSegment = (value) => {
    hapticLight();
    setSegment(value);
  };

  const comingSoon = () => {
    hapticLight();
    Alert.alert('Coming soon');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.segmentRow}>
        <TouchableOpacity
          style={[styles.segment, segment === 'today' && styles.segmentActive]}
          onPress={() => selectSegment('today')}
        >
          <Text style={[styles.segmentText, segment === 'today' && styles.segmentTextActive]}>Today</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.segment, segment === 'community' && styles.segmentActive]}
          onPress={() => selectSegment('community')}
        >
          <Text style={[styles.segmentText, segment === 'community' && styles.segmentTextActive]}>Community</Text>
        </TouchableOpacity>
      </View>

      {segment === 'community' ? (
        <View style={styles.placeholder}>
          <Ionicons name="people-outline" size={48} color={C.border} />
          <Text style={styles.placeholderText}>Community feed coming soon</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <View>
              <Text style={styles.greeting}>{getGreeting()}</Text>
              <View style={styles.streakRow}>
                <Ionicons name="flame-outline" size={14} color={C.accent} />
                <Text style={styles.streakText}>{streak} day streak</Text>
              </View>
            </View>
          </View>

          <TodayHifzCard navigation={navigation} />

          <PrayerTimesCard />

          <LinearGradient colors={['#0D1B2A', '#1A3A2A']} style={styles.heroCard}>
            <Text style={styles.heroLabel}>Ayah of the Day</Text>
            <Text style={styles.heroReference}>{ayah.reference}</Text>
            <Text style={styles.heroArabic}>{ayah.arabic}</Text>
            <Text style={styles.heroTranslation}>{ayahTranslation}</Text>

            <View style={styles.engagementRow}>
              <TouchableOpacity style={styles.engagementItem} onPress={toggleLike}>
                <Ionicons name={engagement.liked ? 'heart' : 'heart-outline'} size={18} color={engagement.liked ? '#FF6B81' : '#FFFFFF'} />
                <Text style={styles.engagementText}>{engagement.likeCount}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.engagementItem} onPress={comingSoon}>
                <Ionicons name="chatbubble-outline" size={18} color="#FFFFFF" />
                <Text style={styles.engagementText}>{AYAH_OF_THE_DAY.commentCount}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.engagementItem} onPress={comingSoon}>
                <Ionicons name="share-outline" size={18} color="#FFFFFF" />
                <Text style={styles.engagementText}>{AYAH_OF_THE_DAY.shareCount}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.engagementItem} onPress={comingSoon}>
                <Ionicons name="ellipsis-horizontal" size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            {!dismissed && (
              <View style={styles.ctaRow}>
                <PillButton variant="primary" label="Send Me This Daily" icon="notifications" onPress={comingSoon} style={{ flex: 1 }} />
                <TouchableOpacity style={styles.dismissBtn} onPress={() => { hapticLight(); setDismissed(true); }}>
                  <Ionicons name="close" size={20} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            )}
          </LinearGradient>
        </ScrollView>
      )}

      <Modal
        transparent
        visible={authSheetMounted}
        animationType="none"
        statusBarTranslucent
        onRequestClose={closeAuthSheet}
      >
        <AuthBenefitsSheet visible={authSheetOpen} onClose={closeAuthSheet} navigation={navigation} />
      </Modal>
    </SafeAreaView>
  );
}
