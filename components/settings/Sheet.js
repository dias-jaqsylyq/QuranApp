import React, { useEffect, useMemo, useRef, useState } from 'react';
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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../../theme/colors';

const { height: SCREEN_H } = Dimensions.get('window');
const OPEN_DURATION = 280;
export const CLOSE_DURATION = 220;
const DISMISS_DISTANCE = 120;
const DISMISS_VELOCITY = 0.8;
const MAX_HEIGHT_RATIO = 0.88;
const BOTTOM_SPACING = 24;

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
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingTop: 8,
      paddingBottom: 14,
    },
    title: { fontSize: 20, fontWeight: '700', color: C.text },
    closeBtn: {
      width: 30,
      height: 30,
      borderRadius: 15,
      backgroundColor: C.surfaceGray,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });

export default function Sheet({ visible, onClose, title, children }) {
  const C = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => makeStyles(C), [C]);
  const [mounted, setMounted] = useState(visible);
  const translateY = useRef(new Animated.Value(SCREEN_H)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  const [headerHeight, setHeaderHeight] = useState(0);
  const [contentHeight, setContentHeight] = useState(0);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      translateY.setValue(SCREEN_H);
      backdropOpacity.setValue(0);
      requestAnimationFrame(() => {
        Animated.parallel([
          Animated.timing(translateY, { toValue: 0, duration: OPEN_DURATION, useNativeDriver: true }),
          Animated.timing(backdropOpacity, { toValue: 1, duration: OPEN_DURATION, useNativeDriver: true }),
        ]).start();
      });
    } else if (mounted) {
      Animated.parallel([
        Animated.timing(translateY, { toValue: SCREEN_H, duration: CLOSE_DURATION, useNativeDriver: true }),
        Animated.timing(backdropOpacity, { toValue: 0, duration: CLOSE_DURATION, useNativeDriver: true }),
      ]).start(() => setMounted(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => g.dy > 4 && Math.abs(g.dy) > Math.abs(g.dx),
      onPanResponderMove: (_, g) => {
        if (g.dy > 0) translateY.setValue(g.dy);
      },
      onPanResponderRelease: (_, g) => {
        if (g.dy > DISMISS_DISTANCE || g.vy > DISMISS_VELOCITY) {
          onClose();
        } else {
          Animated.spring(translateY, { toValue: 0, useNativeDriver: true, bounciness: 4 }).start();
        }
      },
    }),
  ).current;

  if (!mounted) return null;

  // Sheet should size to its content, capped at MAX_HEIGHT_RATIO of the
  // screen. ScrollView can't report its content's natural height to an
  // auto-sizing parent (that's what lets it scroll at all), so the only
  // reliable way to get "fit content, then cap and scroll" is to measure
  // the content directly and decide which container to use.
  const maxSheetHeight = SCREEN_H * MAX_HEIGHT_RATIO;
  const maxBodyHeight = Math.max(0, maxSheetHeight - headerHeight);
  const needsScroll = headerHeight > 0 && contentHeight > maxBodyHeight;
  const bottomInset = insets.bottom + BOTTOM_SPACING;

  const measuredContent = (
    <View onLayout={(e) => setContentHeight(e.nativeEvent.layout.height)}>{children}</View>
  );

  return (
    <View style={styles.layer} pointerEvents="box-none">
      <TouchableWithoutFeedback onPress={onClose}>
        <Animated.View style={[styles.backdrop, { opacity: backdropOpacity.interpolate({ inputRange: [0, 1], outputRange: [0, 0.45] }) }]} />
      </TouchableWithoutFeedback>

      <Animated.View style={[styles.sheet, { maxHeight: maxSheetHeight, transform: [{ translateY }] }]}>
        <View {...panResponder.panHandlers} onLayout={(e) => setHeaderHeight(e.nativeEvent.layout.height)}>
          <View style={styles.dragArea}>
            <View style={styles.handle} />
          </View>
          <View style={styles.headerRow}>
            <Text style={styles.title}>{title}</Text>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Ionicons name="close" size={18} color={C.text} />
            </TouchableOpacity>
          </View>
        </View>

        {needsScroll ? (
          <ScrollView
            style={{ maxHeight: maxBodyHeight }}
            contentContainerStyle={{ paddingBottom: bottomInset }}
            showsVerticalScrollIndicator
          >
            {measuredContent}
          </ScrollView>
        ) : (
          <View style={{ paddingBottom: bottomInset }}>{measuredContent}</View>
        )}
      </Animated.View>
    </View>
  );
}
