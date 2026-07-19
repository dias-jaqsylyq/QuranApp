import React, { useMemo } from 'react';
import { Text, TouchableOpacity, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../theme/colors';
import { light as hapticLight } from '../utils/haptics';
import { useI18n } from '../hooks/useI18n';

const CONFIG = {
  apple: { icon: 'logo-apple', labelKey: 'auth.continueApple' },
  google: { icon: 'logo-google', labelKey: 'auth.continueGoogle' },
  email: { icon: 'mail-outline', labelKey: 'auth.continueEmail' },
};

const makeStyles = (C) =>
  StyleSheet.create({
    base: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 15,
      borderRadius: 999,
      gap: 10,
    },
    apple: { backgroundColor: '#000000' },
    appleText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
    neutral: { backgroundColor: C.surfaceGray },
    neutralText: { color: C.text, fontSize: 16, fontWeight: '600' },
  });

export default function SocialAuthButton({ provider, onPress, disabled = false, style }) {
  const C = useTheme();
  const styles = useMemo(() => makeStyles(C), [C]);
  const { t } = useI18n();
  const { icon, labelKey } = CONFIG[provider];
  const isApple = provider === 'apple';

  const handlePress = () => {
    if (disabled) return;
    hapticLight();
    onPress?.();
  };

  return (
    <TouchableOpacity
      style={[styles.base, isApple ? styles.apple : styles.neutral, style]}
      onPress={handlePress}
      disabled={disabled}
      activeOpacity={0.8}
    >
      <Ionicons name={icon} size={20} color={isApple ? '#FFFFFF' : C.text} />
      <Text style={isApple ? styles.appleText : styles.neutralText}>{t(labelKey)}</Text>
    </TouchableOpacity>
  );
}
