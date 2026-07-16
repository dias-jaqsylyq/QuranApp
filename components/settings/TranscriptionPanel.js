import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../theme/colors';
import { simplifyTranslit } from '../../utils/quranText';
import PreviewBox from './PreviewBox';
import FontSizeControl from './FontSizeControl';
import OptionRow from './OptionRow';
import SectionLabel from './SectionLabel';

const FONT_SCALE = { small: 0.85, medium: 1.0, large: 1.2 };
const PREVIEW_STANDARD = "Bismi'llāhi r-raḥmāni r-raḥīm";

const STYLE_OPTIONS = [
  { value: 'standard', label: 'Standard', subtitle: 'With diacritics (ā, ḥ, ʻ)' },
  { value: 'simple', label: 'Simple', subtitle: 'Plain Latin letters' },
];

const makeStyles = (C, scale) =>
  StyleSheet.create({
    preview: {
      fontSize: Math.round(16 * scale),
      fontStyle: 'italic',
      lineHeight: Math.round(24 * scale),
      color: C.textSecondary,
    },
  });

export default function TranscriptionPanel({ translitStyle, onTranslitStyleChange, fontSize, onFontSizeChange }) {
  const C = useTheme();
  const scale = FONT_SCALE[fontSize] ?? 1.0;
  const styles = useMemo(() => makeStyles(C, scale), [C, scale]);

  const previewText = translitStyle === 'simple' ? simplifyTranslit(PREVIEW_STANDARD) : PREVIEW_STANDARD;

  return (
    <View>
      <PreviewBox>
        <Text style={styles.preview}>{previewText}</Text>
      </PreviewBox>

      <FontSizeControl value={fontSize} onChange={onFontSizeChange} />

      <SectionLabel>Style</SectionLabel>
      <View>
        {STYLE_OPTIONS.map((opt, i) => (
          <OptionRow
            key={opt.value}
            label={opt.label}
            subtitle={opt.subtitle}
            selected={translitStyle === opt.value}
            onPress={() => onTranslitStyleChange(opt.value)}
            isFirst={i === 0}
          />
        ))}
      </View>
    </View>
  );
}
