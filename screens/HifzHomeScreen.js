import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, Modal, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../theme/colors';
import { light as hapticLight, success as hapticSuccess } from '../utils/haptics';
import {
  loadPlansWithReviews,
  savePlans,
  todayTarget,
  isDoneToday,
  pctComplete,
  markMemorizedToday,
  isReviewDueToday,
  daysUntilReview,
  reviewRemembered,
  reviewForgot,
} from '../utils/hifz';
import PillButton from '../components/PillButton';
import SectionHeader from '../components/SectionHeader';
import Sheet, { CLOSE_DURATION } from '../components/settings/Sheet';
import MarkMemorizedSheet from '../components/MarkMemorizedSheet';

const makeStyles = (C) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: C.bg },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    scrollContent: { paddingBottom: 140 },

    header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
    headerTitle: { fontSize: 34, fontWeight: '700', color: C.text },

    card: { marginHorizontal: 16, marginBottom: 12, backgroundColor: C.surfaceGray, borderRadius: 20, padding: 16, gap: 8 },
    cardTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    cardTitle: { fontSize: 17, fontWeight: '700', color: C.text },
    cardMeta: { fontSize: 13, color: C.textSecondary },
    progressTrack: { height: 6, backgroundColor: C.surfaceGraySecondary, borderRadius: 3, overflow: 'hidden' },
    progressFill: { height: '100%', backgroundColor: C.accent, borderRadius: 3 },
    cardBottomRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
    targetText: { fontSize: 14, color: C.text, fontWeight: '500' },
    doneText: { fontSize: 13, color: C.accent, fontWeight: '600' },

    memorizedList: { marginHorizontal: 16, marginBottom: 12, backgroundColor: C.surfaceGray, borderRadius: 20, paddingVertical: 4 },
    memorizedRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
    memorizedRowDue: { flexDirection: 'column', alignItems: 'stretch', gap: 10 },
    memorizedRowDivider: { borderTopWidth: 1, borderTopColor: C.separatorOnGray },
    memorizedTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    memorizedName: { fontSize: 15, fontWeight: '600', color: C.text },
    memorizedMeta: { fontSize: 13, color: C.textSecondary },
    dueBadge: { fontSize: 13, color: C.accent, fontWeight: '600' },
    memorizedButtonsRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8 },

    emptyState: { alignItems: 'center', paddingVertical: 48, gap: 8, paddingHorizontal: 32 },
    emptyTitle: { fontSize: 17, fontWeight: '700', color: C.text, marginTop: 8, textAlign: 'center' },
    emptyText: { fontSize: 14, color: C.textSecondary, textAlign: 'center', lineHeight: 20 },

    addBtn: { marginHorizontal: 16, marginTop: 8 },
    markLink: { alignSelf: 'center', marginTop: 20, padding: 8 },
    markLinkText: { fontSize: 13, color: C.textSecondary, fontWeight: '600' },
  });

