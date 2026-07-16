import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../theme/colors';
import { light as hapticLight } from '../utils/haptics';

const makeStyles = (C) =>
  StyleSheet.create({
    card: {
      flex: 1,
      backgroundColor: C.surfaceGray,
      borderRadius: 20,
      padding: 16,
      gap: 4,
    },
    topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    value: { fontSize: 28, fontWeight: '700', color: C.text },
    label: { fontSize: 13, color: C.textSecondary, fontWeight: '500' },
  });

export default function StatCard({ value, label, icon, onPress }) {
  const C = useTheme();
  const styles = useMemo(() => makeStyles(C), [C]);

  const handlePress = () => {
    if (!onPress) return;
    hapticLight();
    onPress();
  };

  const Wrapper = onPress ? TouchableOpacity : View;

  return (
    <Wrapper style={styles.card} onPress={onPress ? handlePress : undefined} activeOpacity={0.7}>
      <View style={styles.topRow}>
        <Text style={styles.value}>{value}</Text>
        {icon ? <Ionicons name={icon} size={20} color={C.textSecondary} /> : null}
      </View>
      <Text style={styles.label}>{label}</Text>
    </Wrapper>
  );
}
