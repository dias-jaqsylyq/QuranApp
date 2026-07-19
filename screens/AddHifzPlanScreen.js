import React, { useMemo, useState } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../theme/colors';
import { useI18n } from '../hooks/useI18n';
import { useSurahList } from '../hooks/useQuranData';
import { light as hapticLight, success as hapticSuccess } from '../utils/haptics';
import {
  ayahsPerDayFromDays,
  daysFromAyahsPerDay,
  formatFinishDate,
  buildPlan,
  loadPlans,
  savePlans,
} from '../utils/hifz';
import Stepper from '../components/Stepper';
import PillButton from '../components/PillButton';

const makeStyles = (C) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: C.bg },

    searchBar: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: C.surfaceGray,
      borderRadius: 14,
      marginHorizontal: 16,
      marginTop: 12,
      marginBottom: 8,
      paddingHorizontal: 12,
      gap: 8,
    },
    input: { flex: 1, height: 44, fontSize: 16, color: C.text },

    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: C.border,
    },
    rowName: { fontSize: 16, fontWeight: '600', color: C.text },
    rowMeta: { fontSize: 13, color: C.textSecondary, marginTop: 2 },
    rowArabic: { fontSize: 18, color: C.arabicText, fontFamily: 'Amiri_400Regular' },

    center: { alignItems: 'center', justifyContent: 'center', paddingTop: 60, gap: 8 },
    emptyText: { fontSize: 14, color: C.textSecondary },

    selectedWrap: { paddingTop: 16 },
    changeLink: { alignSelf: 'flex-start', marginBottom: 12, marginHorizontal: 20 },
    changeLinkText: { fontSize: 13, color: C.accent, fontWeight: '600' },
    selectedTitle: { fontSize: 22, fontWeight: '700', color: C.text, marginHorizontal: 20 },
    selectedSubtitle: { fontSize: 14, color: C.textSecondary, marginTop: 4, marginHorizontal: 20 },

    card: { marginHorizontal: 16, marginTop: 20, backgroundColor: C.surfaceGray, borderRadius: 20, overflow: 'hidden' },
    cardDivider: { borderTopWidth: 1, borderTopColor: C.separatorOnGray, marginHorizontal: 16 },
    estimateRow: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 12 },
    estimateText: { fontSize: 13, color: C.textSecondary, fontWeight: '500' },

    ctaBtn: { marginHorizontal: 16, marginTop: 24 },
  });

export default function AddHifzPlanScreen({ navigation }) {
  const C = useTheme();
  const styles = useMemo(() => makeStyles(C), [C]);
  const { t } = useI18n();
  const { surahs, loading } = useSurahList();
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(null);
  const [days, setDays] = useState(7);
  const [ayahsPerDay, setAyahsPerDay] = useState(1);

  const filtered = useMemo(() => {
    if (!query.trim()) return surahs;
    const q = query.toLowerCase();
    return surahs.filter(
      (s) =>
        s.englishName.toLowerCase().includes(q) ||
        s.englishNameTranslation.toLowerCase().includes(q) ||
        s.name.includes(query),
    );
  }, [surahs, query]);

  const selectSurah = (item) => {
    hapticLight();
    const initialDays = Math.min(item.numberOfAyahs, 7);
    setSelected(item);
    setDays(initialDays);
    setAyahsPerDay(ayahsPerDayFromDays(item.numberOfAyahs, initialDays));
  };

  const changeDays = (nextDays) => {
    setDays(nextDays);
    setAyahsPerDay(ayahsPerDayFromDays(selected.numberOfAyahs, nextDays));
  };

  const changeAyahsPerDay = (next) => {
    setAyahsPerDay(next);
    setDays(daysFromAyahsPerDay(selected.numberOfAyahs, next));
  };

  const startPlan = async () => {
    if (!selected) return;
    hapticSuccess();
    const plan = buildPlan({
      surahNumber: selected.number,
      surahNameEn: selected.englishName,
      totalAyahs: selected.numberOfAyahs,
      ayahsPerDay,
    });
    const plans = await loadPlans();
    await savePlans([...plans, plan]);
    navigation.goBack();
  };

  if (!selected) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color={C.textSecondary} />
          <TextInput
            style={styles.input}
            placeholder={t('hifz.searchPlaceholder')}
            placeholderTextColor={C.textSecondary}
            value={query}
            onChangeText={setQuery}
            autoCorrect={false}
            returnKeyType="search"
          />
        </View>
        <FlatList
          data={filtered}
          keyExtractor={(item) => String(item.number)}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.row} activeOpacity={0.7} onPress={() => selectSurah(item)}>
              <View>
                <Text style={styles.rowName}>{item.englishName}</Text>
                <Text style={styles.rowMeta}>{item.numberOfAyahs} {t('common.verses')}</Text>
              </View>
              <Text style={styles.rowArabic}>{item.name}</Text>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            loading ? (
              <View style={styles.center}>
                <ActivityIndicator size="large" color={C.accent} />
              </View>
            ) : (
              <View style={styles.center}>
                <Text style={styles.emptyText}>{t('hifz.noSurahsFound')}</Text>
              </View>
            )
          }
          contentContainerStyle={{ paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.selectedWrap}>
        <TouchableOpacity style={styles.changeLink} onPress={() => setSelected(null)}>
          <Text style={styles.changeLinkText}>{t('hifz.changeSurah')}</Text>
        </TouchableOpacity>
        <Text style={styles.selectedTitle}>{selected.englishName}</Text>
        <Text style={styles.selectedSubtitle}>{selected.numberOfAyahs} {t('common.verses')}</Text>

        <View style={styles.card}>
          <Stepper label={t('hifz.daysForSurah')} value={days} min={1} max={selected.numberOfAyahs} onChange={changeDays} />
          <View style={styles.cardDivider} />
          <Stepper
            label={t('hifz.ayahsPerDay')}
            value={ayahsPerDay}
            min={1}
            max={selected.numberOfAyahs}
            onChange={changeAyahsPerDay}
          />
          <View style={styles.cardDivider} />
          <View style={styles.estimateRow}>
            <Ionicons name="flag-outline" size={14} color={C.textSecondary} />
            <Text style={styles.estimateText}>{t('hifz.estimatedFinish', { date: formatFinishDate(days) })}</Text>
          </View>
        </View>

        <PillButton variant="primary" label={t('hifz.startMemorizing')} icon="bookmark" onPress={startPlan} style={styles.ctaBtn} />
      </View>
    </SafeAreaView>
  );
}
