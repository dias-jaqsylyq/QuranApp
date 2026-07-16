import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../../theme/colors';

const makeStyles = (C) =>
  StyleSheet.create({
    box: {
      marginHorizontal: 16,
      marginTop: 4,
      backgroundColor: C.surfaceGray,
      borderRadius: 20,
      padding: 18,
    },
  });

export default function PreviewBox({ children }) {
  const C = useTheme();
  const styles = useMemo(() => makeStyles(C), [C]);
  return <View style={styles.box}>{children}</View>;
}
