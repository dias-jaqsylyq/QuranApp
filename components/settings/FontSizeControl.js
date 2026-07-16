import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../../theme/colors';
import { light as hapticLight } from '../../utils/haptics';

const STEPS = ['small', 'medium', 'large'];

const makeStyles = (C) =>
  StyleSheet.create({
    row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 14 },
    edgeLabel: { fontWeight: '700', color: C.textSecondary },
    track: {
      flex: 1,
      flexDirection: 'row',
      backgroundColor: C.surfaceGray,
      borderRadius: 10,
      padding: 3,
      gap: 3,
    },
    dot: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
    dotActive: { backgroundColor: C.bg },
    dotInner: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.border },
    dotInnerActive: { backgroundColor: C.accent },
  });

export default function FontSizeControl({ value, onChange }) {
  const C = useTheme();
  const styles = useMemo(() => makeStyles(C), [C]);
  const activeIndex = Math.max(0, STEPS.indexOf(value));

  const select = (step) => {
    if (step === value) return;
    hapticLight();
    onChange(step);
  };

  return (
    <View style={styles.row}>
      <Text style={[styles.edgeLabel, { fontSize: 13 }]}>A</Text>
      <View style={styles.track}>
        {STEPS.map((step, i) => (
          <TouchableOpacity key={step} style={[styles.dot, i === activeIndex && styles.dotActive]} onPress={() => select(step)}>
            <View style={[styles.dotInner, i === activeIndex && styles.dotInnerActive]} />
          </TouchableOpacity>
        ))}
      </View>
      <Text style={[styles.edgeLabel, { fontSize: 20 }]}>A</Text>
    </View>
  );
}
