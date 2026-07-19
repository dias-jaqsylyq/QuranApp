import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
  Linking,
  Animated,
  Easing,
} from 'react-native';
import { Magnetometer, Accelerometer } from 'expo-sensors';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Svg, { Circle, Line, Polygon, Defs, RadialGradient, Stop } from 'react-native-svg';
import { useTheme } from '../theme/colors';
import { light as hapticLight, success as hapticSuccess } from '../utils/haptics';
import { useI18n } from '../hooks/useI18n';
import PillButton from '../components/PillButton';
import {
  calculateQiblaBearing,
  magnetometerToHeading,
  qiblaNeedleRotation,
  shortestAngleDelta,
  isAligned,
  isPhoneFlat,
  ALIGNMENT_TOLERANCE_DEG,
  LOW_ACCURACY_THRESHOLD_DEG,
} from '../utils/qibla';

// Same cache key as hooks/usePrayerTimes.js — show a bearing ASAP from last GPS.
const LOCATION_KEY = 'last_known_location';
const SMOOTHING = 0.18;
const DIAL_SIZE = Math.min(Dimensions.get('window').width - 64, 300);
const LOCKED_GREEN = '#66BB6A';

const makeStyles = (C) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: C.bg,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 24,
      paddingBottom: 40,
    },
    status: {
      fontSize: 15,
      color: C.textSecondary,
      textAlign: 'center',
      lineHeight: 22,
      marginBottom: 16,
    },
    dialWrap: {
      width: DIAL_SIZE,
      height: DIAL_SIZE,
      alignItems: 'center',
      justifyContent: 'center',
    },
    bearing: {
      fontSize: 36,
      fontWeight: '700',
      color: C.text,
      marginTop: 28,
    },
    hint: {
      fontSize: 14,
      color: C.textSecondary,
      textAlign: 'center',
      lineHeight: 20,
      marginTop: 10,
      paddingHorizontal: 12,
    },
    hintAligned: {
      color: C.gold,
      fontWeight: '600',
    },
    tip: {
      fontSize: 13,
      color: C.verseNum,
      textAlign: 'center',
      marginTop: 16,
      lineHeight: 18,
    },
    zzWrap: {
      position: 'absolute',
      top: 16,
      right: 20,
    },
    zzText: {
      fontSize: 18,
      fontWeight: '700',
      color: C.gold,
      letterSpacing: 1,
    },
    buttonCol: { gap: 10, alignItems: 'center', width: '100%' },
  });

function CompassDial({ needleRotation, accent, border, text, gold, aligned, glowOpacity }) {
  const cx = DIAL_SIZE / 2;
  const cy = DIAL_SIZE / 2;
  const r = DIAL_SIZE / 2 - 8;
  const needleLen = r * 0.72;
  const tipY = cy - needleLen;
  const baseY = cy + needleLen * 0.18;
  const needleFill = aligned ? LOCKED_GREEN : accent;
  const markerStroke = aligned ? gold : text;

  return (
    <View style={{ width: DIAL_SIZE, height: DIAL_SIZE }}>
      <Svg width={DIAL_SIZE} height={DIAL_SIZE}>
        <Circle cx={cx} cy={cy} r={r} stroke={border} strokeWidth={2} fill="transparent" />
        <Circle cx={cx} cy={cy} r={r * 0.88} stroke={border} strokeWidth={1} fill="transparent" opacity={0.5} />

        {/* Cardinal ticks — fixed on the dial */}
        {[0, 90, 180, 270].map((deg) => {
          const rad = ((deg - 90) * Math.PI) / 180;
          return (
            <Line
              key={deg}
              x1={cx + Math.cos(rad) * (r - 18)}
              y1={cy + Math.sin(rad) * (r - 18)}
              x2={cx + Math.cos(rad) * (r - 4)}
              y2={cy + Math.sin(rad) * (r - 4)}
              stroke={border}
              strokeWidth={2}
            />
          );
        })}

        {/* Fixed “facing” mark at 12 o’clock */}
        <Line
          x1={cx}
          y1={cy - r + 2}
          x2={cx}
          y2={cy - r + 18}
          stroke={markerStroke}
          strokeWidth={aligned ? 4 : 3}
          strokeLinecap="round"
        />
      </Svg>

      {/* Qibla needle — points up on screen when the phone faces the Kaaba */}
      <Animated.View
        style={{
          position: 'absolute',
          width: DIAL_SIZE,
          height: DIAL_SIZE,
          transform: [{ rotate: `${needleRotation}deg` }],
          opacity: aligned ? glowOpacity : 1,
        }}
        pointerEvents="none"
      >
        <Svg width={DIAL_SIZE} height={DIAL_SIZE}>
          <Defs>
            <RadialGradient id="needleGlow" cx="50%" cy="35%" r="55%">
              <Stop offset="0%" stopColor={LOCKED_GREEN} stopOpacity="0.55" />
              <Stop offset="100%" stopColor={LOCKED_GREEN} stopOpacity="0" />
            </RadialGradient>
          </Defs>
          {aligned ? (
            <Circle cx={cx} cy={cy - needleLen * 0.35} r={needleLen * 0.55} fill="url(#needleGlow)" />
          ) : null}
          <Polygon
            points={`${cx},${tipY} ${cx - 10},${baseY} ${cx + 10},${baseY}`}
            fill={needleFill}
          />
          <Circle cx={cx} cy={cy} r={6} fill={text} />
          <Circle cx={cx} cy={cy} r={3} fill={needleFill} />
        </Svg>
      </Animated.View>
    </View>
  );
}

