import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Ionicons from '@expo/vector-icons/Ionicons';
import { RECITERS, DEFAULT_RECITER } from '../data/reciters';
import { useTheme } from '../theme/colors';
import { medium } from '../utils/haptics';
import ReciterRow from '../components/ReciterRow';

const STORAGE_KEY = 'selected_reciter';

const makeStyles = (C) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: C.bg },

    header: {
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: C.border,
    },
    headerTopRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    backBtn: { padding: 4, marginLeft: -8 },
    headerTitle: { fontSize: 26, color: C.text, fontWeight: '700' },
    headerSub: { fontSize: 13, color: C.textSecondary, marginTop: 4 },

    list: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 20 },
    separator: { height: 8 },

    footer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 16,
      borderTopWidth: 1,
      borderTopColor: C.border,
      paddingHorizontal: 20,
    },
    footerText: { color: C.textSecondary, fontSize: 12, flex: 1 },
  });

export default function ReciterScreen({ navigation }) {
  const C = useTheme();
  const styles = useMemo(() => makeStyles(C), [C]);

  const [selectedId, setSelectedId] = useState(DEFAULT_RECITER.id);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(id => {
      if (id) setSelectedId(id);
    });
  }, []);

  const selectReciter = async (reciter) => {
    medium();
    setSelectedId(reciter.id);
    await AsyncStorage.setItem(STORAGE_KEY, reciter.id);
  };

  const renderReciter = ({ item }) => (
    <ReciterRow reciter={item} selected={item.id === selectedId} onPress={() => selectReciter(item)} />
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle={C.statusBarStyle === 'dark' ? 'dark-content' : 'light-content'}
        backgroundColor={C.bg}
      />

      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity style={styles.backBtn} onPress={() => { medium(); navigation.goBack(); }}>
            <Ionicons name="chevron-back" size={24} color={C.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Reciters</Text>
        </View>
        <Text style={styles.headerSub}>Choose your preferred reciter</Text>
      </View>

      <FlatList
        data={RECITERS}
        keyExtractor={item => item.id}
        renderItem={renderReciter}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />

      <View style={styles.footer}>
        <Ionicons name="information-circle-outline" size={14} color={C.textSecondary} />
        <Text style={styles.footerText}>
          Selection applies when you next open a surah
        </Text>
      </View>
    </SafeAreaView>
  );
}
