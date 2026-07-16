import React, { useMemo } from 'react';
import { Text, TouchableOpacity, StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../theme/colors';
import { light as hapticLight } from '../utils/haptics';

const makeStyles = (C) =>
  StyleSheet.create({
    base: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 20,
      paddingVertical: 14,
      borderRadius: 999,
      gap: 8,
    },
    primary: { backgroundColor: C.primaryButtonBg },
    secondary: { backgroundColor: C.secondaryButtonBg },
    disabled: { opacity: 0.4 },
    label: { fontSize: 16, fontWeight: '700' },
    labelPrimary: { color: C.primaryButtonText },
    labelSecondary: { color: C.secondaryButtonText },
  });

export default function PillButton({
  variant = 'primary',
  label,
  icon,
  iconPosition = 'left',
  onPress,
  disabled = false,
  style,
}) {
  const C = useTheme();
  const styles = useMemo(() => makeStyles(C), [C]);

  const handlePress = () => {
    if (disabled) return;
    hapticLight();
    onPress?.();
  };

  const iconColor = variant === 'primary' ? C.primaryButtonText : C.secondaryButtonText;
  const iconEl = icon ? <Ionicons name={icon} size={18} color={iconColor} /> : null;

  return (
    <TouchableOpacity
      style={[
        styles.base,
        variant === 'primary' ? styles.primary : styles.secondary,
        disabled && styles.disabled,
        style,
      ]}
      onPress={handlePress}
      activeOpacity={0.7}
      disabled={disabled}
    >
      {icon && iconPosition === 'left' && iconEl}
      <Text style={[styles.label, variant === 'primary' ? styles.labelPrimary : styles.labelSecondary]}>
        {label}
      </Text>
      {icon && iconPosition === 'right' && iconEl}
    </TouchableOpacity>
  );
}
