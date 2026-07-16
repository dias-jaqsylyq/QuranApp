import { useMemo, useContext } from 'react';
import { AppContext } from '../context/AppContext';

const shared = {
  accent: '#4CAF50',
  gold: '#D4A017',
  onAccent: '#FFFFFF',
  error: '#E05555',
};

const light = {
  ...shared,
  // User-specified
  bg: '#FFFFFF',
  text: '#1A1A1A',
  textSecondary: '#6B7280',
  verseNum: '#9CA3AF',
  arabicText: '#1A1A1A',
  cardBg: '#F9FAFB',
  border: '#E5E7EB',
  playerBg: '#FFFFFF',
  tabBar: '#FFFFFF',
  tabBorder: '#E5E7EB',
  // Derived
  verseNumBg: '#F3F4F6',
  arabicActive: '#D4A017',
  cardActive: '#F0FFF4',
  meccan: '#E8F5E9',
  medinan: '#EBF5FB',
  meccanText: '#2E7D32',
  medianText: '#1565C0',
  statusBarStyle: 'dark',
  // Minimal design system (redesign)
  surfaceGray: '#F2F2F2',
  surfaceGraySecondary: '#E8E8E8',
  primaryButtonBg: '#000000',
  primaryButtonText: '#FFFFFF',
  secondaryButtonBg: '#E8E8E8',
  secondaryButtonText: '#000000',
  destructive: '#FF3B30',
  verifiedBg: '#D7F2DE',
  verifiedText: '#1E5C33',
  separatorOnGray: 'rgba(0,0,0,0.08)',
  blurTint: 'light',
};

const dark = {
  ...shared,
  // User-specified
  bg: '#0A0E1A',
  text: '#F9FAFB',
  textSecondary: '#9CA3AF',
  verseNum: '#4B5568',
  arabicText: '#F9FAFB',
  cardBg: '#111827',
  border: '#1F2937',
  playerBg: '#080C16',
  tabBar: '#080C16',
  tabBorder: '#1F2937',
  // Derived
  verseNumBg: '#1F2937',
  arabicActive: '#F0C040',
  cardActive: '#0D2218',
  meccan: '#1A3A2A',
  medinan: '#1A2A3A',
  meccanText: '#4CAF50',
  medianText: '#5B8FD4',
  statusBarStyle: 'light',
  // Minimal design system (redesign)
  surfaceGray: '#1C1C1E',
  surfaceGraySecondary: '#2C2C2E',
  primaryButtonBg: '#FFFFFF',
  primaryButtonText: '#000000',
  secondaryButtonBg: '#2C2C2E',
  secondaryButtonText: '#FFFFFF',
  destructive: '#FF453A',
  verifiedBg: '#13301C',
  verifiedText: '#5FD37D',
  separatorOnGray: 'rgba(255,255,255,0.08)',
  blurTint: 'dark',
};

export function useTheme() {
  const { effectiveScheme } = useContext(AppContext);
  return useMemo(() => (effectiveScheme === 'dark' ? dark : light), [effectiveScheme]);
}

export const THEME_OPTIONS = [
  { value: 'light', label: 'Light', icon: 'sunny-outline' },
  { value: null, label: 'System', icon: 'phone-portrait-outline' },
  { value: 'dark', label: 'Dark', icon: 'moon-outline' },
];
