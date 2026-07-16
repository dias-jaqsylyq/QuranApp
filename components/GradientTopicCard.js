import React from 'react';
import { Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { light as hapticLight } from '../utils/haptics';

const styles = StyleSheet.create({
  card: {
    flex: 1,
    aspectRatio: 0.85,
    borderRadius: 20,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    padding: 14,
  },
  title: { fontSize: 17, fontWeight: '700', color: '#FFFFFF' },
});

export default function GradientTopicCard({ title, colors, onPress, style }) {
  const handlePress = () => {
    hapticLight();
    onPress?.();
  };

  return (
    <TouchableOpacity style={[{ flex: 1 }, style]} onPress={handlePress} activeOpacity={0.8}>
      <LinearGradient colors={colors} style={styles.card}>
        <Text style={styles.title}>{title}</Text>
      </LinearGradient>
    </TouchableOpacity>
  );
}
