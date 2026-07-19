import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../theme/colors';
import { useI18n } from '../hooks/useI18n';
import { light as hapticLight, success as hapticSuccess } from '../utils/haptics';
import { useQuranPageIndex } from '../hooks/useQuranPageIndex';
import {
  TOTAL_PAGES,
  TOTAL_JUZ,
  DEFAULT_TOTAL_DAYS,
  clamp,
  pagesPerDayFromDays,
  daysFromPagesPerDay,
  todayISO,
  formatFinishDate,
  pagesForJuzRange,
  buildTodayTarget,
  formatTargetRange,
} from '../utils/khatm';
import { loadKhatmPlan, saveKhatmPlan, clearKhatmPlan } from '../utils/khatmStorage';
import PillButton from '../components/PillButton';
import StatCard from '../components/StatCard';
import Stepper from '../components/Stepper';
import { recordActiveToday, incrementKhatmCompletedCount } from '../utils/profileStats';

const HERO_GRADIENT = ['#0D1B2A', '#1A3A2A'];

const makeStyles = (C) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: C.bg },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    scrollContent: { paddingBottom: 140 },

    // ── Setup (State A) ──
    introWrap: { alignItems: 'center', paddingHorizontal: 32, paddingTop: 24, gap: 8 },
    introTitle: { fontSize: 22, fontWeight: '700', color: C.text, marginTop: 8 },
    introSubtitle: { fontSize: 14, color: C.textSecondary, textAlign: 'center', lineHeight: 20 },

    sectionLabel: {
      fontSize: 13,
      fontWeight: '700',
      color: C.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginHorizontal: 20,
      marginTop: 24,
      marginBottom: 8,
    },

    card: {
      marginHorizontal: 16,
      backgroundColor: C.surfaceGray,
      borderRadius: 20,
      overflow: 'hidden',
    },
    cardDivider: { borderTopWidth: 1, borderTopColor: C.separatorOnGray, marginHorizontal: 16 },

    estimateRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    estimateText: { fontSize: 13, color: C.textSecondary, fontWeight: '500' },

    ctaBtn: { marginHorizontal: 16, marginTop: 24 },

    // ── Progress (State B) ──
    heroCard: { marginHorizontal: 20, marginTop: 16, borderRadius: 24, padding: 20, overflow: 'hidden' },
    heroLabel: { fontSize: 13, fontWeight: '700', color: '#D4A017', letterSpacing: 0.5, textTransform: 'uppercase' },
    heroPercent: { fontSize: 40, fontWeight: '700', color: '#FFFFFF', marginTop: 6 },
    progressTrack: {
      height: 6,
      backgroundColor: 'rgba(255,255,255,0.18)',
      borderRadius: 3,
      marginTop: 14,
      overflow: 'hidden',
    },
    progressFill: { height: '100%', backgroundColor: '#D4A017', borderRadius: 3 },
    heroSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 10 },

    goalCard: {
      marginHorizontal: 16,
      marginTop: 16,
      backgroundColor: C.surfaceGray,
      borderRadius: 20,
      padding: 16,
      gap: 4,
    },
    goalLabel: { fontSize: 11, fontWeight: '700', color: C.accent, textTransform: 'uppercase', letterSpacing: 0.5 },
    goalRange: { fontSize: 17, fontWeight: '700', color: C.text, marginTop: 2 },
    goalPages: { fontSize: 13, color: C.textSecondary },

    doneRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
    doneText: { fontSize: 13, color: C.accent, fontWeight: '600' },

    goalActions: { flexDirection: 'row', gap: 10, marginTop: 14 },

    statRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, marginTop: 16 },

    resetLink: { alignSelf: 'center', marginTop: 24, padding: 8 },
    resetLinkText: { fontSize: 13, color: C.textSecondary, fontWeight: '600' },

    // ── Completed ──
    completeWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, gap: 10 },
    completeTitle: { fontSize: 24, fontWeight: '700', color: C.text, marginTop: 8 },
    completeSubtitle: { fontSize: 14, color: C.textSecondary, textAlign: 'center', lineHeight: 20 },
    completeCta: { marginTop: 16, width: '100%' },
  });

