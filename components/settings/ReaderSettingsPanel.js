import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../../theme/colors';
import { light as hapticLight } from '../../utils/haptics';
import SettingsRow from '../SettingsRow';
import SectionLabel from './SectionLabel';

const READING_MODES = [
  { value: 'surah', label: 'Surah' },
  { value: 'page', label: 'Page' },
  { value: 'mushaf', label: 'Mushaf' },
];

const makeStyles = (C) =>
  StyleSheet.create({
    track: {
      flexDirection: 'row',
      marginHorizontal: 16,
      backgroundColor: C.surfaceGray,
      borderRadius: 12,
      padding: 4,
      gap: 4,
    },
    segment: { flex: 1, paddingVertical: 8, borderRadius: 9, alignItems: 'center' },
    segmentActive: { backgroundColor: C.bg },
    segmentText: { fontSize: 14, fontWeight: '600', color: C.textSecondary },
    segmentTextActive: { color: C.text },
    card: {
      marginHorizontal: 16,
      marginTop: 8,
      backgroundColor: C.surfaceGray,
      borderRadius: 20,
      overflow: 'hidden',
    },
  });

export default function ReaderSettingsPanel({
  readingMode,
  onSelectReadingMode,
  onNavigate,
  rowSubtitles,
  toggles,
  onToggleChange,
}) {
  const C = useTheme();
  const styles = useMemo(() => makeStyles(C), [C]);

  const selectReadingMode = (value) => {
    hapticLight();
    onSelectReadingMode(value);
  };

  return (
    <View>
      <SectionLabel>Reading mode</SectionLabel>
      <View style={styles.track}>
        {READING_MODES.map((m) => (
          <TouchableOpacity
            key={m.value}
            style={[styles.segment, readingMode === m.value && styles.segmentActive]}
            onPress={() => selectReadingMode(m.value)}
          >
            <Text style={[styles.segmentText, readingMode === m.value && styles.segmentTextActive]}>
              {m.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <SectionLabel>Customize</SectionLabel>
      <View style={styles.card}>
        <SettingsRow
          icon="text-outline"
          label="Arabic font"
          subtitle={rowSubtitles.arabicFont}
          chevron
          isFirst
          onPress={() => onNavigate('arabicFont')}
        />
        <SettingsRow
          icon="reader-outline"
          label="Transcription"
          subtitle={rowSubtitles.transcription}
          chevron
          onPress={() => onNavigate('transcription')}
        />
        <SettingsRow
          icon="language-outline"
          label="Translation"
          subtitle={rowSubtitles.translation}
          chevron
          onPress={() => onNavigate('translation')}
        />
        <SettingsRow
          icon="mic-outline"
          label="Reciter / Voice"
          subtitle={rowSubtitles.reciter}
          chevron
          onPress={() => onNavigate('reciter')}
        />
        <SettingsRow
          icon="color-palette-outline"
          label="Color theme"
          subtitle={rowSubtitles.colorTheme}
          chevron
          onPress={() => onNavigate('colorTheme')}
        />
      </View>

      <SectionLabel>Display</SectionLabel>
      <View style={styles.card}>
        <SettingsRow
          label="Arabic"
          switchValue={toggles.showArabic}
          onSwitchChange={(v) => onToggleChange('showArabic', v)}
          isFirst
        />
        <SettingsRow
          label="Translation"
          switchValue={toggles.showTranslation}
          onSwitchChange={(v) => onToggleChange('showTranslation', v)}
        />
        <SettingsRow
          label="Transcription"
          switchValue={toggles.showTranscription}
          onSwitchChange={(v) => onToggleChange('showTranscription', v)}
        />
        <SettingsRow
          label="Tajweed rules"
          subtitle="Color-coded recitation rules — coming soon"
          switchValue={toggles.showTajweed}
          onSwitchChange={(v) => onToggleChange('showTajweed', v)}
        />
      </View>
    </View>
  );
}
