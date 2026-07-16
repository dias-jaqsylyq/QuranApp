import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../theme/colors';

const makeStyles = (C) =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingHorizontal: 20,
      paddingVertical: 18,
    },
    line: { flex: 1, height: 1, backgroundColor: C.border },
    label: { alignItems: 'center', gap: 2 },
    en: {
      fontSize: 12,
      fontWeight: '700',
      color: C.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    ar: {
      fontSize: 16,
      color: C.arabicText,
      fontFamily: 'Amiri_400Regular',
    },
  });

// Marks a surah boundary inside a page's continuous ayah stream — a plain
// hairline + label, not a card, so the content doesn't visually "break".
export default function SurahDivider({ surahNumber, surahName, surahNameEn }) {
  const C = useTheme();
  const styles = useMemo(() => makeStyles(C), [C]);
  return (
    <View style={styles.row}>
      <View style={styles.line} />
      <View style={styles.label}>
        <Text style={styles.en}>{`${surahNumber}. ${surahNameEn}`}</Text>
        <Text style={styles.ar}>{surahName}</Text>
      </View>
      <View style={styles.line} />
    </View>
  );
}
