import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../theme/colors';
import PreviewBox from './PreviewBox';
import FontSizeControl from './FontSizeControl';
import OptionRow from './OptionRow';
import SectionLabel from './SectionLabel';

const FONT_SCALE = { small: 0.85, medium: 1.0, large: 1.2 };
const PREVIEW_TEXT = 'بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ';

const makeStyles = (C, scale) =>
  StyleSheet.create({
    preview: {
      fontSize: Math.round(28 * scale),
      lineHeight: Math.round(52 * scale),
      textAlign: 'right',
      writingDirection: 'rtl',
      color: C.arabicText,
      fontFamily: 'Amiri_400Regular',
    },
  });

export default function ArabicFontPanel({ fontSize, onFontSizeChange }) {
  const C = useTheme();
  const scale = FONT_SCALE[fontSize] ?? 1.0;
  const styles = useMemo(() => makeStyles(C, scale), [C, scale]);

  return (
    <View>
      <PreviewBox>
        <Text style={styles.preview}>{PREVIEW_TEXT}</Text>
      </PreviewBox>

      <FontSizeControl value={fontSize} onChange={onFontSizeChange} />

      <SectionLabel>Available fonts</SectionLabel>
      <View>
        <OptionRow icon="text-outline" label="Amiri" subtitle="Default Arabic typeface" selected isFirst />
      </View>
    </View>
  );
}
