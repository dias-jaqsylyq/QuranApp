import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../theme/colors';
import { light as hapticLight } from '../utils/haptics';
import { useAuth } from '../context/AuthContext';
import AvatarView from '../components/AvatarView';
import StatCard from '../components/StatCard';
import SectionHeader from '../components/SectionHeader';
import PillButton from '../components/PillButton';
import Sheet, { CLOSE_DURATION } from '../components/settings/Sheet';
import ReadingCircleSheet from '../components/ReadingCircleSheet';
import { MOCK_PROFILE, ACTIVITY_FILTERS } from '../data/mockProfile';
import { pickAndSaveAvatar, AVATAR_KEY } from '../utils/avatarPicker';
import { loadProfileStats } from '../utils/profileStats';
import { loadPlans } from '../utils/hifz';

const CIRCLE_KEY = 'reading_circle';
const TOTAL_SURAHS = 114;

const makeStyles = (C) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: C.bg },
    scrollContent: { paddingBottom: 140 },

    toolbar: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, paddingHorizontal: 16, paddingTop: 8 },
    toolbarBtn: {
      width: 36, height: 36, borderRadius: 18,
      backgroundColor: C.surfaceGray, alignItems: 'center', justifyContent: 'center',
    },

    nameRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, marginTop: 8 },
    name: { fontSize: 34, fontWeight: '700', color: C.text, flex: 1 },
    locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 20, marginTop: 6 },
    locationText: { fontSize: 13, color: C.textSecondary },
    bio: { fontSize: 14, color: C.textSecondary, lineHeight: 20, paddingHorizontal: 20, marginTop: 8 },

    pillRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 20, marginTop: 20 },

    actionRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 20, marginTop: 24 },
    actionCard: {
      flex: 1, backgroundColor: C.surfaceGray, borderRadius: 18,
      paddingVertical: 18, alignItems: 'center', gap: 8,
    },
    actionLabel: { fontSize: 13, fontWeight: '600', color: C.text },

    statRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 20, marginTop: 16 },

    filterRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 20, marginTop: 4, flexWrap: 'wrap' },
    filterPill: {
      paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16,
      backgroundColor: C.surfaceGray,
    },
    filterPillActive: { backgroundColor: C.primaryButtonBg },
    filterText: { fontSize: 13, fontWeight: '600', color: C.text },
    filterTextActive: { color: C.primaryButtonText },

    emptyState: { alignItems: 'center', paddingVertical: 48, gap: 8 },
    emptyText: { fontSize: 14, color: C.textSecondary },

    lockedWrap: { alignItems: 'center', paddingHorizontal: 32, paddingTop: 60 },
    lockedIcon: {
      width: 72, height: 72, borderRadius: 36,
      backgroundColor: C.surfaceGray, alignItems: 'center', justifyContent: 'center',
      marginBottom: 20,
    },
    lockedTitle: { fontSize: 22, fontWeight: '700', color: C.text, textAlign: 'center' },
    lockedSubtitle: {
      fontSize: 14, color: C.textSecondary, textAlign: 'center',
      lineHeight: 20, marginTop: 8, marginBottom: 28,
    },
    lockedButtons: { width: '100%', gap: 10 },
  });

