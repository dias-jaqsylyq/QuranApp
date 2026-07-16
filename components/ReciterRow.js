import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../theme/colors';

const makeStyles = (C) =>
  StyleSheet.create({
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: C.cardBg,
      borderRadius: 14,
      padding: 16,
      borderWidth: 1,
      borderColor: C.border,
    },
    cardSelected: { backgroundColor: C.cardActive, borderColor: C.accent },

    iconWrap: {
      width: 46,
      height: 46,
      borderRadius: 23,
      backgroundColor: C.verseNumBg,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 14,
    },
    iconWrapSelected: { backgroundColor: C.accent },

    info: { flex: 1 },
    name: { fontSize: 16, color: C.text, fontWeight: '600' },
    nameSelected: { color: C.accent },
    arabicName: { fontSize: 18, color: C.arabicText, marginTop: 2 },
    arabicNameSelected: { color: C.arabicActive },
    style: { fontSize: 12, color: C.textSecondary, marginTop: 2 },

    checkWrap: { marginLeft: 8 },
  });

export default function ReciterRow({ reciter, selected, onPress }) {
  const C = useTheme();
  const styles = useMemo(() => makeStyles(C), [C]);

  return (
    <TouchableOpacity
      style={[styles.card, selected && styles.cardSelected]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.iconWrap, selected && styles.iconWrapSelected]}>
        <Ionicons
          name={selected ? 'mic' : 'mic-outline'}
          size={22}
          color={selected ? C.onAccent : C.textSecondary}
        />
      </View>

      <View style={styles.info}>
        <Text style={[styles.name, selected && styles.nameSelected]}>{reciter.name}</Text>
        <Text style={[styles.arabicName, selected && styles.arabicNameSelected]}>
          {reciter.arabicName}
        </Text>
        <Text style={styles.style}>{reciter.style}</Text>
      </View>

      {selected && (
        <View style={styles.checkWrap}>
          <Ionicons name="checkmark-circle" size={24} color={C.accent} />
        </View>
      )}
    </TouchableOpacity>
  );
}
