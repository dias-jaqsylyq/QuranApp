import React, { useMemo } from 'react';
import { Text, StyleSheet } from 'react-native';
import { useTheme } from '../../theme/colors';

const makeStyles = (C) =>
  StyleSheet.create({
    label: {
      fontSize: 12,
      fontWeight: '600',
      color: C.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.4,
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 6,
    },
  });

export default function SectionLabel({ children }) {
  const C = useTheme();
  const styles = useMemo(() => makeStyles(C), [C]);
  return <Text style={styles.label}>{children}</Text>;
}