export default function ProfileScreen({ navigation }) {
  const C = useTheme();
  const styles = useMemo(() => makeStyles(C), [C]);
  const { isAuthenticated } = useAuth();
  const [filter, setFilter] = useState('All');

  const [profile, setProfile] = useState({
    firstName: MOCK_PROFILE.displayName,
    lastName: '',
    location: '',
    bio: '',
    avatarUri: null,
  });
  const [stats, setStats] = useState({ streak: 0, earnedBadges: [] });
  const [memorizedCount, setMemorizedCount] = useState(0);
  const [circle, setCircle] = useState([]);
  const [circleOpen, setCircleOpen] = useState(false);
  const [circleMounted, setCircleMounted] = useState(false);

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
        setProfile({
          firstName: map.profile_first_name || MOCK_PROFILE.displayName,
          lastName: map.profile_last_name || '',
          location: map.profile_location || '',
          bio: map.profile_bio || '',
          avatarUri: map[AVATAR_KEY] || null,
        });
      });
      loadProfileStats().then(setStats);
      loadPlans().then((plans) => setMemorizedCount(plans.filter((p) => p.status === 'memorized').length));
      AsyncStorage.getItem(CIRCLE_KEY).then((raw) => {
        try {
          setCircle(raw ? JSON.parse(raw) : []);
        } catch {
          setCircle([]);
        }
      });
    }, []),
  );

  useEffect(() => {
    if (circleOpen) {
      setCircleMounted(true);
    } else if (circleMounted) {
      const t = setTimeout(() => setCircleMounted(false), CLOSE_DURATION);
      return () => clearTimeout(t);
    }
  }, [circleOpen, circleMounted]);

  const comingSoon = () => {
    hapticLight();
    Alert.alert('Coming soon');
  };

  const goToSettings = () => {
    hapticLight();
    navigation.navigate('Settings');
  };

  const goToAuth = (initialMode) => {
    hapticLight();
    navigation.navigate('Auth', { initialMode });
  };

  const handleAvatarPress = async () => {
    hapticLight();
    const uri = await pickAndSaveAvatar();
    if (uri) setProfile((p) => ({ ...p, avatarUri: uri }));
  };

  const openCircle = () => {
    hapticLight();
    setCircleOpen(true);
  };

  const addCircleEntry = async (name) => {
    const next = [...circle, { id: String(Date.now()), name }];
    setCircle(next);
    await AsyncStorage.setItem(CIRCLE_KEY, JSON.stringify(next));
  };

  const removeCircleEntry = async (id) => {
    const next = circle.filter((e) => e.id !== id);
    setCircle(next);
    await AsyncStorage.setItem(CIRCLE_KEY, JSON.stringify(next));
  };

  const showBadges = () => {
    hapticLight();
    if (stats.earnedBadges.length === 0) {
      Alert.alert('Badges', 'No badges yet — keep reading to earn your first one!');
      return;
    }
    Alert.alert('Badges Earned', stats.earnedBadges.map((b) => `• ${b.label}`).join('\n'));
  };

  const openBookmarks = () => {
    hapticLight();
    navigation.navigate('Discover', { screen: 'Bookmarks' });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.toolbar}>
          <TouchableOpacity style={styles.toolbarBtn} onPress={comingSoon}>
            <Ionicons name="qr-code-outline" size={18} color={C.text} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.toolbarBtn} onPress={goToSettings}>
            <Ionicons name="settings-outline" size={18} color={C.text} />
          </TouchableOpacity>
        </View>

        {isAuthenticated ? (
          <>
            <View style={styles.nameRow}>
              <Text style={styles.name}>
                {profile.firstName}{profile.lastName ? ` ${profile.lastName}` : ''}
              </Text>
              <AvatarView
                initial={(profile.firstName.trim()[0] || MOCK_PROFILE.initial).toUpperCase()}
                imageUri={profile.avatarUri}
                size={72}
                showCameraBadge
                onCameraPress={handleAvatarPress}
              />
            </View>

            {profile.location ? (
              <View style={styles.locationRow}>
                <Ionicons name="location-outline" size={13} color={C.textSecondary} />
                <Text style={styles.locationText}>{profile.location}</Text>
              </View>
            ) : null}

            {profile.bio ? <Text style={styles.bio}>{profile.bio}</Text> : null}

            <View style={styles.pillRow}>
              <PillButton variant="secondary" label="Add Person" icon="person-add-outline" onPress={openCircle} style={{ flex: 1 }} />
              <PillButton variant="secondary" label={`Circle (${circle.length})`} icon="people-outline" onPress={openCircle} style={{ flex: 1 }} />
            </View>

            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.actionCard} onPress={openBookmarks} activeOpacity={0.7}>
                <Ionicons name="bookmark-outline" size={22} color={C.text} />
                <Text style={styles.actionLabel}>Saved</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.statRow}>
              <StatCard value={stats.streak} label="Reading Streak" icon="flame-outline" />
              <StatCard value={stats.earnedBadges.length} label="Badges" icon="ribbon-outline" onPress={showBadges} />
              <StatCard value={`${memorizedCount}/${TOTAL_SURAHS}`} label="Memorized" icon="book-outline" />
            </View>

            <SectionHeader title="Activity" />
            <View style={styles.filterRow}>
              {ACTIVITY_FILTERS.map((item) => {
                const active = filter === item;
                return (
                  <TouchableOpacity
                    key={item}
                    style={[styles.filterPill, active && styles.filterPillActive]}
                    onPress={() => { hapticLight(); setFilter(item); }}
                  >
                    <Text style={[styles.filterText, active && styles.filterTextActive]}>{item}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.emptyState}>
              <Ionicons name="time-outline" size={36} color={C.border} />
              <Text style={styles.emptyText}>No activity yet</Text>
            </View>
          </>
        ) : (
          <View style={styles.lockedWrap}>
            <View style={styles.lockedIcon}>
              <Ionicons name="person-outline" size={32} color={C.textSecondary} />
            </View>
            <Text style={styles.lockedTitle}>Sign in to QuranApp</Text>
            <Text style={styles.lockedSubtitle}>
              Create a free account to sync your Daily Khatm plan, bookmarks, and Reading Circle across devices.
            </Text>
            <View style={styles.lockedButtons}>
              <PillButton variant="primary" label="Create an Account" onPress={() => goToAuth('signup')} />
              <PillButton variant="secondary" label="Sign In" onPress={() => goToAuth('signin')} />
            </View>
          </View>
        )}
      </ScrollView>

      <Modal
        transparent
        visible={circleMounted}
        animationType="none"
        statusBarTranslucent
        onRequestClose={() => setCircleOpen(false)}
      >
        <Sheet visible={circleOpen} onClose={() => setCircleOpen(false)} title="Reading Circle">
          <ReadingCircleSheet circle={circle} onAdd={addCircleEntry} onRemove={removeCircleEntry} />
        </Sheet>
      </Modal>
    </SafeAreaView>
  );
}
