import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../../theme/colors';
import { light as hapticLight } from '../../utils/haptics';
import { useI18n } from '../../hooks/useI18n';
import SettingsRow from '../SettingsRow';
import SectionLabel from './SectionLabel';

const READING_MODES = [
  { value: 'surah', labelKey: 'reader.modeSurah' },
  { value: 'page', labelKey: 'reader.modePage' },
  { value: 'mushaf', labelKey: 'reader.modeMushaf' },
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
  const { t } = useI18n();

  const selectReadingMode = (value) => {
    hapticLight();
    onSelectReadingMode(value);
  };

  return (
    <View>
      <SectionLabel>{t('reader.readingMode')}</SectionLabel>
      <View style={styles.track}>
        {READING_MODES.map((m) => (
          <TouchableOpacity
            key={m.value}
            style={[styles.segment, readingMode === m.value && styles.segmentActive]}
            onPress={() => selectReadingMode(m.value)}
          >
            <Text style={[styles.segmentText, readingMode === m.value && styles.segmentTextActive]}>
              {t(m.labelKey)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <SectionLabel>{t('reader.customize')}</SectionLabel>
      <View style={styles.card}>
        <SettingsRow
          icon="text-outline"
          label={t('reader.arabicFontRow')}
          subtitle={rowSubtitles.arabicFont}
          chevron
          isFirst
          onPress={() => onNavigate('arabicFont')}
        />
        <SettingsRow
          icon="reader-outline"
          label={t('reader.transcription')}
          subtitle={rowSubtitles.transcription}
          chevron
          onPress={() => onNavigate('transcription')}
        />
        <SettingsRow
          icon="language-outline"
          label={t('reader.translation')}
          subtitle={rowSubtitles.translation}
          chevron
          onPress={() => onNavigate('translation')}
        />
        <SettingsRow
          icon="book-outline"
          label={t('reader.tafsir')}
          subtitle={rowSubtitles.tafsir}
          chevron
          onPress={() => onNavigate('tafsir')}
        />
        <SettingsRow
          icon="mic-outline"
          label={t('reader.reciterVoice')}
          subtitle={rowSubtitles.reciter}
          chevron
          onPress={() => onNavigate('reciter')}
        />
        <SettingsRow
          icon="color-palette-outline"
          label={t('reader.colorThemeRow')}
          subtitle={rowSubtitles.colorTheme}
          chevron
          onPress={() => onNavigate('colorTheme')}
        />
      </View>

      {readingMode !== 'mushaf' && (
        <>
          <SectionLabel>{t('reader.display')}</SectionLabel>
          <View style={styles.card}>
            <SettingsRow
              label={t('reader.toggleArabic')}
              switchValue={toggles.showArabic}
              onSwitchChange={(v) => onToggleChange('showArabic', v)}
              isFirst
            />
            <SettingsRow
              label={t('reader.toggleTranslation')}
              switchValue={toggles.showTranslation}
              onSwitchChange={(v) => onToggleChange('showTranslation', v)}
            />
            <SettingsRow
              label={t('reader.toggleTranscription')}
              switchValue={toggles.showTranscription}
              onSwitchChange={(v) => onToggleChange('showTranscription', v)}
            />
            <SettingsRow
              label={t('reader.toggleTajweed')}
              subtitle={t('reader.tajweedSubtitle')}
              switchValue={toggles.showTajweed}
              onSwitchChange={(v) => onToggleChange('showTajweed', v)}
            />
          </View>
        </>
      )}
    </View>
  );
}
