import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Polygon, Text as SvgText } from 'react-native-svg';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSurahList } from '../hooks/useQuranData';
import { useTheme } from '../theme/colors';
import { light as hapticLight } from '../utils/haptics';
import SectionHeader from '../components/SectionHeader';
import GradientTopicCard from '../components/GradientTopicCard';
import GoalProgressCard from '../components/GoalProgressCard';
import { QUICK_LINKS, TOPICS } from '../data/mockTopics';

const makeStyles = (C) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: C.bg },

    header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
    headerTitle: { fontSize: 34, fontWeight: '700', color: C.text },

    searchBar: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: C.surfaceGray,
      borderRadius: 14,
      marginHorizontal: 16,
      marginTop: 8,
      marginBottom: 8,
      paddingHorizontal: 12,
      gap: 8,
    },
    input: {
      flex: 1,
      height: 44,
      fontSize: 16,
      color: C.text,
    },
    clearBtn: { padding: 4 },

    quickLinkGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      paddingHorizontal: 16,
      marginTop: 8,
      gap: 10,
    },
    quickLinkCell: {
      flexBasis: '47%',
      flexGrow: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: C.surfaceGray,
      borderRadius: 16,
      paddingHorizontal: 14,
      paddingVertical: 14,
    },
    quickLinkLabel: { fontSize: 14, fontWeight: '600', color: C.text },

    topicGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      paddingHorizontal: 16,
      gap: 10,
    },
    topicCell: { flexBasis: '47%', flexGrow: 1 },

    listSectionHeader: { paddingHorizontal: 4 },

    list: { paddingHorizontal: 16, paddingBottom: 120 },

    row: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: C.border,
      gap: 12,
    },
    hexWrap: { flexShrink: 0 },
    rowText: { flex: 1 },
    rowRight: { alignItems: 'flex-end' },

    surahName: { fontSize: 17, fontWeight: '700', color: C.text },
    surahTranslation: { fontSize: 13, color: C.textSecondary, marginTop: 2 },
    rowMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
    verseCount: { fontSize: 12, color: C.verseNum },
    arabicName: { fontSize: 19, color: C.arabicText, fontFamily: 'Amiri_400Regular' },
    badge: {
      marginTop: 4,
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 10,
      alignSelf: 'flex-end',
    },
    badgeText: { fontSize: 10, fontWeight: '600' },

    center: { alignItems: 'center', justifyContent: 'center', gap: 8, paddingTop: 60 },
    emptyText: { fontSize: 16, color: C.textSecondary, textAlign: 'center' },
    emptyHint: { fontSize: 13, color: C.verseNum, textAlign: 'center' },
  });

function HexBadge({ number, accent }) {
  return (
    <Svg width={40} height={40} viewBox="0 0 40 40">
      <Polygon points="20,0 40,10 40,30 20,40 0,30 0,10" fill={accent} />
      <SvgText x="20" y="24" textAnchor="middle" fill="#FFF" fontSize="13" fontWeight="bold">
        {number}
      </SvgText>
    </Svg>
  );
}

export default function SearchScreen({ navigation }) {
  const C = useTheme();
  const styles = useMemo(() => makeStyles(C), [C]);
  const { surahs, loading } = useSurahList();
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    if (!query.trim()) return surahs;
    const q = query.toLowerCase();
    return surahs.filter(
      s =>
        s.englishName.toLowerCase().includes(q) ||
        s.englishNameTranslation.toLowerCase().includes(q) ||
        s.name.includes(query),
    );
  }, [surahs, query]);

  const openSurah = (item) => {
    hapticLight();
    navigation.navigate('Quran', {
      screen: 'SurahReader',
      params: { surahNumber: item.number, surahName: item.name, surahNameEn: item.englishName },
    });
  };

  const comingSoon = () => {
    hapticLight();
    Alert.alert('Coming soon');
  };

  const openQuickLink = (link) => {
    if (link.id === 'plans') {
      hapticLight();
      navigation.navigate('DailyKhatm');
      return;
    }
    if (link.id === 'bookmarks') {
      hapticLight();
      navigation.navigate('Bookmarks');
      return;
    }
    comingSoon();
  };

  const openHifz = () => {
    hapticLight();
    navigation.navigate('Memorize');
  };

  const renderItem = ({ item }) => {
    const isMeccan = item.revelationType === 'Meccan';
    const badgeBg = isMeccan ? C.meccan : C.medinan;
    const badgeColor = isMeccan ? C.meccanText : C.medianText;
    return (
      <TouchableOpacity style={styles.row} activeOpacity={0.7} onPress={() => openSurah(item)}>
        <View style={styles.hexWrap}>
          <HexBadge number={item.number} accent={C.accent} />
        </View>
        <View style={styles.rowText}>
          <Text style={styles.surahName}>{item.englishName}</Text>
          <Text style={styles.surahTranslation}>{item.englishNameTranslation}</Text>
          <View style={styles.rowMeta}>
            <Ionicons name="list-outline" size={12} color={C.accent} />
            <Text style={styles.verseCount}>{item.numberOfAyahs} verses</Text>
          </View>
          {item.revelationType ? (
            <View style={[styles.badge, { backgroundColor: badgeBg }]}>
              <Text style={[styles.badgeText, { color: badgeColor }]}>{item.revelationType}</Text>
            </View>
          ) : null}
        </View>
        <View style={styles.rowRight}>
          <Text style={styles.arabicName}>{item.name}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const ListHeader = (
    <View>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Discover</Text>
      </View>

      <View style={styles.searchBar}>
        <Ionicons name="search" size={18} color={C.textSecondary} />
        <TextInput
          style={styles.input}
          placeholder="Search surahs…"
          placeholderTextColor={C.textSecondary}
          value={query}
          onChangeText={setQuery}
          autoCorrect={false}
          clearButtonMode="never"
          returnKeyType="search"
        />
        {query.length > 0 && (
          <TouchableOpacity style={styles.clearBtn} onPress={() => setQuery('')}>
            <Ionicons name="close-circle" size={18} color={C.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      <GoalProgressCard onPress={openHifz} />

      <View style={styles.quickLinkGrid}>
        {QUICK_LINKS.map((link) => (
          <TouchableOpacity key={link.id} style={styles.quickLinkCell} onPress={() => openQuickLink(link)} activeOpacity={0.7}>
            <Ionicons name={link.icon} size={18} color={C.text} />
            <Text style={styles.quickLinkLabel}>{link.title}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <SectionHeader title="Browse by Topic" />
      <View style={styles.topicGrid}>
        {TOPICS.map((topic) => (
          <View key={topic.id} style={styles.topicCell}>
            <GradientTopicCard title={topic.title} colors={topic.colors} onPress={comingSoon} />
          </View>
        ))}
      </View>

      <View style={styles.listSectionHeader}>
        <SectionHeader title="Surahs" />
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={filtered}
        keyExtractor={item => String(item.number)}
        renderItem={renderItem}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={
          loading ? (
            <View style={styles.center}>
              <ActivityIndicator size="large" color={C.accent} />
            </View>
          ) : (
            <View style={styles.center}>
              <Ionicons name="search-outline" size={48} color={C.border} />
              <Text style={styles.emptyText}>No surahs found</Text>
              <Text style={styles.emptyHint}>Try the English name, meaning, or Arabic</Text>
            </View>
          )
        }
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      />
    </SafeAreaView>
  );
}
