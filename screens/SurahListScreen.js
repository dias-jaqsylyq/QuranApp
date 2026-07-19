import React, { useRef, useMemo, useState, useCallback } from 'react';
import {
  View,
  Text,
  SectionList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { light } from '../utils/haptics';
import { useSurahList } from '../hooks/useQuranData';
import { useQuranPageIndex } from '../hooks/useQuranPageIndex';
import { useTheme } from '../theme/colors';
import { useI18n } from '../hooks/useI18n';
import SectionHeader from '../components/SectionHeader';

const SURAH_JUZ = [
  0,
  1,  1,  3,  4,  6,  7,  8,  9, 10, 11,
  11, 12, 13, 13, 14, 14, 15, 15, 16, 16,
  17, 17, 18, 18, 18, 19, 19, 20, 20, 21,
  21, 21, 21, 22, 22, 22, 23, 23, 23, 24,
  24, 25, 25, 25, 25, 26, 26, 26, 26, 26,
  26, 27, 27, 27, 27, 27, 27, 28, 28, 28,
  28, 28, 28, 28, 28, 28, 29, 29, 29, 29,
  29, 29, 29, 29, 29, 29, 29, 30, 30, 30,
  30, 30, 30, 30, 30, 30, 30, 30, 30, 30,
  30, 30, 30, 30, 30, 30, 30, 30, 30, 30,
  30, 30, 30, 30, 30, 30, 30, 30, 30, 30,
  30, 30, 30, 30,
];

const JUZ_TOTAL = 30;

function buildSections(surahs) {
  const map = {};
  for (const s of surahs) {
    const juz = SURAH_JUZ[s.number] ?? 1;
    if (!map[juz]) map[juz] = [];
    map[juz].push(s);
  }
  return Array.from({ length: JUZ_TOTAL }, (_, i) => {
    const juz = i + 1;
    return { title: `Juz ${juz}`, juz, data: map[juz] ?? [] };
  }).filter(s => s.data.length > 0);
}

const makeStyles = (C) =>
  StyleSheet.create({
    outer: { flex: 1, backgroundColor: C.bg },
    sheet: { flex: 1, backgroundColor: C.bg },

    // Hero — same gradient + eyebrow + Arabic treatment as Home's Ayah-of-the-Day card
    heroCard: {
      marginHorizontal: 20,
      marginTop: 16,
      borderRadius: 24,
      padding: 20,
      overflow: 'hidden',
    },
    heroLabel: {
      fontSize: 13,
      fontWeight: '700',
      color: C.gold,
      letterSpacing: 0.5,
      textTransform: 'uppercase',
    },
    heroTitle: { fontSize: 17, fontWeight: '700', color: '#FFFFFF', marginTop: 6 },
    heroArabic: {
      fontSize: 28,
      color: '#FFFFFF',
      fontFamily: 'Amiri_700Bold',
      textAlign: 'right',
      marginTop: 16,
    },
    heroSubtitle: {
      fontSize: 14,
      color: 'rgba(255,255,255,0.75)',
      lineHeight: 21,
      marginTop: 12,
    },

    // Continue Reading — folded into the same surfaceGray card family as the surah rows
    resumeCard: {
      marginHorizontal: 16,
      marginTop: 16,
      marginBottom: 6,
      backgroundColor: C.surfaceGray,
      borderRadius: 20,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 14,
      paddingVertical: 12,
      gap: 10,
    },
    resumeIcon: {
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor: C.accent,
      alignItems: 'center',
      justifyContent: 'center',
    },
    resumeTextWrap: { flex: 1 },
    resumeLabel: { fontSize: 11, fontWeight: '700', color: C.accent, textTransform: 'uppercase', letterSpacing: 0.5 },
    resumeSurah: { fontSize: 14, fontWeight: '600', color: C.text, marginTop: 1 },
    resumeVerse: { fontSize: 12, color: C.textSecondary, marginTop: 1 },

    center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    errorTxt: { color: C.error, fontSize: 14, textAlign: 'center', paddingHorizontal: 32 },

    contentArea: { flex: 1, flexDirection: 'row' },
    list: { flex: 1 },
    listContent: { paddingBottom: 120 },

    row: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: C.surfaceGray,
      borderRadius: 20,
      marginHorizontal: 16,
      marginBottom: 10,
      paddingHorizontal: 16,
      paddingVertical: 14,
      gap: 12,
    },
    numberBadge: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: C.accent,
      alignItems: 'center',
      justifyContent: 'center',
    },
    numberText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
    rowText: { flex: 1 },
    rowRight: { alignItems: 'flex-end' },
    surahName: { fontSize: 17, fontWeight: '700', color: C.text },
    surahEnglish: { fontSize: 13, color: C.textSecondary, marginTop: 2 },
    rowMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
    verseCount: { fontSize: 12, color: C.verseNum },
    arabicName: { fontSize: 22, color: C.arabicText, fontFamily: 'Amiri_700Bold' },
    badge: {
      marginTop: 5,
      paddingHorizontal: 7,
      paddingVertical: 2,
      borderRadius: 10,
      alignSelf: 'flex-end',
    },
    badgeText: { fontSize: 10, fontWeight: '600' },

    indexStrip: {
      width: 24,
      paddingVertical: 8,
      alignItems: 'center',
      justifyContent: 'space-evenly',
    },
    indexNum: { fontSize: 10, fontWeight: '600', color: C.verseNum },
    indexDim: { color: C.border },
  });