export default function HifzHomeScreen({ navigation }) {
  const C = useTheme();
  const styles = useMemo(() => makeStyles(C), [C]);
  const [plans, setPlans] = useState(null); // null = loading
  const [markOpen, setMarkOpen] = useState(false);
  const [markMounted, setMarkMounted] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadPlansWithReviews().then(setPlans);
    }, []),
  );

  useEffect(() => {
    if (markOpen) {
      setMarkMounted(true);
    } else if (markMounted) {
      const t = setTimeout(() => setMarkMounted(false), CLOSE_DURATION);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [markOpen, markMounted]);

  const markDone = async (planId) => {
    hapticSuccess();
    const all = await loadPlansWithReviews();
    const updated = all.map((p) => (p.id === planId ? markMemorizedToday(p) : p));
    await savePlans(updated);
    setPlans(updated);
  };

  const respondReview = async (planId, apply) => {
    hapticSuccess();
    const all = await loadPlansWithReviews();
    const updated = all.map((p) => (p.id === planId ? apply(p) : p));
    await savePlans(updated);
    setPlans(updated);
  };

  const removePlan = (planId) => {
    Alert.alert('Delete plan?', 'Progress on this surah will be lost.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          hapticLight();
          const all = await loadPlansWithReviews();
          const updated = all.filter((p) => p.id !== planId);
          await savePlans(updated);
          setPlans(updated);
        },
      },
    ]);
  };

  const openAdd = () => {
    hapticLight();
    navigation.navigate('AddHifzPlan');
  };

  const openMark = () => {
    hapticLight();
    setMarkOpen(true);
  };

  const onMarkSaved = async (newPlans) => {
    const all = await loadPlansWithReviews();
    const updated = [...all, ...newPlans];
    await savePlans(updated);
    setPlans(await loadPlansWithReviews());
    setMarkOpen(false);
  };

  if (plans === null) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Memorization</Text>
        </View>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={C.accent} />
        </View>
      </SafeAreaView>
    );
  }

  const memorizing = plans.filter((p) => p.status === 'memorizing');
  const memorized = plans.filter((p) => p.status === 'memorized');

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Memorization</Text>
      </View>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {plans.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="book-outline" size={40} color={C.border} />
            <Text style={styles.emptyTitle}>Start memorizing your first surah</Text>
            <Text style={styles.emptyText}>Pick a surah and a pace — the app will work out the rest.</Text>
          </View>
        ) : null}

        {memorizing.length > 0 ? (
          <>
            <SectionHeader title="Currently Memorizing" />
            {memorizing.map((plan) => {
              const target = todayTarget(plan);
              const done = isDoneToday(plan);
              const pct = pctComplete(plan);
              return (
                <TouchableOpacity
                  key={plan.id}
                  style={styles.card}
                  activeOpacity={0.85}
                  onLongPress={() => removePlan(plan.id)}
                >
                  <View style={styles.cardTopRow}>
                    <Text style={styles.cardTitle}>{plan.surahNameEn}</Text>
                    <Text style={styles.cardMeta}>{pct}%</Text>
                  </View>
                  <View style={styles.progressTrack}>
                    <View style={[styles.progressFill, { width: `${pct}%` }]} />
                  </View>
                  <View style={styles.cardBottomRow}>
                    {target ? (
                      <Text style={styles.targetText}>
                        Today: ayahs {target.startAyah}–{target.endAyah}
                      </Text>
                    ) : null}
                    {done ? (
                      <Text style={styles.doneText}>Done ✓</Text>
                    ) : (
                      <PillButton variant="secondary" label="Done" icon="checkmark" onPress={() => markDone(plan.id)} />
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </>
        ) : null}

        {memorized.length > 0 ? (
          <>
            <SectionHeader title="Reviews" />
            <View style={styles.memorizedList}>
              {memorized.map((plan, i) => {
                const due = isReviewDueToday(plan);
                const eta = daysUntilReview(plan);
                return (
                  <View
                    key={plan.id}
                    style={[styles.memorizedRow, i > 0 && styles.memorizedRowDivider, due && styles.memorizedRowDue]}
                  >
                    <View style={styles.memorizedTopRow}>
                      <Text style={styles.memorizedName}>{plan.surahNameEn}</Text>
                      {due ? (
                        <Text style={styles.dueBadge}>Review</Text>
                      ) : (
                        <Text style={styles.memorizedMeta}>{eta <= 0 ? 'today' : `in ${eta} day${eta === 1 ? '' : 's'}`}</Text>
                      )}
                    </View>
                    {due ? (
                      <View style={styles.memorizedButtonsRow}>
                        <PillButton variant="secondary" label="Forgot" onPress={() => respondReview(plan.id, reviewForgot)} />
                        <PillButton
                          variant="secondary"
                          label="Remembered"
                          icon="checkmark"
                          onPress={() => respondReview(plan.id, reviewRemembered)}
                        />
                      </View>
                    ) : null}
                  </View>
                );
              })}
            </View>
          </>
        ) : null}

        <PillButton variant="primary" label="+ Add Surah" onPress={openAdd} style={styles.addBtn} />

        <TouchableOpacity style={styles.markLink} onPress={openMark}>
          <Text style={styles.markLinkText}>Mark surahs already memorized</Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal
        transparent
        visible={markMounted}
        animationType="none"
        statusBarTranslucent
        onRequestClose={() => setMarkOpen(false)}
      >
        <Sheet visible={markOpen} onClose={() => setMarkOpen(false)} title="Already Memorized">
          <MarkMemorizedSheet existingPlans={plans} onSave={onMarkSaved} />
        </Sheet>
      </Modal>
    </SafeAreaView>
  );
}
