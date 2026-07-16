import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, Switch, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../theme/colors';
import { light as hapticLight } from '../utils/haptics';

const makeStyles = (C) =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 14,
      gap: 12,
    },
    divider: { borderTopWidth: 1, borderTopColor: C.separatorOnGray },
    iconBadge: {
      width: 30,
      height: 30,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
    },
    textWrap: { flex: 1 },
    label: { fontSize: 17, color: C.text, fontWeight: '400' },
    labelDestructive: { color: C.destructive },
    subtitle: { fontSize: 13, color: C.textSecondary, marginTop: 2 },
    trailing: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    value: { fontSize: 15, color: C.textSecondary },
  });

export default function SettingsRow({
  icon,
  iconColor,
  label,
  subtitle,
  value,
  chevron = false,
  switchValue,
  onSwitchChange,
  destructive = false,
  onPress,
  isFirst = false,
}) {
  const C = useTheme();
  const styles = useMemo(() => makeStyles(C), [C]);
  const hasSwitch = typeof onSwitchChange === 'function';

  const handlePress = () => {
    if (!onPress) return;
    hapticLight();
    onPress();
  };

  const content = (
    <View style={[styles.row, !isFirst && styles.divider]}>
      {icon ? (
        <View style={[styles.iconBadge, { backgroundColor: iconColor ? `${iconColor}22` : C.surfaceGraySecondary }]}>
          <Ionicons name={icon} size={16} color={destructive ? C.destructive : iconColor || C.textSecondary} />
        </View>
      ) : null}
      <View style={styles.textWrap}>
        <Text style={[styles.label, destructive && styles.labelDestructive]}>{label}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      <View style={styles.trailing}>
        {hasSwitch ? (
          <Switch value={!!switchValue} onValueChange={(v) => { hapticLight(); onSwitchChange(v); }} />
        ) : (
          <>
            {value ? <Text style={styles.value}>{value}</Text> : null}
            {chevron ? <Ionicons name="chevron-forward" size={18} color={C.textSecondary} /> : null}
          </>
        )}
      </View>
    </View>
  );

  if (hasSwitch || !onPress) return content;

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.7}>
      {content}
    </TouchableOpacity>
  );
}
