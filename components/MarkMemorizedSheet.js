import React, { useMemo, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../theme/colors';
import { useSurahList } from '../hooks/useQuranData';
import { light as hapticLight } from '../utils/haptics';
import { buildAlreadyMemorizedPlan } from '../utils/hifz';
import PillButton from './PillButton';

const makeStyles = (C) =>
  StyleSheet.create({
    body: { paddingHorizontal: 16 },
    hint: { fontSize: 13, color: C.textSecondary, marginBottom: 8, lineHeight: 18 },
    list: { maxHeight: 360 },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: C.separatorOnGray,
    },
    rowLabel: { fontSize: 15, color: C.text, fontWeight: '500' },
    rowLabelDisabled: { color: C.textSecondary },
    checkbox: {
      width: 22,
      height: 22,
      borderRadius: 11,
      borderWidth: 1.5,
      borderColor: C.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    checkboxChecked: { backgroundColor: C.accent, borderColor: C.accent },
    saveBtn: { marginTop: 16 },
    loading: { paddingVertical: 40 },
  });

export default function MarkMemorizedSheet({ existingPlans, onSave }) {
  const C = useTheme();
  const styles = useMemo(() => makeStyles(C), [C]);
  const { surahs, loading } = useSurahList();
  const [checked, setChecked] = useState(() => new Set());

  const existingNumbers = useMemo(
    () => new Set(existingPlans.map((p) => p.surahNumber)),
    [existingPlans],
  );

  const toggle = (number) => {
    hapticLight();
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(number)) next.delete(number);
      else next.add(number);
      return next;
    });
  };

  const save = () => {
    const newPlans = surahs
      .filter((s) => checked.has(s.number))
      .map((s) =>
        buildAlreadyMemorizedPlan({
          surahNumber: s.number,
          surahNameEn: s.englishName,
          totalAyahs: s.numberOfAyahs,
        }),
      );
    onSave(newPlans);
  };

  if (loading) {
    return <ActivityIndicator size="large" color={C.accent} style={styles.loading} />;
  }

  return (
    <View style={styles.body}>
      <Text style={styles.hint}>
        Mark the surahs you already know by heart — they'll go straight into "Memorized", no need to redo them.
      </Text>
      <FlatList
        style={styles.list}
        data={surahs}
        keyExtractor={(item) => String(item.number)}
        nestedScrollEnabled
        renderItem={({ item }) => {
          const already = existingNumbers.has(item.number);
          const isChecked = checked.has(item.number);
          return (
            <TouchableOpacity
              style={styles.row}
              activeOpacity={already ? 1 : 0.7}
              disabled={already}
              onPress={() => toggle(item.number)}
            >
              <Text style={[styles.rowLabel, already && styles.rowLabelDisabled]}>
                {item.englishName}{already ? ' · already added' : ''}
              </Text>
              <View style={[styles.checkbox, isChecked && styles.checkboxChecked]}>
                {isChecked ? <Ionicons name="checkmark" size={14} color="#FFFFFF" /> : null}
              </View>
            </TouchableOpacity>
          );
        }}
      />
      <PillButton
        variant="primary"
        label={checked.size > 0 ? `Save (${checked.size})` : 'Save'}
        onPress={save}
        disabled={checked.size === 0}
        style={styles.saveBtn}
      />
    </View>
  );
}
