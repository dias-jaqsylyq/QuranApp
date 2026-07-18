import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  SectionList,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../theme/colors';
import { light as hapticLight, medium as hapticMedium } from '../utils/haptics';
import { loadBookmarks, saveBookmarks } from '../utils/bookmarks';

function buildSections(bookmarks) {
  const map = {};
  for (const b of bookmarks) {
    const key = b.surahNumber;
    if (!map[key]) {
      map[key] = { surahNumber: b.surahNumber, surahName: b.surahName, surahNameEn: b.surahNameEn, data: [] };
    }
    map[key].data.push(b);
  }
  return Object.values(map).sort((a, b) => a.surahNumber - b.surahNumber);
}

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
    headerTitle: { fontSize: 28, fontWeight: '700', color: C.text },
    headerSub: { fontSize: 13, color: C.textSecondary, marginTop: 4 },

    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingTop: 20,
      paddingBottom: 6,
      gap: 8,
    },
    sectionTitle: { fontSize: 13, fontWeight: '700', color: C.accent },
    sectionArabic: { fontSize: 16, color: C.arabicText, fontFamily: 'Amiri_400Regular' },

    card: {
      marginHorizontal: 16,
      marginBottom: 8,
      backgroundColor: C.cardBg,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: C.border,
      padding: 14,
    },
    cardRef: { fontSize: 12, fontWeight: '600', color: C.accent, marginBottom: 6 },
    cardArabic: {
      fontSize: 20,
      color: C.arabicText,
      textAlign: 'right',
      lineHeight: 36,
      fontFamily: 'Amiri_400Regular',
      marginBottom: 6,
    },
    cardTranslation: { fontSize: 13, color: C.textSecondary, lineHeight: 19 },
    cardFooter: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 8,
    },
    cardLang: { fontSize: 11, color: C.verseNum, fontWeight: '600', textTransform: 'uppercase' },

    center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
    emptyTitle: { fontSize: 18, fontWeight: '700', color: C.text },
    emptyHint: { fontSize: 14, color: C.textSecondary, textAlign: 'center', paddingHorizontal: 40 },

    listContent: { paddingBottom: 120, paddingTop: 8 },
  });

export default function BookmarksScreen({ navigation }) {
  const C = useTheme();
  const styles = useMemo(() => makeStyles(C), [C]);
  const [bookmarks, setBookmarks] = useState([]);

  useFocusEffect(
    useCallback(() => {
      loadBookmarks().then(setBookmarks);
    }, []),
  );

  const deleteBookmark = (id) => {
    Alert.alert('Remove Bookmark', 'Remove this verse from bookmarks?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          hapticMedium();
          const next = bookmarks.filter(b => b.id !== id);
          setBookmarks(next);
          await saveBookmarks(next);
        },
      },
    ]);
  };

  const openVerse = (b) => {
    hapticLight();
    navigation.navigate('Quran', {
      screen: 'SurahReader',
      params: {
        surahNumber: b.surahNumber,
        surahName: b.surahName,
        surahNameEn: b.surahNameEn,
        initialVerseIndex: b.verseNumber - 1,
      },
    });
  };

  const sections = useMemo(() => buildSections(bookmarks), [bookmarks]);

  const renderSectionHeader = ({ section }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{section.surahNameEn}</Text>
      <Text style={styles.sectionArabic}>{section.surahName}</Text>
    </View>
  );

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.75}
      onPress={() => openVerse(item)}
      onLongPress={() => deleteBookmark(item.id)}
    >
      <Text style={styles.cardRef}>
        {item.surahNumber}:{item.verseNumber}
      </Text>
      <Text style={styles.cardArabic} numberOfLines={3}>
        {item.arabicText}
      </Text>
      {item.translation ? (
        <Text style={styles.cardTranslation} numberOfLines={3}>
          {item.translation}
        </Text>
      ) : null}
      <View style={styles.cardFooter}>
        <Text style={styles.cardLang}>{item.lang}</Text>
        <Ionicons name="chevron-forward" size={14} color={C.verseNum} />
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Bookmarks</Text>
        {bookmarks.length > 0 && (
          <Text style={styles.headerSub}>{bookmarks.length} saved verse{bookmarks.length !== 1 ? 's' : ''}</Text>
        )}
      </View>

      {bookmarks.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="bookmark-outline" size={56} color={C.border} />
          <Text style={styles.emptyTitle}>No bookmarks yet</Text>
          <Text style={styles.emptyHint}>
            Long-press any verse while reading to save it here
          </Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          renderSectionHeader={renderSectionHeader}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          stickySectionHeadersEnabled={false}
        />
      )}
    </SafeAreaView>
  );
}
