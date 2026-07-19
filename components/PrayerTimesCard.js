import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Pressable,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../theme/colors';
import { usePrayerTimes } from '../hooks/usePrayerTimes';
import { useI18n } from '../hooks/useI18n';
import { PRAYER_ORDER, PRAYER_ICONS } from '../utils/prayerTimes';
import { light as hapticLight } from '../utils/haptics';
import PillButton from './PillButton';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

function formatCountdown(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const pad = (n) => String(n).padStart(2, '0');
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

function formatTime(date) {
  return date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

const makeStyles = (C) =>
  StyleSheet.create({
    card: {
      marginHorizontal: 20,
      marginTop: 24,
      backgroundColor: C.surfaceGray,
      borderRadius: 24,
      padding: 20,
    },
    topRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
    },
    nextLabel: { fontSize: 13, fontWeight: '600', color: C.textSecondary },
    nextRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8, marginTop: 4 },
    nextName: { fontSize: 22, fontWeight: '700', color: C.text },
    countdown: { fontSize: 22, fontWeight: '700', color: C.accent },
    rightCluster: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
    metaCol: { alignItems: 'flex-end', gap: 4 },
    metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    locationText: { fontSize: 13, fontWeight: '600', color: C.text },
    dateText: { fontSize: 12, color: C.textSecondary },
    statusText: { fontSize: 13, color: C.textSecondary, marginTop: 8, lineHeight: 18 },

    // Collapsed row of icons
    slotRow: { flexDirection: 'row', marginTop: 20, gap: 6 },
    slot: { flex: 1, flexShrink: 1, minWidth: 0, alignItems: 'center', gap: 4, paddingVertical: 10, borderRadius: 14 },
    slotActive: { backgroundColor: C.surfaceGraySecondary },
    slotLabel: { fontSize: 11, fontWeight: '600', color: C.text },
    slotTime: { fontSize: 12, fontWeight: '600', color: C.text },

    // Expanded vertical list
    list: { marginTop: 20 },
    listRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 10,
      borderRadius: 14,
      gap: 12,
    },
    listRowDivider: { borderTopWidth: 1, borderTopColor: C.separatorOnGray },
    listRowActive: { backgroundColor: C.surfaceGraySecondary },
    listIconBadge: {
      width: 30,
      height: 30,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: C.surfaceGraySecondary,
    },
    listIconBadgeActive: { backgroundColor: `${C.accent}22` },
    listLabel: { flex: 1, minWidth: 0, fontSize: 15, fontWeight: '600', color: C.text },
    listLabelActive: { color: C.accent },
    listTrailing: { alignItems: 'flex-end' },
    listTime: { fontSize: 14, fontWeight: '600', color: C.text },
    listTimeActive: { color: C.accent },
    listCountdown: { fontSize: 12, fontWeight: '600', color: C.accent, marginTop: 2 },
  });

export default function PrayerTimesCard() {
  const C = useTheme();
  const styles = useMemo(() => makeStyles(C), [C]);
  const { t } = useI18n();
  const [expanded, setExpanded] = useState(false);
  const { loading, permissionDenied, locationName, times, nextKey, nextTime, countdownMs, retry } =
    usePrayerTimes();

  const dateLabel = useMemo(
    () => new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    [],
  );

  const prayerLabel = (key) => t(`prayer.${key}`);

  const toggleExpanded = () => {
    hapticLight();
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded((prev) => !prev);
  };

  if (!times && permissionDenied) {
    return (
      <View style={styles.card}>
        <Text style={styles.nextLabel}>{t('prayer.title')}</Text>
        <Text style={styles.statusText}>
          {t('prayer.enableLocationHint')}
        </Text>
        <PillButton
          variant="secondary"
          label={t('prayer.enableLocation')}
          onPress={retry}
          style={{ marginTop: 12, alignSelf: 'flex-start' }}
        />
      </View>
    );
  }

  if (!times && loading) {
    return (
      <View style={styles.card}>
        <ActivityIndicator color={C.accent} />
      </View>
    );
  }

  if (!times) return null;

  const timeForKey = (key) => (key === nextKey ? nextTime : times.timeForPrayer(key));

  return (
    <Pressable style={styles.card} onPress={toggleExpanded}>
      <View style={styles.topRow}>
        <View>
          <Text style={styles.nextLabel}>{t('prayer.nextPrayer')}</Text>
          <View style={styles.nextRow}>
            <Text style={styles.nextName}>{prayerLabel(nextKey)}</Text>
            <Text style={styles.countdown}>{formatCountdown(countdownMs)}</Text>
          </View>
        </View>
        <View style={styles.rightCluster}>
          <View style={styles.metaCol}>
            <View style={styles.metaRow}>
              <Ionicons name="moon" size={14} color={C.gold} />
              <Text style={styles.locationText}>{locationName ?? t('prayer.locating')}</Text>
            </View>
            <Text style={styles.dateText}>{dateLabel}</Text>
          </View>
          <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={18} color={C.textSecondary} />
        </View>
      </View>

      {expanded ? (
        <View style={styles.list}>
          {PRAYER_ORDER.map((key, index) => {
            const active = key === nextKey;
            const prevActive = index > 0 && PRAYER_ORDER[index - 1] === nextKey;
            const showDivider = index > 0 && !active && !prevActive;
            return (
              <View
                key={key}
                style={[styles.listRow, showDivider && styles.listRowDivider, active && styles.listRowActive]}
              >
                <View style={[styles.listIconBadge, active && styles.listIconBadgeActive]}>
                  <Ionicons name={PRAYER_ICONS[key]} size={16} color={active ? C.accent : C.text} />
                </View>
                <Text style={[styles.listLabel, active && styles.listLabelActive]}>{prayerLabel(key)}</Text>
                <View style={styles.listTrailing}>
                  <Text style={[styles.listTime, active && styles.listTimeActive]}>
                    {formatTime(timeForKey(key))}
                  </Text>
                  {active ? <Text style={styles.listCountdown}>{formatCountdown(countdownMs)}</Text> : null}
                </View>
              </View>
            );
          })}
        </View>
      ) : (
        <View style={styles.slotRow}>
          {PRAYER_ORDER.map((key) => {
            const active = key === nextKey;
            return (
              <View key={key} style={[styles.slot, active && styles.slotActive]}>
                <Ionicons name={PRAYER_ICONS[key]} size={18} color={C.text} />
                <Text style={styles.slotLabel}>{prayerLabel(key)}</Text>
                <Text style={styles.slotTime}>{formatTime(timeForKey(key))}</Text>
              </View>
            );
          })}
        </View>
      )}
    </Pressable>
  );
}
