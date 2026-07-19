import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../theme/colors';
import { light as hapticLight } from '../utils/haptics';
import { useI18n } from '../hooks/useI18n';
import { useAuth } from '../context/AuthContext';
import PillButton from '../components/PillButton';
import SocialAuthButton from '../components/SocialAuthButton';

const makeStyles = (C) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: C.bg },
    scrollContent: { paddingHorizontal: 24, paddingBottom: 40, flexGrow: 1 },

    header: { flexDirection: 'row', justifyContent: 'flex-end', paddingTop: 8 },
    closeBtn: {
      width: 32, height: 32, borderRadius: 16,
      backgroundColor: C.surfaceGray, alignItems: 'center', justifyContent: 'center',
    },

    titleBlock: { marginTop: 12, marginBottom: 28 },
    title: { fontSize: 28, fontWeight: '700', color: C.text },
    subtitle: { fontSize: 15, color: C.textSecondary, marginTop: 8, lineHeight: 21 },

    socialBtn: { marginBottom: 12 },

    legalText: { fontSize: 12, color: C.textSecondary, textAlign: 'center', lineHeight: 18, marginTop: 16 },
    legalLink: { color: C.text, fontWeight: '600' },

    backLink: { paddingVertical: 8, marginBottom: 8 },
    backLinkText: { fontSize: 15, color: C.textSecondary },

    fieldsCard: { backgroundColor: C.surfaceGray, borderRadius: 20, overflow: 'hidden', marginBottom: 8 },
    field: { paddingHorizontal: 16, paddingVertical: 12 },
    fieldDivider: { borderTopWidth: 1, borderTopColor: C.separatorOnGray },
    fieldLabel: { fontSize: 12, color: C.textSecondary, marginBottom: 2 },
    fieldInput: { fontSize: 16, color: C.text, padding: 0 },
    hint: { fontSize: 12, color: C.textSecondary, marginBottom: 20 },

    switchRow: { alignItems: 'center', marginTop: 20 },
    switchText: { fontSize: 14, color: C.textSecondary },
    switchLink: { color: C.accent, fontWeight: '600' },
  });

