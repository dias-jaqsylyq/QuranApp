import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../theme/colors';
import { toArabicDigits } from '../utils/arabicNumerals';
import SurahDivider from './SurahDivider';
import BismillahBanner from './BismillahBanner';

const makeStyles = (C, scale) =>
  StyleSheet.create({
    wrap: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 8 },
    block: {
      fontSize: Math.round(24 * scale),
      lineHeight: Math.round(48 * scale),
      textAlign: 'justify',
      writingDirection: 'rtl',
      color: C.arabicText,
      fontFamily: 'Amiri_400Regular',
    },
    ayah: { color: C.arabicText },
    ayahActive: { color: C.accent },
    marker: {
      fontSize: Math.round(16 * scale),
      color: C.gold,
      fontFamily: 'Amiri_400Regular',
    },
    markerFlash: { color: C.accent, fontWeight: '700' },
  });

// A page rendered as a continuous justified block per surah-segment, the way
// a print mushaf reads — no per-ayah paragraph breaks, just an ornate inline
// number where each ayah ends. Runs (segments of consecutive ayahs from the
// same surah) mirror the same page-crossing boundaries the reflow "Page"
// mode already draws dividers at.
export default function MushafPage({ verses, activeVerseId, flashedVerseId, scale = 1, onVersePress, onVerseLongPress }) {
  const C = useTheme();
  const styles = useMemo(() => makeStyles(C, scale), [C, scale]);

  const runs = useMemo(() => {
    const out = [];
    for (const v of verses) {
      const last = out[out.length - 1];
      if (last && last.surahNumber === v.surahNumber) {
        last.items.push(v);
      } else {
        out.push({ surahNumber: v.surahNumber, surahName: v.surahName, surahNameEn: v.surahNameEn, items: [v] });
      }
    }
    return out;
  }, [verses]);

  return (
    <View style={styles.wrap}>
      {runs.map((run, runIndex) => {
        const isNewSurah = run.items[0]?.number === 1;
        const needsBismillah = isNewSurah && run.surahNumber !== 1 && run.surahNumber !== 9;
        return (
          <View key={`${run.surahNumber}-${runIndex}`}>
            {runIndex > 0 && isNewSurah && (
              <SurahDivider surahNumber={run.surahNumber} surahName={run.surahName} surahNameEn={run.surahNameEn} />
            )}
            {runIndex > 0 && needsBismillah && <BismillahBanner />}
            <Text style={styles.block}>
              {run.items.map((item) => {
                const id = `${item.surahNumber}:${item.number}`;
                const active = id === activeVerseId;
                const justFlashed = id === flashedVerseId;
                return (
                  <Text
                    key={id}
                    onPress={() => onVersePress(item)}
                    onLongPress={() => onVerseLongPress(item)}
                    style={[styles.ayah, active && styles.ayahActive]}
                  >
                    {item.arabicText}
                    <Text style={[styles.marker, justFlashed && styles.markerFlash]}>
                      {` ﴿${toArabicDigits(item.number)}﴾ `}
                    </Text>
                  </Text>
                );
              })}
            </Text>
          </View>
        );
      })}
    </View>
  );
}
