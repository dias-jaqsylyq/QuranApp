import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  PanResponder,
  Dimensions,
  ScrollView,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../theme/colors';
import { light as hapticLight } from '../utils/haptics';
import { useI18n } from '../hooks/useI18n';
import {
  getTafsirForAyah,
  formatCitation,
  resolveEdition,
  DEFAULT_TAFSIR,
} from '../utils/tafsir';
import Sheet, { CLOSE_DURATION } from './settings/Sheet';
import TafsirPanel from './settings/TafsirPanel';
import PillButton from './PillButton';

const { height: SCREEN_H } = Dimensions.get('window');
const OPEN_DURATION = 280;
const HALF_RATIO = 0.5;
const EXPANDED_RATIO = 0.9;
const SNAP_MID = (HALF_RATIO + EXPANDED_RATIO) / 2;

const makeStyles = (C) =>
  StyleSheet.create({
    layer: StyleSheet.absoluteFillObject,
    backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: '#000000' },
    sheet: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: C.bg,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      overflow: 'hidden',
    },
    dragArea: { alignItems: 'center', paddingTop: 10, paddingBottom: 4 },
    handle: { width: 36, height: 5, borderRadius: 3, backgroundColor: C.border },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingTop: 8,
      paddingBottom: 8,
      gap: 10,
    },
    title: { flex: 1, fontSize: 20, fontWeight: '700', color: C.text },
    iconBtn: {
      width: 30,
      height: 30,
      borderRadius: 15,
      backgroundColor: C.surfaceGray,
      alignItems: 'center',
      justifyContent: 'center',
    },
    subheader: {
      fontSize: 12,
      fontWeight: '600',
      color: C.textSecondary,
      letterSpacing: 1.2,
      textTransform: 'uppercase',
      paddingHorizontal: 20,
      marginBottom: 14,
    },
    quoteCard: {
      marginHorizontal: 20,
      marginBottom: 16,
      backgroundColor: C.surfaceGray,
      borderRadius: 12,
      paddingVertical: 12,
      paddingHorizontal: 14,
      borderLeftWidth: 3,
      borderLeftColor: C.accent,
    },
    quoteText: {
      fontSize: 15,
      lineHeight: 22,
      color: C.textSecondary,
    },
    body: {
      fontSize: 16,
      lineHeight: 26,
      color: C.text,
      paddingHorizontal: 20,
    },
    citation: {
      fontSize: 13,
      fontStyle: 'italic',
      color: C.textSecondary,
      paddingHorizontal: 20,
      marginTop: 20,
      marginBottom: 8,
      lineHeight: 19,
    },
    center: {
      paddingVertical: 40,
      paddingHorizontal: 24,
      alignItems: 'center',
      gap: 12,
    },
    status: { fontSize: 14, color: C.textSecondary, textAlign: 'center', lineHeight: 20 },
  });