export default function SurahListScreen({ navigation }) {
  const C = useTheme();
  const styles = useMemo(() => makeStyles(C), [C]);
  const { t } = useI18n();
  const listRef = useRef(null);
  const { surahs, loading, error } = useSurahList();
  const { index: pageIndex } = useQuranPageIndex();
  const [lastRead, setLastRead] = useState(null);
  const [readingMode, setReadingMode] = useState('surah');

  useFocusEffect(
    useCallback(() => {
      AsyncStorage.getItem('last_read').then(raw => {
        setLastRead(raw ? JSON.parse(raw) : null);
      });
      AsyncStorage.getItem('reading_mode').then(v => {
        setReadingMode(v === 'page' || v === 'mushaf' ? v : 'surah');
      });
    }, []),
  );

  const openSurah = (item) => {
    light();
    // Page and Mushaf both read from page data — Mushaf is just a rendering
    // style over it (see SurahReaderScreen's selectReadingMode) — so both
    // navigate by page number the same way.
    const startPage = readingMode !== 'surah' ? pageIndex?.surahStartPage?.[item.number] : null;
    if (startPage) {
      navigation.navigate('SurahReader', { pageNumber: startPage, scrollToSurah: item.number });
    } else {
      navigation.navigate('SurahReader', {
        surahNumber: item.number,
        surahName: item.name,
        surahNameEn: item.englishName,
      });
    }
  };

  const sections = useMemo(() => buildSections(surahs), [surahs]);
  const activeJuz = useMemo(() => new Set(sections.map(s => s.juz)), [sections]);

  const scrollToJuz = (juz) => {
    if (!activeJuz.has(juz) || !listRef.current) return;
    const sectionIndex = sections.findIndex(s => s.juz === juz);
    if (sectionIndex < 0) return;
    try {
      listRef.current.scrollToLocation({ sectionIndex, itemIndex: 0, animated: true, viewPosition: 0 });
    } catch (_) {}
  };

  const renderSectionHeader = ({ section }) => (
    <SectionHeader title={t('common.juzN', { n: section.juz })} />
  );

  const renderItem = ({ item }) => {
    const isMeccan = item.revelationType === 'Meccan';
    const badgeBg    = isMeccan ? C.meccan   : C.medinan;
    const badgeColor = isMeccan ? C.meccanText : C.medianText;
    const revelationLabel = isMeccan ? t('quran.meccan') : t('quran.medinan');

    return (
      <TouchableOpacity
        style={styles.row}
        activeOpacity={0.7}
        onPress={() => openSurah(item)}
      >
        <View style={styles.numberBadge}>
          <Text style={styles.numberText}>{item.number}</Text>
        </View>
        <View style={styles.rowText}>
          <Text style={styles.surahName}>{item.englishName}</Text>
          <Text style={styles.surahEnglish}>{item.englishNameTranslation}</Text>
          <View style={styles.rowMeta}>
            <Ionicons name="list-outline" size={12} color={C.accent} />
            <Text style={styles.verseCount}>{item.numberOfAyahs} {t('common.verses')}</Text>
          </View>
          {item.revelationType ? (
            <View style={[styles.badge, { backgroundColor: badgeBg }]}>
              <Text style={[styles.badgeText, { color: badgeColor }]}>{revelationLabel}</Text>
            </View>
          ) : null}
        </View>
        <View style={styles.rowRight}>
          <Text style={styles.arabicName}>{item.name}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.outer}>
      <View style={styles.sheet}>
        <LinearGradient colors={['#0D1B2A', '#1A3A2A']} style={styles.heroCard}>
          <Text style={styles.heroLabel}>{t('quran.heroLabel')}</Text>
          <Text style={styles.heroTitle}>{t('quran.heroTitle')}</Text>
          <Text style={styles.heroArabic}>القرآن الكريم</Text>
          <Text style={styles.heroSubtitle}>{t('quran.heroSubtitle')}</Text>
        </LinearGradient>

        {lastRead && (
          <TouchableOpacity
            style={styles.resumeCard}
            activeOpacity={0.8}
            onPress={() => {
              light();
              navigation.navigate('SurahReader', {
                surahNumber: lastRead.surahNumber,
                surahName:   lastRead.surahName,
                surahNameEn: lastRead.surahNameEn,
                initialVerseIndex: lastRead.verseIndex,
              });
            }}
          >
            <View style={styles.resumeIcon}>
              <Ionicons name="play" size={16} color="#FFFFFF" />
            </View>
            <View style={styles.resumeTextWrap}>
              <Text style={styles.resumeLabel}>{t('quran.continueReading')}</Text>
              <Text style={styles.resumeSurah}>{lastRead.surahNameEn}</Text>
              <Text style={styles.resumeVerse}>{t('common.verseN', { n: lastRead.verseIndex + 1 })}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={C.accent} />
          </TouchableOpacity>
        )}

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={C.accent} />
          </View>
        ) : error ? (
          <View style={styles.center}>
            <Text style={styles.errorTxt}>{t('common.failedToLoad')}</Text>
          </View>
        ) : (
          <View style={styles.contentArea}>
            <SectionList
              ref={listRef}
              style={styles.list}
              sections={sections}
              keyExtractor={item => String(item.number)}
              renderItem={renderItem}
              renderSectionHeader={renderSectionHeader}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              stickySectionHeadersEnabled={false}
            />

            <View style={styles.indexStrip}>
              {Array.from({ length: JUZ_TOTAL }, (_, i) => {
                const juz = i + 1;
                const active = activeJuz.has(juz);
                return (
                  <TouchableOpacity
                    key={juz}
                    onPress={() => scrollToJuz(juz)}
                    hitSlop={{ left: 8, right: 8 }}
                    disabled={!active}
                  >
                    <Text style={[styles.indexNum, !active && styles.indexDim]}>{juz}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}
