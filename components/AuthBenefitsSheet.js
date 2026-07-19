import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../theme/colors';
import { light as hapticLight } from '../utils/haptics';
import { useI18n } from '../hooks/useI18n';
import Sheet from './settings/Sheet';
import PillButton from './PillButton';
import SocialAuthButton from './SocialAuthButton';
import { useAuth } from '../context/AuthContext';

const BENEFIT_KEYS = [
  { icon: 'book-outline', key: 'auth.benefitKhatm' },
  { icon: 'bookmark-outline', key: 'auth.benefitBookmarks' },
  { icon: 'people-outline', key: 'auth.benefitCircle' },
  { icon: 'ribbon-outline', key: 'auth.benefitStreak' },
];

const makeStyles = (C) =>
  StyleSheet.create({
    benefit: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 16 },
    benefitIcon: {
      width: 32, height: 32, borderRadius: 16,
      backgroundColor: C.cardActive, alignItems: 'center', justifyContent: 'center',
    },
    benefitText: { flex: 1, fontSize: 15, color: C.text, lineHeight: 21, paddingTop: 5 },

    divider: { height: 1, backgroundColor: C.border, marginVertical: 20 },

    socialBtn: { marginBottom: 12 },

    ctaRow: { flexDirection: 'row', gap: 10, marginTop: 8 },
  });

export default function AuthBenefitsSheet({ visible, onClose, navigation }) {
  const C = useTheme();
  const styles = useMemo(() => makeStyles(C), [C]);
  const { t } = useI18n();
  const { signInWithOAuth } = useAuth();

  const goToAuth = (initialMode) => {
    hapticLight();
    onClose();
    navigation.navigate('You', { screen: 'Auth', params: { initialMode } });
  };

  const handleOAuth = async (provider) => {
    try {
      const session = await signInWithOAuth(provider);
      if (session) onClose();
    } catch {
      goToAuth('signup');
    }
  };

  return (
    <Sheet visible={visible} onClose={onClose} title={t('auth.benefitsTitle')}>
      <View style={{ paddingHorizontal: 20 }}>
        {BENEFIT_KEYS.map((b) => (
          <View key={b.key} style={styles.benefit}>
            <View style={styles.benefitIcon}>
              <Ionicons name={b.icon} size={16} color={C.accent} />
            </View>
            <Text style={styles.benefitText}>{t(b.key)}</Text>
          </View>
        ))}

        <View style={styles.divider} />

        <SocialAuthButton provider="apple" onPress={() => handleOAuth('apple')} style={styles.socialBtn} />
        <SocialAuthButton provider="google" onPress={() => handleOAuth('google')} style={styles.socialBtn} />
        <SocialAuthButton provider="email" onPress={() => goToAuth('signup')} style={styles.socialBtn} />

        <View style={styles.ctaRow}>
          <PillButton variant="primary" label={t('auth.createFreeAccount')} onPress={() => goToAuth('signup')} style={{ flex: 1 }} />
        </View>
        <View style={styles.ctaRow}>
          <PillButton variant="secondary" label={t('auth.signIn')} onPress={() => goToAuth('signin')} style={{ flex: 1 }} />
        </View>
      </View>
    </Sheet>
  );
}
