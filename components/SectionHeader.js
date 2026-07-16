import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../theme/colors';

const makeStyles = (C) =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingTop: 28,
      paddingBottom: 8,
    },
    title: { fontSize: 22, fontWeight: '700', color: C.text },
  });

export default function SectionHeader({ title, accessory }) {
  const C = useTheme();
  const styles = useMemo(() => makeStyles(C), [C]);

  return (
    <View style={styles.row}>
      <Text style={styles.title}>{title}</Text>
      {accessory}
    </View>
  );
}