export default function TafsirSheet({
  visible,
  onClose,
  verse,
  translation,
  tafsirId,
  tafsirSlug,
  onSelectEdition,
}) {
  const C = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => makeStyles(C), [C]);
  const { t } = useI18n();

  const halfH = SCREEN_H * HALF_RATIO;
  const expandedH = SCREEN_H * EXPANDED_RATIO;

  const [mounted, setMounted] = useState(visible);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerMounted, setPickerMounted] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [payload, setPayload] = useState(null);

  const heightAnim = useRef(new Animated.Value(halfH)).current;
  const translateY = useRef(new Animated.Value(SCREEN_H)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const dragStartHeight = useRef(halfH);

  const edition = resolveEdition(tafsirId, tafsirSlug);

  const load = useCallback(
    (forceRefresh = false) => {
      if (!verse) return;
      setLoading(true);
      setError(null);
      getTafsirForAyah(verse.surahNumber, verse.number, tafsirId, tafsirSlug, { forceRefresh })
        .then((data) => {
          setPayload(data);
          setError(null);
        })
        .catch((e) => {
          setPayload(null);
          setError(e.message || t('tafsir.loadError'));
        })
        .finally(() => setLoading(false));
    },
    [verse, tafsirId, tafsirSlug, t],
  );

  useEffect(() => {
    if (visible && verse) {
      heightAnim.setValue(halfH);
      load(false);
    } else {
      setPayload(null);
      setError(null);
      setPickerOpen(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, verse?.surahNumber, verse?.number, tafsirId, tafsirSlug]);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      translateY.setValue(SCREEN_H);
      backdropOpacity.setValue(0);
      requestAnimationFrame(() => {
        Animated.parallel([
          Animated.timing(translateY, { toValue: 0, duration: OPEN_DURATION, useNativeDriver: false }),
          Animated.timing(backdropOpacity, { toValue: 1, duration: OPEN_DURATION, useNativeDriver: false }),
        ]).start();
      });
    } else if (mounted) {
      Animated.parallel([
        Animated.timing(translateY, { toValue: SCREEN_H, duration: CLOSE_DURATION, useNativeDriver: false }),
        Animated.timing(backdropOpacity, { toValue: 0, duration: CLOSE_DURATION, useNativeDriver: false }),
      ]).start(() => setMounted(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  useEffect(() => {
    if (pickerOpen) {
      setPickerMounted(true);
    } else if (pickerMounted) {
      const t = setTimeout(() => setPickerMounted(false), CLOSE_DURATION);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [pickerOpen, pickerMounted]);

  const animateToHeight = (h) => {
    Animated.spring(heightAnim, { toValue: h, useNativeDriver: false, bounciness: 4 }).start();
  };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 4 && Math.abs(g.dy) > Math.abs(g.dx),
      onPanResponderGrant: () => {
        heightAnim.stopAnimation((v) => {
          dragStartHeight.current = v;
        });
      },
      onPanResponderMove: (_, g) => {
        const next = Math.min(expandedH, Math.max(halfH * 0.85, dragStartHeight.current - g.dy));
        heightAnim.setValue(next);
      },
      onPanResponderRelease: (_, g) => {
        const current = dragStartHeight.current - g.dy;
        if (g.dy > 140 || g.vy > 1.1) {
          onClose();
          return;
        }
        const targetRatio = current / SCREEN_H;
        if (targetRatio >= SNAP_MID) {
          animateToHeight(expandedH);
        } else {
          animateToHeight(halfH);
        }
      },
    }),
  ).current;

  if (!mounted || !verse) return null;

  const surahLabel = (verse.surahNameEn || verse.surahName || t('common.surah')).toUpperCase();
  const subheader = `${surahLabel} · AYAH ${verse.number}`;
  const title = payload?.resourceName || edition.name;
  const citation = formatCitation({
    name: payload?.resourceName || edition.name,
    authorName: payload?.authorName || edition.authorName,
  });
  const bottomPad = insets.bottom + 20;

  return (
    <View style={styles.layer} pointerEvents="box-none">
      <TouchableWithoutFeedback onPress={onClose}>
        <Animated.View
          style={[
            styles.backdrop,
            {
              opacity: backdropOpacity.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 0.45],
              }),
            },
          ]}
        />
      </TouchableWithoutFeedback>

      <Animated.View
        style={[
          styles.sheet,
          {
            height: heightAnim,
            transform: [{ translateY }],
          },
        ]}
      >
        <View {...panResponder.panHandlers}>
          <View style={styles.dragArea}>
            <View style={styles.handle} />
          </View>
          <View style={styles.headerRow}>
            <Text style={styles.title} numberOfLines={1}>
              {title}
            </Text>
            <TouchableOpacity
              style={styles.iconBtn}
              onPress={() => {
                hapticLight();
                setPickerOpen(true);
              }}
              accessibilityLabel={t('tafsir.chooseA11y')}
            >
              <Ionicons name="settings-outline" size={16} color={C.text} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconBtn} onPress={onClose} accessibilityLabel={t('common.close')}>
              <Ionicons name="close" size={18} color={C.text} />
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.subheader}>{subheader}</Text>

        {translation ? (
          <View style={styles.quoteCard}>
            <Text style={styles.quoteText}>{translation}</Text>
          </View>
        ) : null}

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: bottomPad }}
          showsVerticalScrollIndicator
          nestedScrollEnabled
        >
          {loading ? (
            <View style={styles.center}>
              <ActivityIndicator color={C.accent} />
            </View>
          ) : error ? (
            <View style={styles.center}>
              <Text style={styles.status}>{error}</Text>
              <PillButton variant="secondary" label={t('common.retry')} onPress={() => load(true)} />
            </View>
          ) : payload?.text ? (
            <>
              <Text style={styles.body}>{payload.text}</Text>
              <Text style={styles.citation}>{citation}</Text>
            </>
          ) : (
            <View style={styles.center}>
              <Text style={styles.status}>{t('tafsir.empty')}</Text>
            </View>
          )}
        </ScrollView>
      </Animated.View>

      {pickerMounted ? (
        <Modal transparent visible={pickerMounted} animationType="none" statusBarTranslucent>
          <Sheet
            visible={pickerOpen}
            onClose={() => setPickerOpen(false)}
            title={t('tafsir.choose')}
          >
            <TafsirPanel
              selectedId={tafsirId ?? DEFAULT_TAFSIR.id}
              onSelectEdition={(item) => {
                onSelectEdition?.({ id: item.id, slug: item.slug });
                setPickerOpen(false);
              }}
            />
          </Sheet>
        </Modal>
      ) : null}
    </View>
  );
}
