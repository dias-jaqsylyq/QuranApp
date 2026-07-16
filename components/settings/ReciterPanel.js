import React from 'react';
import { View, StyleSheet } from 'react-native';
import { RECITERS } from '../../data/reciters';
import ReciterRow from '../ReciterRow';

const styles = StyleSheet.create({
  list: { paddingHorizontal: 16, paddingTop: 8, gap: 8 },
});

export default function ReciterPanel({ selectedReciterId, onSelectReciter }) {
  return (
    <View style={styles.list}>
      {RECITERS.map((reciter) => (
        <View key={reciter.id}>
          <ReciterRow
            reciter={reciter}
            selected={reciter.id === selectedReciterId}
            onPress={() => onSelectReciter(reciter)}
          />
        </View>
      ))}
    </View>
  );
}