export default function AuthScreen({ navigation, route }) {
  const C = useTheme();
  const styles = useMemo(() => makeStyles(C), [C]);
  const { t } = useI18n();
  const { signInWithOAuth, signUpWithEmail, signInWithEmail } = useAuth();

  const initialMode = route.params?.initialMode === 'signin' ? 'signin' : 'signup';
  const [step, setStep] = useState('social'); // 'social' | 'email'
  const [authMode, setAuthMode] = useState(initialMode); // 'signup' | 'signin'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const close = () => {
    hapticLight();
    navigation.goBack();
  };

  const comingSoon = () => {
    hapticLight();
    Alert.alert(t('common.comingSoon'));
  };

  const handleOAuth = async (provider) => {
    hapticLight();
    setLoading(true);
    try {
      const session = await signInWithOAuth(provider);
      if (session) navigation.goBack();
    } catch (err) {
      Alert.alert(t('auth.couldntSignIn'), err.message);
    } finally {
      setLoading(false);
    }
  };

  const openEmailForm = () => {
    hapticLight();
    setStep('email');
  };

  const backToSocial = () => {
    hapticLight();
    setStep('social');
  };

  const toggleAuthMode = () => {
    hapticLight();
    setAuthMode((m) => (m === 'signup' ? 'signin' : 'signup'));
  };

  const submitEmail = async () => {
    hapticLight();
    if (!email.trim() || !password) {
      Alert.alert(t('auth.missingInfoTitle'), t('auth.missingInfoMessage'));
      return;
    }
    setLoading(true);
    try {
      if (authMode === 'signup') {
        const data = await signUpWithEmail(email.trim(), password);
        if (data?.session) {
          navigation.goBack();
        } else {
          // Email confirmation is on by default for new Supabase projects —
          // signUp succeeds but returns no session until the link is clicked.
          Alert.alert(
            t('auth.checkEmailTitle'),
            t('auth.checkEmailMessage', { email: email.trim() }),
          );
          setAuthMode('signin');
        }
      } else {
        await signInWithEmail(email.trim(), password);
        navigation.goBack();
      }
    } catch (err) {
      Alert.alert(t('common.somethingWentWrong'), err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <TouchableOpacity style={styles.closeBtn} onPress={close}>
              <Ionicons name="close" size={18} color={C.text} />
            </TouchableOpacity>
          </View>

          {step === 'social' ? (
            <>
              <View style={styles.titleBlock}>
                <Text style={styles.title}>
                  {authMode === 'signup' ? t('auth.createAccountTitle') : t('auth.welcomeBack')}
                </Text>
                <Text style={styles.subtitle}>
                  {t('auth.subtitle')}
                </Text>
              </View>

              <SocialAuthButton
                provider="apple"
                onPress={() => handleOAuth('apple')}
                disabled={loading}
                style={styles.socialBtn}
              />
              <SocialAuthButton
                provider="google"
                onPress={() => handleOAuth('google')}
                disabled={loading}
                style={styles.socialBtn}
              />
              <SocialAuthButton
                provider="email"
                onPress={openEmailForm}
                disabled={loading}
                style={styles.socialBtn}
              />

              {loading && <ActivityIndicator style={{ marginTop: 8 }} color={C.textSecondary} />}

              <Text style={styles.legalText}>
                {t('auth.legalPrefix')}{' '}
                <Text style={styles.legalLink} onPress={comingSoon}>{t('auth.termsOfService')}</Text>
                {' '}{t('auth.and')}{' '}
                <Text style={styles.legalLink} onPress={comingSoon}>{t('auth.privacyPolicy')}</Text>.
              </Text>
            </>
          ) : (
            <>
              <TouchableOpacity style={styles.backLink} onPress={backToSocial}>
                <Text style={styles.backLinkText}>{t('common.back')}</Text>
              </TouchableOpacity>

              <View style={styles.titleBlock}>
                <Text style={styles.title}>
                  {authMode === 'signup' ? t('auth.createAccountTitle') : t('auth.signInTitle')}
                </Text>
              </View>

              <View style={styles.fieldsCard}>
                <View style={styles.field}>
                  <Text style={styles.fieldLabel}>{t('auth.email')}</Text>
                  <TextInput
                    style={styles.fieldInput}
                    value={email}
                    onChangeText={setEmail}
                    placeholder={t('auth.emailPlaceholder')}
                    placeholderTextColor={C.textSecondary}
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="email-address"
                    textContentType="emailAddress"
                  />
                </View>
                <View style={[styles.field, styles.fieldDivider]}>
                  <Text style={styles.fieldLabel}>{t('auth.password')}</Text>
                  <TextInput
                    style={styles.fieldInput}
                    value={password}
                    onChangeText={setPassword}
                    placeholder="••••••••"
                    placeholderTextColor={C.textSecondary}
                    secureTextEntry
                    textContentType={authMode === 'signup' ? 'newPassword' : 'password'}
                  />
                </View>
              </View>
              {authMode === 'signup' && (
                <Text style={styles.hint}>{t('auth.passwordHint')}</Text>
              )}

              <PillButton
                variant="primary"
                label={authMode === 'signup' ? t('auth.createAccount') : t('auth.signIn')}
                onPress={submitEmail}
                disabled={loading}
              />
              {loading && <ActivityIndicator style={{ marginTop: 12 }} color={C.textSecondary} />}

              <View style={styles.switchRow}>
                <TouchableOpacity onPress={toggleAuthMode}>
                  <Text style={styles.switchText}>
                    {authMode === 'signup' ? `${t('auth.haveAccount')} ` : `${t('auth.noAccount')} `}
                    <Text style={styles.switchLink}>
                      {authMode === 'signup' ? t('auth.signIn') : t('auth.signUp')}
                    </Text>
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
