import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import { light as hapticLight } from '../utils/haptics';
import { loadPlans, summarizeToday, pluralAyah } from '../utils/hifz';

const GRADIENT = ['#0D1B2A', '#1A3A2A'];

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 4,
    borderRadius: 20,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
  },
  textWrap: { flex: 1, marginRight: 12 },
  label: { fontSize: 11, fontWeight: '700', color: '#D4A017', letterSpacing: 0.5, textTransform: 'uppercase' },
  subtitle: { fontSize: 13, color: 'rgba(255,255,255,0.85)', marginTop: 4, lineHeight: 18 },
});

export default function GoalProgressCard({ onPress }) {
  const [summary, setSummary] = useState(null);

  useFocusEffect(
    useCallback(() => {
      loadPlans().then((plans) => setSummary(summarizeToday(plans)));
    }, []),
  );

  const subtitle = useMemo(() => {
    if (!summary) return ' ';
    if (!summary.hasAnyPlan) return 'Start with your first surah';
    if (!summary.hasOpenTarget) return 'Done for today — great work';
    const extra = summary.moreCount > 0 ? ` · +${summary.moreCount} more` : '';
    return `${summary.ayahsToday} ${pluralAyah(summary.ayahsToday)} left · ${summary.surahNameEn}${extra}`;
  }, [summary]);

  const handlePress = () => {
    hapticLight();
    onPress?.();
  };

  return (
    <TouchableOpacity activeOpacity={0.85} onPress={handlePress}>
      <LinearGradient colors={GRADIENT} style={styles.card}>
        <View style={styles.textWrap}>
          <Text style={styles.label}>Quran Memorization</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.6)" />
      </LinearGradient>
    </TouchableOpacity>
  );
}
