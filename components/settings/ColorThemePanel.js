import React from 'react';
import { View } from 'react-native';
import { THEME_OPTIONS } from '../../theme/colors';
import OptionRow from './OptionRow';

export default function ColorThemePanel({ colorMode, onSelectColorMode }) {
  return (
    <View>
      {THEME_OPTIONS.map((opt, i) => (
        <OptionRow
          key={String(opt.value)}
          icon={opt.icon}
          label={opt.label}
          selected={colorMode === opt.value}
          onPress={() => onSelectColorMode(opt.value)}
          isFirst={i === 0}
        />
      ))}
    </View>
  );
}