export default function DailyKhatmScreen({ navigation }) {
  const C = useTheme();
  const styles = useMemo(() => makeStyles(C), [C]);
  const { t } = useI18n();
  const { index, loading: indexLoading } = useQuranPageIndex();

  const [plan, setPlan] = useState(undefined); // undefined = loading, null = no plan

  const [setupDays, setSetupDays] = useState(DEFAULT_TOTAL_DAYS);
  const [setupPagesPerDay, setSetupPagesPerDay] = useState(pagesPerDayFromDays(TOTAL_PAGES, DEFAULT_TOTAL_DAYS));
  const [setupFromJuz, setSetupFromJuz] = useState(1);
  const [setupToJuz, setSetupToJuz] = useState(TOTAL_JUZ);

  useFocusEffect(
    useCallback(() => {
      loadKhatmPlan().then(setPlan);
    }, []),
  );

  const totalPagesInSetupRange = useMemo(() => {
    if (!index) return TOTAL_PAGES;
    return pagesForJuzRange(index, setupFromJuz, setupToJuz).totalPages;
  }, [index, setupFromJuz, setupToJuz]);

  // Range edits re-anchor on the current "days" value (clamped to what the
  // new range can actually hold at a minimum of 1 page/day).
  useEffect(() => {
    setSetupDays((prevDays) => {
      const clamped = clamp(prevDays, 1, totalPagesInSetupRange);
      setSetupPagesPerDay(pagesPerDayFromDays(totalPagesInSetupRange, clamped));
      return clamped;
    });
  }, [totalPagesInSetupRange]);

  const changeDays = (nextDays) => {
    setSetupDays(nextDays);
    setSetupPagesPerDay(pagesPerDayFromDays(totalPagesInSetupRange, nextDays));
  };

  const changePagesPerDay = (nextPpd) => {
    setSetupPagesPerDay(nextPpd);
    setSetupDays(daysFromPagesPerDay(totalPagesInSetupRange, nextPpd));
  };

  const startPlan = async () => {
    if (!index) return;
    hapticSuccess();
    const { startPage, endPage } = pagesForJuzRange(index, setupFromJuz, setupToJuz);
    const newPlan = {
      totalDays: setupDays,
      pagesPerDay: setupPagesPerDay,
      fromJuz: setupFromJuz,
      toJuz: setupToJuz,
      startPage,
      endPage,
      startDateISO: todayISO(),
      currentPage: startPage,
      lastMarkedDateISO: null,
    };
    await saveKhatmPlan(newPlan);
    setPlan(newPlan);
  };

  const startNewKhatm = async () => {
    hapticLight();
    await clearKhatmPlan();
    setPlan(null);
    setSetupFromJuz(1);
    setSetupToJuz(TOTAL_JUZ);
    changeDays(DEFAULT_TOTAL_DAYS);
  };

  const confirmReset = () => {
    Alert.alert(
      t('khatm.resetTitle'),
      t('khatm.resetMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('common.reset'), style: 'destructive', onPress: startNewKhatm },
      ],
    );
  };

  const todayTarget = useMemo(() => buildTodayTarget(index, plan), [index, plan]);
  const isCompleted = !!plan && !!index && plan.currentPage > plan.endPage;
  const isDoneToday = !!plan && plan.lastMarkedDateISO === todayISO();

  const pagesTotal = plan ? plan.endPage - plan.startPage + 1 : 0;
  const pagesRead = plan ? clamp(plan.currentPage - plan.startPage, 0, pagesTotal) : 0;
  const pagesLeft = plan ? clamp(plan.endPage - plan.currentPage + 1, 0, pagesTotal) : 0;
  const pctComplete = pagesTotal > 0 ? Math.min(100, Math.round((pagesRead / pagesTotal) * 100)) : 0;

  const markAsRead = async () => {
    if (!plan || isDoneToday || isCompleted) return;
    hapticSuccess();
    const nextCurrentPage = Math.min(plan.currentPage + plan.pagesPerDay, plan.endPage + 1);
    const updated = { ...plan, currentPage: nextCurrentPage, lastMarkedDateISO: todayISO() };
    await saveKhatmPlan(updated);
    setPlan(updated);
    recordActiveToday().catch(() => {});
  };

  // Fires once per completed plan — guarded by a flag persisted on the plan
  // itself, so revisiting this screen after completion doesn't double-count.
  useEffect(() => {
    if (!isCompleted || !plan || plan.completionRecorded) return;
    incrementKhatmCompletedCount().catch(() => {});
    const updated = { ...plan, completionRecorded: true };
    saveKhatmPlan(updated).catch(() => {});
    setPlan(updated);
  }, [isCompleted, plan]);

  const startReading = () => {
    if (!todayTarget?.start) return;
    hapticLight();
    navigation.navigate('Quran', {
      screen: 'SurahReader',
      params: {
        surahNumber: todayTarget.start.surahNumber,
        surahName: todayTarget.start.surahName,
        surahNameEn: todayTarget.start.surahNameEn,
        initialVerseIndex: todayTarget.start.ayah - 1,
      },
    });
  };

  if (plan === undefined || indexLoading || !index) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={C.accent} />
        </View>
      </SafeAreaView>
    );
  }

  if (isCompleted) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.completeWrap}>
          <Ionicons name="sparkles-outline" size={48} color={C.gold} />
          <Text style={styles.completeTitle}>{t('khatm.completeTitle')}</Text>
          <Text style={styles.completeSubtitle}>{t('khatm.completeSubtitle')}</Text>
          <PillButton
            variant="primary"
            label={t('khatm.startNewKhatm')}
            icon="refresh"
            onPress={startNewKhatm}
            style={styles.completeCta}
          />
        </View>
      </SafeAreaView>
    );
  }

  if (!plan) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.introWrap}>
            <Ionicons name="checkmark-done-circle-outline" size={40} color={C.accent} />
            <Text style={styles.introTitle}>{t('khatm.setYourPace')}</Text>
            <Text style={styles.introSubtitle}>
              {t('khatm.introSubtitle', { pages: TOTAL_PAGES })}
            </Text>
          </View>

          <View style={[styles.card, { marginTop: 24 }]}>
            <Stepper
              label={t('khatm.daysToFinish')}
              value={setupDays}
              min={1}
              max={totalPagesInSetupRange}
              onChange={changeDays}
            />
            <View style={styles.cardDivider} />
            <Stepper
              label={t('khatm.pagesPerDay')}
              value={setupPagesPerDay}
              min={1}
              max={totalPagesInSetupRange}
              onChange={changePagesPerDay}
            />
            <View style={styles.cardDivider} />
            <View style={styles.estimateRow}>
              <Ionicons name="flag-outline" size={14} color={C.textSecondary} />
              <Text style={styles.estimateText}>{t('khatm.finishAround', { date: formatFinishDate(setupDays) })}</Text>
            </View>
          </View>

          <Text style={styles.sectionLabel}>{t('khatm.readingRange')}</Text>
          <View style={styles.card}>
            <Stepper
              label={t('khatm.fromJuz')}
              value={setupFromJuz}
              min={1}
              max={setupToJuz}
              onChange={setSetupFromJuz}
            />
            <View style={styles.cardDivider} />
            <Stepper
              label={t('khatm.toJuz')}
              value={setupToJuz}
              min={setupFromJuz}
              max={TOTAL_JUZ}
              onChange={setSetupToJuz}
            />
            <View style={styles.cardDivider} />
            <View style={styles.estimateRow}>
              <Ionicons name="book-outline" size={14} color={C.textSecondary} />
              <Text style={styles.estimateText}>{t('khatm.pagesInRange', { count: totalPagesInSetupRange })}</Text>
            </View>
          </View>

          <PillButton variant="primary" label={t('khatm.startMyKhatm')} icon="checkmark-done" onPress={startPlan} style={styles.ctaBtn} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <LinearGradient colors={HERO_GRADIENT} style={styles.heroCard}>
          <Text style={styles.heroLabel}>{t('khatm.heroLabel')}</Text>
          <Text style={styles.heroPercent}>{pctComplete}%</Text>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${pctComplete}%` }]} />
          </View>
          <Text style={styles.heroSubtitle}>
            {t('khatm.pagesPace', { read: pagesRead, total: pagesTotal, perDay: plan.pagesPerDay })}
          </Text>
        </LinearGradient>

        <View style={styles.goalCard}>
          <Text style={styles.goalLabel}>{t('khatm.todaysGoal')}</Text>
          {todayTarget ? (
            <>
              <Text style={styles.goalRange}>{formatTargetRange(todayTarget)}</Text>
              <Text style={styles.goalPages}>
                {todayTarget.startPage === todayTarget.endPage
                  ? t('common.pageN', { n: todayTarget.startPage })
                  : t('common.pagesRange', { start: todayTarget.startPage, end: todayTarget.endPage })}
              </Text>
            </>
          ) : null}

          {isDoneToday && (
            <View style={styles.doneRow}>
              <Ionicons name="checkmark-circle" size={16} color={C.accent} />
              <Text style={styles.doneText}>{t('khatm.doneForToday')}</Text>
            </View>
          )}

          <View style={styles.goalActions}>
            <PillButton variant="primary" label={t('khatm.startReading')} icon="play" onPress={startReading} style={{ flex: 1 }} />
            <PillButton
              variant="secondary"
              label={isDoneToday ? t('khatm.marked') : t('khatm.markAsRead')}
              icon={isDoneToday ? 'checkmark-circle' : 'checkmark-circle-outline'}
              onPress={markAsRead}
              disabled={isDoneToday}
              style={{ flex: 1 }}
            />
          </View>
        </View>

        <View style={styles.statRow}>
          <StatCard value={pagesRead} label={t('khatm.pagesRead')} icon="book-outline" />
          <StatCard value={pagesLeft} label={t('khatm.pagesLeft')} icon="hourglass-outline" />
        </View>

        <TouchableOpacity style={styles.resetLink} onPress={confirmReset}>
          <Text style={styles.resetLinkText}>{t('khatm.resetPlan')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
