import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../theme/colors';
import { TRANSLATION_OPTIONS } from '../../data/translations';
import PreviewBox from './PreviewBox';
import FontSizeControl from './FontSizeControl';
import OptionRow from './OptionRow';
import SectionLabel from './SectionLabel';

const FONT_SCALE = { small: 0.85, medium: 1.0, large: 1.2 };

const FALLBACK_PREVIEW = {
  en: 'In the name of God, the Most Gracious, the Dispenser of Grace:',
  ru: 'Во имя Аллаха, Милостивого, Милосердного!',
  kz: 'Аса қайырымды, ерекше мейірімді Аллаһтың атымен бастаймын!',
};

const makeStyles = (C, scale) =>
  StyleSheet.create({
    preview: {
      fontSize: Math.round(16 * scale),
      lineHeight: Math.round(24 * scale),
      color: C.text,
    },
  });

export default function TranslationPanel({ defaultLang, onSelectLang, fontSize, onFontSizeChange, previewVerse }) {
  const C = useTheme();
  const scale = FONT_SCALE[fontSize] ?? 1.0;
  const styles = useMemo(() => makeStyles(C, scale), [C, scale]);

  const previewText = (previewVerse && previewVerse[defaultLang]) || FALLBACK_PREVIEW[defaultLang];

  return (
    <View>
      <PreviewBox>
        <Text style={styles.preview}>{previewText}</Text>
      </PreviewBox>

      <FontSizeControl value={fontSize} onChange={onFontSizeChange} />

      <SectionLabel>Available languages</SectionLabel>
      <View>
        {TRANSLATION_OPTIONS.map((opt, i) => (
          <OptionRow
            key={opt.key}
            label={opt.label}
            subtitle={opt.translator}
            selected={defaultLang === opt.key}
            onPress={() => onSelectLang(opt.key)}
            isFirst={i === 0}
          />
        ))}
      </View>
    </View>
  );
}
