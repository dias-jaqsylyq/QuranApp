import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../theme/colors';
import { light as hapticLight, success as hapticSuccess } from '../utils/haptics';
import { useI18n } from '../hooks/useI18n';
import {
  loadPlansWithReviews,
  savePlans,
  summarizeToday,
  markMemorizedToday,
  nextDueReview,
  reviewRemembered,
  reviewForgot,
} from '../utils/hifz';
import PillButton from './PillButton';

const makeStyles = (C) =>
  StyleSheet.create({
    card: {
      marginHorizontal: 20,
      marginTop: 20,
      backgroundColor: C.surfaceGray,
      borderRadius: 20,
      padding: 16,
      gap: 10,
    },
    label: { fontSize: 11, fontWeight: '700', color: C.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 },
    row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    text: { flex: 1, fontSize: 15, fontWeight: '600', color: C.text },
    bottomRow: { flexDirection: 'row', justifyContent: 'flex-end' },
    bottomRowSplit: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8 },
    divider: { height: 1, backgroundColor: C.separatorOnGray },
  });

export default function TodayHifzCard({ navigation }) {
  const C = useTheme();
  const styles = useMemo(() => makeStyles(C), [C]);
  const { t } = useI18n();
  const [summary, setSummary] = useState(null);
  const [review, setReview] = useState(null);
  const [busy, setBusy] = useState(false);
  const [reviewBusy, setReviewBusy] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadPlansWithReviews().then((plans) => {
        setSummary(summarizeToday(plans));
        setReview(nextDueReview(plans));
      });
    }, []),
  );

  const markDone = async () => {
    if (!summary?.planId || busy) return;
    setBusy(true);
    hapticSuccess();
    const plans = await loadPlansWithReviews();
    const updated = plans.map((p) => (p.id === summary.planId ? markMemorizedToday(p) : p));
    await savePlans(updated);
    setSummary(summarizeToday(updated));
    setReview(nextDueReview(updated));
    setBusy(false);
  };

  const respondReview = async (apply) => {
    if (!review?.planId || reviewBusy) return;
    setReviewBusy(true);
    hapticSuccess();
    const plans = await loadPlansWithReviews();
    const updated = plans.map((p) => (p.id === review.planId ? apply(p) : p));
    await savePlans(updated);
    setReview(nextDueReview(updated));
    setReviewBusy(false);
  };

  const openHifz = () => {
    hapticLight();
    navigation.navigate('Memorize');
  };

  if (!summary?.hasOpenTarget && !review) return null;

  const extra = summary?.moreCount > 0 ? `  +${summary.moreCount} more` : '';
  const reviewExtra = review?.moreCount > 0 ? `  +${review.moreCount} more` : '';

  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.9} onPress={openHifz}>
      <Text style={styles.label}>{t('home.segmentToday')}</Text>

      {summary?.hasOpenTarget ? (
        <>
          <View style={styles.row}>
            <Ionicons name="book-outline" size={18} color={C.accent} />
            <Text style={styles.text} numberOfLines={1}>
              {t('hifz.currentlyMemorizing')}: {summary.surahNameEn} {summary.targetStart}–{summary.targetEnd}{extra}
            </Text>
          </View>
          <View style={styles.bottomRow}>
            <PillButton
              variant="secondary"
              label={busy ? `${t('common.done')}…` : t('common.done')}
              icon="checkmark"
              onPress={markDone}
              disabled={busy}
            />
          </View>
        </>
      ) : null}

      {summary?.hasOpenTarget && review ? <View style={styles.divider} /> : null}

      {review ? (
        <>
          <View style={styles.row}>
            <Ionicons name="repeat-outline" size={18} color={C.accent} />
            <Text style={styles.text} numberOfLines={1}>
              {t('hifz.reviewBadge')}: {review.surahNameEn}{reviewExtra}
            </Text>
          </View>
          <View style={styles.bottomRowSplit}>
            <PillButton
              variant="secondary"
              label={t('hifz.forgot')}
              onPress={() => respondReview(reviewForgot)}
              disabled={reviewBusy}
            />
            <PillButton
              variant="secondary"
              label={t('hifz.remembered')}
              icon="checkmark"
              onPress={() => respondReview(reviewRemembered)}
              disabled={reviewBusy}
            />
          </View>
        </>
      ) : null}
    </TouchableOpacity>
  );
}
