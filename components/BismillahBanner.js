import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../theme/colors';

const makeStyles = (C) =>
  StyleSheet.create({
    card: {
      backgroundColor: C.surfaceGray,
      borderRadius: 20,
      marginHorizontal: 16,
      marginTop: 12,
      paddingVertical: 18,
      paddingHorizontal: 20,
      alignItems: 'center',
    },
    text: {
      fontSize: 24,
      color: C.arabicText,
      lineHeight: 44,
      textAlign: 'center',
      fontFamily: 'Amiri_400Regular',
    },
  });

export default function BismillahBanner() {
  const C = useTheme();
  const styles = useMemo(() => makeStyles(C), [C]);
  return (
    <View style={styles.card}>
      <Text style={styles.text}>بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ</Text>
    </View>
  );
}
