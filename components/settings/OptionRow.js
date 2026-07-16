import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../../theme/colors';
import { light as hapticLight } from '../../utils/haptics';

const makeStyles = (C) =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 13,
      gap: 12,
    },
    divider: { borderTopWidth: 1, borderTopColor: C.separatorOnGray },
    iconBadge: {
      width: 30,
      height: 30,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: C.surfaceGraySecondary,
    },
    textWrap: { flex: 1 },
    label: { fontSize: 16, color: C.text, fontWeight: '500' },
    labelSelected: { color: C.accent },
    subtitle: { fontSize: 13, color: C.textSecondary, marginTop: 2 },
  });

export default function OptionRow({ icon, label, subtitle, selected, onPress, isFirst = false }) {
  const C = useTheme();
  const styles = useMemo(() => makeStyles(C), [C]);

  const handlePress = () => {
    hapticLight();
    onPress?.();
  };

  return (
    <TouchableOpacity
      style={[styles.row, !isFirst && styles.divider]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      {icon ? (
        <View style={styles.iconBadge}>
          <Ionicons name={icon} size={16} color={selected ? C.accent : C.textSecondary} />
        </View>
      ) : null}
      <View style={styles.textWrap}>
        <Text style={[styles.label, selected && styles.labelSelected]}>{label}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {selected ? <Ionicons name="checkmark-circle" size={22} color={C.accent} /> : null}
    </TouchableOpacity>
  );
}
