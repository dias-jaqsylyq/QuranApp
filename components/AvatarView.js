import React, { useMemo } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../theme/colors';
import { light as hapticLight } from '../utils/haptics';

const makeStyles = (C, size) =>
  StyleSheet.create({
    wrap: { width: size, height: size },
    ring: {
      width: size,
      height: size,
      borderRadius: size / 2,
      backgroundColor: C.surfaceGraySecondary,
      borderWidth: 2,
      borderColor: C.border,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
    },
    image: { width: '100%', height: '100%' },
    initial: { fontSize: size * 0.4, fontWeight: '700', color: C.text },
    cameraBadge: {
      position: 'absolute',
      bottom: -2,
      right: -2,
      width: size * 0.34,
      height: size * 0.34,
      borderRadius: (size * 0.34) / 2,
      backgroundColor: C.primaryButtonBg,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: C.bg,
    },
  });

export default function AvatarView({ initial, size = 64, imageUri, showCameraBadge = false, onCameraPress }) {
  const C = useTheme();
  const styles = useMemo(() => makeStyles(C, size), [C, size]);

  const handleCameraPress = () => {
    hapticLight();
    onCameraPress?.();
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.ring}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.image} />
        ) : (
          <Text style={styles.initial}>{initial}</Text>
        )}
      </View>
      {showCameraBadge ? (
        <TouchableOpacity style={styles.cameraBadge} onPress={handleCameraPress} activeOpacity={0.7}>
          <Ionicons name="camera" size={size * 0.18} color={C.primaryButtonText} />
        </TouchableOpacity>
      ) : null}
    </View>
  );
}
