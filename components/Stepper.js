import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../theme/colors';
import { light as hapticLight } from '../utils/haptics';

const makeStyles = (C) =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 14,
    },
    label: { fontSize: 16, color: C.text, fontWeight: '500' },
    track: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: C.surfaceGray,
      borderRadius: 12,
      gap: 2,
    },
    btn: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    value: { fontSize: 15, fontWeight: '700', color: C.text, minWidth: 56, textAlign: 'center' },
  });

export default function Stepper({ label, value, min = 0, max = 999, step = 1, onChange }) {
  const C = useTheme();
  const styles = useMemo(() => makeStyles(C), [C]);

  const change = (delta) => {
    const next = Math.min(max, Math.max(min, value + delta));
    if (next === value) return;
    hapticLight();
    onChange(next);
  };

  const atMin = value <= min;
  const atMax = value >= max;

  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.track}>
        <TouchableOpacity style={styles.btn} onPress={() => change(-step)} disabled={atMin}>
          <Ionicons name="remove" size={16} color={atMin ? C.border : C.text} />
        </TouchableOpacity>
        <Text style={styles.value}>{value}</Text>
        <TouchableOpacity style={styles.btn} onPress={() => change(step)} disabled={atMax}>
          <Ionicons name="add" size={16} color={atMax ? C.border : C.text} />
        </TouchableOpacity>
      </View>
    </View>
  );
}
