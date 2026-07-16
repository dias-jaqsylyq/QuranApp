import * as Haptics from 'expo-haptics';

export const light = () =>
  Haptics.selectionAsync().catch(() => {});

export const medium = () =>
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});

export const heavy = () =>
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});

export const success = () =>
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