export default function QiblaScreen() {
  const C = useTheme();
  const styles = useMemo(() => makeStyles(C), [C]);
  const { t } = useI18n();

  const [coords, setCoords] = useState(null);
  const [loading, setLoading] = useState(true);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [heading, setHeading] = useState(null);
  const [headingAccuracy, setHeadingAccuracy] = useState(null);
  const [sensorAvailable, setSensorAvailable] = useState(true);
  const [phoneFlat, setPhoneFlat] = useState(true);

  const smoothHeadingRef = useRef(null);
  const wasAlignedRef = useRef(false);
  const glowOpacity = useRef(new Animated.Value(1)).current;

  const applySmoothedHeading = useCallback((raw) => {
    const prev = smoothHeadingRef.current;
    if (prev == null) {
      smoothHeadingRef.current = raw;
    } else {
      const delta = shortestAngleDelta(prev, raw);
      smoothHeadingRef.current = ((prev + delta * SMOOTHING) % 360 + 360) % 360;
    }
    setHeading(smoothHeadingRef.current);
  }, []);

  const loadLocation = useCallback(async () => {
    setLoading(true);
    setPermissionDenied(false);

    const cached = await AsyncStorage.getItem(LOCATION_KEY);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (typeof parsed.latitude === 'number' && typeof parsed.longitude === 'number') {
          setCoords({ latitude: parsed.latitude, longitude: parsed.longitude });
        }
      } catch {
        // ignore corrupt cache
      }
    }

    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      setPermissionDenied(true);
      setLoading(false);
      return;
    }

    try {
      const position = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = position.coords;
      setCoords({ latitude, longitude });

      let name = null;
      try {
        const places = await Location.reverseGeocodeAsync({ latitude, longitude });
        name = places?.[0]?.city || places?.[0]?.region || null;
      } catch {
        // best-effort
      }
      await AsyncStorage.setItem(LOCATION_KEY, JSON.stringify({ latitude, longitude, name }));
    } catch {
      // keep cached coords if GPS fails
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLocation();
  }, [loadLocation]);

  // Heading: prefer Location.watchHeadingAsync, else Magnetometer.
  useEffect(() => {
    let headingSub = null;
    let magSub = null;
    let cancelled = false;

    (async () => {
      try {
        headingSub = await Location.watchHeadingAsync((data) => {
          if (cancelled) return;
          const raw =
            typeof data.trueHeading === 'number' && data.trueHeading >= 0
              ? data.trueHeading
              : data.magHeading;
          if (typeof raw !== 'number' || Number.isNaN(raw)) return;
          setSensorAvailable(true);
          if (typeof data.accuracy === 'number') setHeadingAccuracy(data.accuracy);
          applySmoothedHeading(raw);
        });
        return;
      } catch {
        // fall through to magnetometer
      }

      const available = await Magnetometer.isAvailableAsync();
      if (cancelled) return;
      if (!available) {
        setSensorAvailable(false);
        return;
      }
      setSensorAvailable(true);
      Magnetometer.setUpdateInterval(50);
      magSub = Magnetometer.addListener(({ x, y }) => {
        applySmoothedHeading(magnetometerToHeading(x, y));
      });
    })();

    return () => {
      cancelled = true;
      headingSub?.remove?.();
      magSub?.remove?.();
    };
  }, [applySmoothedHeading]);

  // Flatness via accelerometer.
  useEffect(() => {
    let sub = null;
    let cancelled = false;

    (async () => {
      const available = await Accelerometer.isAvailableAsync();
      if (cancelled || !available) return;
      Accelerometer.setUpdateInterval(200);
      sub = Accelerometer.addListener(({ x, y, z }) => {
        setPhoneFlat(isPhoneFlat(x, y, z));
      });
    })();

    return () => {
      cancelled = true;
      sub?.remove?.();
    };
  }, []);

  const bearing =
    coords != null ? calculateQiblaBearing(coords.latitude, coords.longitude) : null;
  const aligned =
    bearing != null && heading != null && sensorAvailable
      ? isAligned(bearing, heading, ALIGNMENT_TOLERANCE_DEG)
      : false;
  const needleRotation =
    bearing != null && heading != null && sensorAvailable
      ? qiblaNeedleRotation(bearing, heading)
      : 0;

  const accuracyLow =
    headingAccuracy != null &&
    headingAccuracy >= 0 &&
    headingAccuracy > LOW_ACCURACY_THRESHOLD_DEG;
  const showCalibrationHint = !phoneFlat || accuracyLow;

  // Lock-in haptic (edge only) + glow pulse while aligned.
  useEffect(() => {
    if (aligned && !wasAlignedRef.current) {
      wasAlignedRef.current = true;
      hapticSuccess();
    } else if (!aligned && wasAlignedRef.current) {
      wasAlignedRef.current = false;
    }
  }, [aligned]);

  useEffect(() => {
    if (!aligned) {
      glowOpacity.setValue(1);
      return undefined;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(glowOpacity, {
          toValue: 0.72,
          duration: 700,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(glowOpacity, {
          toValue: 1,
          duration: 700,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [aligned, glowOpacity]);

  const retry = () => {
    hapticLight();
    loadLocation();
  };

  const openSettings = () => {
    hapticLight();
    Linking.openSettings().catch(() => {});
  };

  if (permissionDenied && !coords) {
    return (
      <View style={styles.container}>
        <Text style={styles.status}>
          {t('qibla.permissionNeeded')}
        </Text>
        <View style={styles.buttonCol}>
          <PillButton variant="primary" label={t('common.openSettings')} onPress={openSettings} />
          <PillButton variant="secondary" label={t('common.tryAgain')} onPress={retry} />
        </View>
      </View>
    );
  }

  if (loading && !coords) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={C.accent} />
      </View>
    );
  }

  if (!coords) {
    return (
      <View style={styles.container}>
        <Text style={styles.status}>{t('qibla.locationFailed')}</Text>
        <PillButton variant="secondary" label={t('common.retry')} onPress={retry} />
      </View>
    );
  }

  // No compass: static bearing from North.
  if (!sensorAvailable) {
    return (
      <View style={styles.container}>
        <Text style={styles.bearing}>{Math.round(bearing)}°</Text>
        <Text style={styles.hint}>
          {t('qibla.compassUnavailable', { degrees: Math.round(bearing) })}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {showCalibrationHint ? (
        <View style={styles.zzWrap} accessibilityLabel={t('qibla.calibrationNeeded')}>
          <Text style={styles.zzText}>zZ</Text>
        </View>
      ) : null}

      <View style={styles.dialWrap}>
        <CompassDial
          needleRotation={needleRotation}
          accent={C.accent}
          border={C.border}
          text={C.text}
          gold={C.gold}
          aligned={aligned}
          glowOpacity={glowOpacity}
        />
      </View>

      <Text style={styles.bearing}>{Math.round(bearing)}°</Text>
      <Text style={[styles.hint, aligned && styles.hintAligned]}>
        {aligned ? t('qibla.aligned') : t('qibla.alignHint')}
      </Text>

      {accuracyLow ? (
        <Text style={styles.tip}>{t('qibla.calibrateFigure8')}</Text>
      ) : !phoneFlat ? (
        <Text style={styles.tip}>{t('qibla.layFlat')}</Text>
      ) : heading == null ? (
        <Text style={styles.tip}>{t('qibla.waitingCompass')}</Text>
      ) : null}
    </View>
  );
}
