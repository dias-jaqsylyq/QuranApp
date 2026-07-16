import React, { useMemo, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../theme/colors';
import { light as hapticLight, medium as hapticMedium } from '../utils/haptics';
import PillButton from './PillButton';

const makeStyles = (C) =>
  StyleSheet.create({
    body: { paddingHorizontal: 16, paddingBottom: 8 },
    hint: { fontSize: 13, color: C.textSecondary, lineHeight: 19, marginBottom: 16 },

    addRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
    input: {
      flex: 1,
      backgroundColor: C.surfaceGray,
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 15,
      color: C.text,
    },

    row: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 14,
      backgroundColor: C.surfaceGray,
      borderRadius: 14,
      marginBottom: 8,
      gap: 10,
    },
    rowIcon: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: C.surfaceGraySecondary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    rowName: { flex: 1, fontSize: 15, color: C.text, fontWeight: '500' },

    empty: { alignItems: 'center', paddingVertical: 24, gap: 8 },
    emptyText: { fontSize: 14, color: C.textSecondary, textAlign: 'center' },
  });

export default function ReadingCircleSheet({ circle, onAdd, onRemove }) {
  const C = useTheme();
  const styles = useMemo(() => makeStyles(C), [C]);
  const [name, setName] = useState('');

  const submit = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    hapticMedium();
    onAdd(trimmed);
    setName('');
  };

  return (
    <View style={styles.body}>
      <Text style={styles.hint}>
        A personal local list — just names you keep for yourself, like reading buddies or an
        accountability circle. There are no real accounts behind this and nothing is shared or
        synced anywhere.
      </Text>

      <View style={styles.addRow}>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Add a name…"
          placeholderTextColor={C.textSecondary}
          returnKeyType="done"
          onSubmitEditing={submit}
        />
        <PillButton variant="primary" label="Add" onPress={submit} disabled={!name.trim()} />
      </View>

      {circle.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="people-outline" size={36} color={C.border} />
          <Text style={styles.emptyText}>Your circle is empty — add a name above</Text>
        </View>
      ) : (
        circle.map((entry) => (
          <View key={entry.id} style={styles.row}>
            <View style={styles.rowIcon}>
              <Ionicons name="person-outline" size={16} color={C.textSecondary} />
            </View>
            <Text style={styles.rowName}>{entry.name}</Text>
            <TouchableOpacity onPress={() => { hapticLight(); onRemove(entry.id); }}>
              <Ionicons name="close-circle" size={20} color={C.textSecondary} />
            </TouchableOpacity>
          </View>
        ))
      )}
    </View>
  );
}
