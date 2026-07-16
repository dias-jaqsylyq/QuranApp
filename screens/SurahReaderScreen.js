import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  ScrollView,
  TouchableOpacity,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  StatusBar,
  Modal,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { createAudioPlayer, useAudioPlayerStatus, setAudioModeAsync } from 'expo-audio';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Ionicons from '@expo/vector-icons/Ionicons';
import Svg, { Polygon, Rect, Circle } from 'react-native-svg';
import { useSurah, useQuranPage } from '../hooks/useQuranData';
import { TOTAL_PAGES } from '../utils/quranMeta';
import { RECITERS, DEFAULT_RECITER } from '../data/reciters';
import { TRANSLATION_OPTIONS } from '../data/translations';
import { useTheme, THEME_OPTIONS } from '../theme/colors';
import { useSettings } from '../context/AppContext';
import { light, medium, success } from '../utils/haptics';
import { stripTajweed, simplifyTranslit } from '../utils/quranText';
import Sheet, { CLOSE_DURATION } from '../components/settings/Sheet';
import BismillahBanner from '../components/BismillahBanner';
import SurahDivider from '../components/SurahDivider';
import MushafPage from '../components/MushafPage';
import ReaderSettingsPanel from '../components/settings/ReaderSettingsPanel';
import ArabicFontPanel from '../components/settings/ArabicFontPanel';
import TranscriptionPanel from '../components/settings/TranscriptionPanel';
import TranslationPanel from '../components/settings/TranslationPanel';
import ReciterPanel from '../components/settings/ReciterPanel';
import ColorThemePanel from '../components/settings/ColorThemePanel';
import PillButton from '../components/PillButton';
import Stepper from '../components/Stepper';
import { recordActiveToday, recordSurahFinished } from '../utils/profileStats';

// ─── Constants ───────────────────────────────────────────────────────────────

const FONT_SCALE = { small: 0.85, medium: 1.0, large: 1.2 };

const HERO_GRADIENT = ['#0D1B2A', '#1A3A2A'];

const SUB_PANELS = {
  arabicFont: { title: 'Arabic Font' },
  transcription: { title: 'Transcription' },
  translation: { title: 'Translation' },
  reciter: { title: 'Reciter / Voice' },
  colorTheme: { title: 'Color Theme' },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatSecs(secs) {
  if (!secs || secs < 0) return '0:00';
  const s = Math.floor(secs);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

// Shared ayah-list builder for both modes — only how surah identity is
// resolved per ayah differs (constant for a single surah, per-ayah for a page).
function mapAyahs(sourceData, getMeta) {
  return sourceData[0].ayahs.map((ayah, i) => ({
    ...getMeta(ayah),
    number: ayah.numberInSurah,
    arabicText: stripTajweed(ayah.text),
    transliteration: sourceData[1]?.ayahs[i]?.text ?? '',
    en: sourceData[2]?.ayahs[i]?.text ?? '',
    ru: sourceData[3]?.ayahs[i]?.text ?? '',
    kz: sourceData[4]?.ayahs[i]?.text ?? '',
    page: ayah.page,
    juz: ayah.juz,
    hizb: Math.ceil((ayah.hizbQuarter ?? 1) / 2),
  }));
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function OrnamentLine({ C }) {
  return (
    <Svg height={20} viewBox="0 0 300 20" preserveAspectRatio="none" style={{ width: '100%' }}>
      <Rect x={0} y={9} width={300} height={1} fill={C.gold} opacity={0.5} />
      <Polygon points="150,3 157,10 150,17 143,10" fill={C.gold} />
      <Polygon points="75,6 80,10 75,14 70,10"     fill={C.gold} opacity={0.7} />
      <Polygon points="225,6 230,10 225,14 220,10"  fill={C.gold} opacity={0.7} />
      <Circle cx={37}  cy={10} r={2} fill={C.gold} opacity={0.4} />
      <Circle cx={113} cy={10} r={2} fill={C.gold} opacity={0.4} />
      <Circle cx={187} cy={10} r={2} fill={C.gold} opacity={0.4} />
      <Circle cx={263} cy={10} r={2} fill={C.gold} opacity={0.4} />
    </Svg>
  );
}

function SurahHeaderBanner({ styles, C, surahName, surahNameEn, surahNumber, verseCount }) {
  return (
    <LinearGradient colors={HERO_GRADIENT} style={styles.heroCard}>
      <OrnamentLine C={C} />
      <Text style={styles.heroLabel}>{`Surah ${surahNumber}`}</Text>
      <Text style={styles.heroTitle}>{surahNameEn}</Text>
      <Text style={styles.heroArabic}>{surahName}</Text>
      {verseCount ? (
        <Text style={styles.heroSubtitle}>{`Surah ${surahNumber} · ${verseCount} verses`}</Text>
      ) : null}
      <View style={styles.heroOrnamentBottom}>
        <OrnamentLine C={C} />
      </View>
    </LinearGradient>
  );
}

function PageMetaRow({ styles, page, juz, hizb }) {
  return (
    <Text style={styles.pageMetaText}>{`${page} page · Juz ${juz} · Hizb ${hizb}`}</Text>
  );
}

function PageHeaderTitle({ styles, C, pageNumber, juz, onPress }) {
  return (
    <TouchableOpacity style={styles.pageHeaderBtn} onPress={onPress} activeOpacity={0.7}>
      <Text style={styles.pageHeaderTitle}>{`Page ${pageNumber}`}</Text>
      {juz ? <Text style={styles.pageHeaderSub}>{`· Juz ${juz}`}</Text> : null}
      <Ionicons name="chevron-down" size={14} color={C.textSecondary} />
    </TouchableOpacity>
  );
}

function PageNavRow({ styles, C, pageNumber, totalPages, loading, onPrev, onNext }) {
  const atStart = pageNumber <= 1;
  const atEnd = pageNumber >= totalPages;
  return (
    <View style={styles.pageNavRow}>
      <TouchableOpacity
        style={[styles.pageNavBtn, (atStart || loading) && styles.pageNavBtnDisabled]}
        onPress={onPrev}
        disabled={atStart || loading}
        activeOpacity={0.7}
      >
        <Ionicons name="chevron-back" size={16} color={C.text} />
        <Text style={styles.pageNavText}>{atStart ? 'Previous' : `Page ${pageNumber - 1}`}</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.pageNavBtn, (atEnd || loading) && styles.pageNavBtnDisabled]}
        onPress={onNext}
        disabled={atEnd || loading}
        activeOpacity={0.7}
      >
        <Text style={styles.pageNavText}>{atEnd ? 'Next' : `Page ${pageNumber + 1}`}</Text>
        <Ionicons name="chevron-forward" size={16} color={C.text} />
      </TouchableOpacity>
    </View>
  );
}

// ─── Dynamic styles ───────────────────────────────────────────────────────────

const makeStyles = (C, scale) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: C.bg },

    // Hero — surah title card, same gradient/eyebrow language as Home + the Quran tab
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
      marginTop: 10,
    },
    heroTitle: { fontSize: 17, fontWeight: '700', color: '#FFFFFF', marginTop: 6 },
    heroArabic: {
      fontSize: 32,
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
    heroOrnamentBottom: { marginTop: 16 },

    // Page meta — plain caption, no card (too light to deserve one)
    pageMetaText: {
      textAlign: 'center',
      fontSize: 12,
      color: C.textSecondary,
      fontWeight: '500',
      marginTop: 14,
      marginBottom: 6,
    },

    verseList: { paddingBottom: 32 },

    verseRow: {
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: C.border,
      borderLeftWidth: 3,
      borderLeftColor: 'transparent',
    },
    verseRowActive: {
      borderLeftColor: C.accent,
    },

    verseHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    verseNumText: {
      fontSize: 12,
      fontWeight: '600',
      color: C.textSecondary,
      includeFontPadding: false,
    },
    verseNumTextActive: { color: C.accent, fontWeight: '700' },

    verseDivider: {
      width: 20,
      height: 1.5,
      backgroundColor: C.border,
      marginVertical: 8,
    },

    bookmarkFlash: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: C.accent,
      borderRadius: 12,
      paddingHorizontal: 8,
      paddingVertical: 3,
    },
    bookmarkFlashText: { color: '#FFFFFF', fontSize: 11, fontWeight: '700' },

    arabicText: {
      fontSize: Math.round(26 * scale),
      lineHeight: Math.round(50 * scale),
      textAlign: 'right',
      writingDirection: 'rtl',
      color: C.arabicText,
      fontFamily: 'Amiri_400Regular',
    },

    transliterationText: {
      fontSize: Math.round(13 * scale),
      fontStyle: 'italic',
      color: C.textSecondary,
      lineHeight: Math.round(20 * scale),
      marginTop: 10,
    },
    translationText: {
      fontSize: Math.round(15 * scale),
      color: C.text,
      lineHeight: Math.round(23 * scale),
      marginTop: 6,
    },

    // Page-mode header title (tappable to open the page picker)
    pageHeaderBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    pageHeaderTitle: { fontSize: 17, fontWeight: '700', color: C.gold },
    pageHeaderSub: { fontSize: 13, fontWeight: '600', color: C.textSecondary },

    // Prev/Next page footer
    pageNavRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4 },
    pageNavBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      backgroundColor: C.surfaceGray,
      borderRadius: 14,
      paddingVertical: 14,
    },
    pageNavBtnDisabled: { opacity: 0.4 },
    pageNavText: { fontSize: 14, fontWeight: '600', color: C.text },

    // "Go to Page" sheet
    pagePickerBody: { paddingBottom: 8 },
    pagePickerCta: { marginHorizontal: 16, marginTop: 10 },

    center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    loadingTxt: { color: C.textSecondary, marginTop: 12, fontSize: 14 },
    errorTxt: { color: C.error, fontSize: 14, textAlign: 'center', paddingHorizontal: 32 },

    player: {
      backgroundColor: C.playerBg,
      borderTopWidth: 1,
      borderTopColor: C.border,
      paddingTop: 8,
      paddingBottom: 12,
      paddingHorizontal: 20,
    },
    playerInfo: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
    playerVerse: { color: C.text, fontSize: 13, fontWeight: '600' },
    playerTime: { color: C.textSecondary, fontSize: 12 },

    playerError: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
    playerErrorTxt: { color: C.error, fontSize: 12, flex: 1 },
    playerErrorRetry: { color: C.gold, fontSize: 12, fontWeight: '700', marginLeft: 12 },

    progressTrack: {
      height: 3,
      backgroundColor: C.border,
      borderRadius: 2,
      marginBottom: 8,
      overflow: 'hidden',
    },
    progressFill: { height: '100%', backgroundColor: C.accent, borderRadius: 2 },

    playerControls: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 24,
    },
    controlBtn: { padding: 8 },
    playBtn: {
      width: 52,
      height: 52,
      borderRadius: 26,
      backgroundColor: C.accent,
      alignItems: 'center',
      justifyContent: 'center',
    },

    // Floating settings affordance — hidden until the reading area is tapped
    gearBtn: {
      position: 'absolute',
      right: 20,
      width: 50,
      height: 50,
      borderRadius: 25,
      backgroundColor: C.surfaceGray,
      borderWidth: 1,
      borderColor: C.border,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 4,
    },
  });

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function SurahReaderScreen({ route, navigation }) {
  const C = useTheme();
  const insets = useSafeAreaInsets();
  const { fontSize, setFontSize, defaultLang, setDefaultLang, colorMode, setColorMode, showAudioProgress } = useSettings();
  const scale = FONT_SCALE[fontSize] ?? 1.0;
  const styles = useMemo(() => makeStyles(C, scale), [C, scale]);

  const params = route.params ?? {};

  // `view` is what's actually being displayed right now; it's seeded from
  // navigation params but can change in-place (page Prev/Next, or switching
  // Surah/Page mode mid-screen via Settings) without a fresh navigation.
  const [view, setView] = useState(() =>
    params.pageNumber != null
      ? { mode: 'page', pageNumber: params.pageNumber }
      : { mode: 'surah', surahNumber: params.surahNumber, surahName: params.surahName, surahNameEn: params.surahNameEn },
  );
  // Where to land once the next data load resolves — a plain index (Bookmarks/
  // Search/Khatm deep-links) or a surah+ayah to locate within a page's mixed list
  // (SurahList's "open this surah's actual page" / mode-switch anchor carryover).
  const [pendingAnchor, setPendingAnchor] = useState(() => {
    if (params.initialVerseIndex != null) return { type: 'index', index: params.initialVerseIndex };
    if (params.pageNumber != null && params.scrollToSurah != null) {
      return { type: 'surahAyah', surahNumber: params.scrollToSurah, number: 1 };
    }
    return null;
  });

  const { data: surahData, loading: surahLoading, error: surahError } = useSurah(view.mode === 'surah' ? view.surahNumber : null);
  const { data: pageData, loading: pageLoading, error: pageError } = useQuranPage(view.mode === 'page' ? view.pageNumber : null);

  const loading = view.mode === 'surah' ? surahLoading : pageLoading;
  const error = view.mode === 'surah' ? surahError : pageError;

  const [translitStyle, setTranslitStyleState] = useState('standard');
  const [selectedReciterId, setSelectedReciterId] = useState(DEFAULT_RECITER.id);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [audioError, setAudioError] = useState(null);
  const [flashedVerseId, setFlashedVerseId] = useState(null);
  const flashTimeoutRef = useRef(null);

  // Reading-area chrome: hidden by default, revealed by tapping the page
  const [controlsVisible, setControlsVisible] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [activeSubPanel, setActiveSubPanel] = useState(null);
  // A single native Modal hosts both sheet layers (main panel + sub-panel);
  // stays mounted slightly past settingsOpen=false so Sheet's own close
  // animation can finish before the Modal itself is torn down.
  const [settingsModalMounted, setSettingsModalMounted] = useState(false);
  const [readingMode, setReadingMode] = useState(view.mode);
  const [showArabic, setShowArabic] = useState(true);
  const [showTranslation, setShowTranslation] = useState(true);
  const [showTranscription, setShowTranscription] = useState(true);
  const [showTajweed, setShowTajweed] = useState(false);
  const [playerHeight, setPlayerHeight] = useState(0);

  // "Go to Page" picker (Page mode only)
  const [pagePickerOpen, setPagePickerOpen] = useState(false);
  const [pagePickerMounted, setPagePickerMounted] = useState(false);
  const [pickerPageNumber, setPickerPageNumber] = useState(view.mode === 'page' ? view.pageNumber : 1);

  const revealControls = useCallback(() => setControlsVisible(true), []);
  const toggleControls = useCallback(() => setControlsVisible((v) => !v), []);

  useEffect(() => {
    if (settingsOpen) {
      setSettingsModalMounted(true);
    } else if (settingsModalMounted) {
      const t = setTimeout(() => setSettingsModalMounted(false), CLOSE_DURATION);
      return () => clearTimeout(t);
    }
  }, [settingsOpen, settingsModalMounted]);

  useEffect(() => {
    if (pagePickerOpen) {
      setPagePickerMounted(true);
    } else if (pagePickerMounted) {
      const t = setTimeout(() => setPagePickerMounted(false), CLOSE_DURATION);
      return () => clearTimeout(t);
    }
  }, [pagePickerOpen, pagePickerMounted]);

  const flatListRef = useRef(null);
  const stateRef = useRef({
    verses: [],
    currentIndex: 0,
    reciterFolder: DEFAULT_RECITER.folder,
    isLoading: false,
  });

  const [player] = useState(() => createAudioPlayer(null));
  const status = useAudioPlayerStatus(player);

  const isPlaying = status.playing;
  const progressPct = status.duration > 0 ? (status.currentTime / status.duration) * 100 : 0;

  useEffect(() => {
    return () => {
      player.remove();
      if (flashTimeoutRef.current) clearTimeout(flashTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    AsyncStorage.multiGet([
      'translit_style',
      'selected_reciter',
      'reading_mode',
      'show_arabic',
      'show_translation',
      'show_transcription',
      'show_tajweed',
    ]).then((pairs) => {
      const map = Object.fromEntries(pairs);
      if (map.translit_style === 'simple' || map.translit_style === 'standard') {
        setTranslitStyleState(map.translit_style);
      }
      if (map.selected_reciter) {
        const r = RECITERS.find((x) => x.id === map.selected_reciter);
        if (r) {
          setSelectedReciterId(r.id);
          stateRef.current.reciterFolder = r.folder;
        }
      }
      if (map.reading_mode === 'surah' || map.reading_mode === 'page' || map.reading_mode === 'mushaf') {
        setReadingMode(map.reading_mode);
      }
      if (map.show_arabic != null) setShowArabic(map.show_arabic !== '0');
      if (map.show_translation != null) setShowTranslation(map.show_translation !== '0');
      if (map.show_transcription != null) setShowTranscription(map.show_transcription !== '0');
      if (map.show_tajweed != null) setShowTajweed(map.show_tajweed === '1');
    });
  }, []);

  const setTranslitStyle = async (val) => {
    light();
    setTranslitStyleState(val);
    await AsyncStorage.setItem('translit_style', val);
  };

  const selectReciter = async (reciter) => {
    medium();
    setSelectedReciterId(reciter.id);
    stateRef.current.reciterFolder = reciter.folder;
    await AsyncStorage.setItem('selected_reciter', reciter.id);
  };

  // Switching modes here is a live reflow of *this* screen: it carries over
  // whichever verse is currently active so reading position isn't lost, but
  // only persists the preference for how SurahList routes you next time —
  // it doesn't retroactively change how this instance was opened.
  // Mushaf is a *rendering* style over the same page data as Page mode, not
  // a distinct data-fetch mode, so both map to the 'page' data mode below.
  const selectReadingMode = (value) => {
    light();
    setReadingMode(value);
    AsyncStorage.setItem('reading_mode', value).catch(() => {});

    const nextDataMode = value === 'surah' ? 'surah' : 'page';
    if (nextDataMode === view.mode) return;
    const anchor = stateRef.current.verses[stateRef.current.currentIndex];
    if (!anchor) return;

    if (status.playing) player.pause();
    setPendingAnchor({ type: 'surahAyah', surahNumber: anchor.surahNumber, number: anchor.number });
    if (nextDataMode === 'page') {
      setView({ mode: 'page', pageNumber: anchor.page });
    } else {
      setView({ mode: 'surah', surahNumber: anchor.surahNumber, surahName: anchor.surahName, surahNameEn: anchor.surahNameEn });
    }
  };

  const goToPage = (pageNumber) => {
    const clamped = Math.min(TOTAL_PAGES, Math.max(1, pageNumber));
    if (clamped === view.pageNumber && view.mode === 'page') return;
    light();
    if (status.playing) player.pause();
    setPendingAnchor(null);
    setView({ mode: 'page', pageNumber: clamped });
    setCurrentIndex(0);
    stateRef.current.currentIndex = 0;
    try {
      flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
    } catch (_) {}
  };

  const DISPLAY_PREF_KEYS = {
    showArabic: 'show_arabic',
    showTranslation: 'show_translation',
    showTranscription: 'show_transcription',
    showTajweed: 'show_tajweed',
  };
  const DISPLAY_PREF_SETTERS = {
    showArabic: setShowArabic,
    showTranslation: setShowTranslation,
    showTranscription: setShowTranscription,
    showTajweed: setShowTajweed,
  };

  const toggleDisplayPref = (key, value) => {
    light();
    AsyncStorage.setItem(DISPLAY_PREF_KEYS[key], value ? '1' : '0').catch(() => {});
    DISPLAY_PREF_SETTERS[key](value);
  };

  const verses = useMemo(() => {
    if (view.mode === 'surah') {
      if (!surahData) return [];
      return mapAyahs(surahData, () => ({
        surahNumber: view.surahNumber,
        surahName: view.surahName,
        surahNameEn: view.surahNameEn,
      }));
    }
    if (!pageData) return [];
    return mapAyahs(pageData, (ayah) => ({
      surahNumber: ayah.surah.number,
      surahName: ayah.surah.name,
      surahNameEn: ayah.surah.englishName,
      numberOfAyahs: ayah.surah.numberOfAyahs,
    }));
  }, [view, surahData, pageData]);

  useEffect(() => {
    stateRef.current.verses = verses;
  }, [verses]);

  // Land on the right verse once data for the current view has loaded —
  // either a fixed index, or a surah+ayah to locate within the list.
  useEffect(() => {
    if (!verses.length || !pendingAnchor) return;
    let idx = 0;
    if (pendingAnchor.type === 'index') {
      idx = Math.min(Math.max(0, pendingAnchor.index), verses.length - 1);
    } else if (pendingAnchor.type === 'surahAyah') {
      const found = verses.findIndex((v) => v.surahNumber === pendingAnchor.surahNumber && v.number === pendingAnchor.number);
      idx = found >= 0 ? found : 0;
    }
    setCurrentIndex(idx);
    stateRef.current.currentIndex = idx;
    setPendingAnchor(null);
    setTimeout(() => {
      try {
        flatListRef.current?.scrollToIndex({ index: idx, animated: false, viewPosition: 0.3 });
      } catch (_) {}
    }, 300);
  }, [verses, pendingAnchor]);

  // Keep the native header in sync with whichever mode/content is live.
  useEffect(() => {
    if (view.mode === 'page') {
      const juz = verses[0]?.juz ?? null;
      navigation.setOptions({
        headerTitle: () => (
          <PageHeaderTitle
            styles={styles}
            C={C}
            pageNumber={view.pageNumber}
            juz={juz}
            onPress={() => {
              light();
              setPickerPageNumber(view.pageNumber);
              setPagePickerOpen(true);
            }}
          />
        ),
      });
    } else {
      navigation.setOptions({ headerTitle: undefined, title: view.surahNameEn ?? 'Surah' });
    }
  }, [view, verses, styles, C, navigation]);

  const pageMeta = view.mode === 'surah' && verses.length > 0
    ? { page: verses[0].page, juz: verses[0].juz, hizb: verses[0].hizb }
    : null;

  const showBismillah = view.mode === 'surah' && view.surahNumber !== 1 && view.surahNumber !== 9;
  const firstVerseStartsNewSurah = view.mode === 'page' && verses.length > 0 && verses[0].number === 1;
  const firstVerseNeedsBismillah = firstVerseStartsNewSurah && verses[0].surahNumber !== 1 && verses[0].surahNumber !== 9;

  const ListHeader = useMemo(() => {
    if (view.mode === 'surah') {
      return (
        <View>
          <SurahHeaderBanner
            styles={styles}
            C={C}
            surahName={view.surahName}
            surahNameEn={view.surahNameEn}
            surahNumber={view.surahNumber}
            verseCount={verses.length}
          />
          {showBismillah && <BismillahBanner />}
          {pageMeta && <PageMetaRow styles={styles} page={pageMeta.page} juz={pageMeta.juz} hizb={pageMeta.hizb} />}
        </View>
      );
    }
    if (!firstVerseStartsNewSurah) return null;
    return (
      <View>
        <SurahDivider
          surahNumber={verses[0].surahNumber}
          surahName={verses[0].surahName}
          surahNameEn={verses[0].surahNameEn}
        />
        {firstVerseNeedsBismillah && <BismillahBanner />}
      </View>
    );
  }, [view, styles, C, verses, showBismillah, pageMeta, firstVerseStartsNewSurah, firstVerseNeedsBismillah]);

  const ListFooter = useMemo(() => {
    if (view.mode !== 'page') return null;
    return (
      <PageNavRow
        styles={styles}
        C={C}
        pageNumber={view.pageNumber}
        totalPages={TOTAL_PAGES}
        loading={loading}
        onPrev={() => goToPage(view.pageNumber - 1)}
        onNext={() => goToPage(view.pageNumber + 1)}
      />
    );
  }, [view, styles, C, loading]);

  const loadAndPlayVerse = useCallback(async (index) => {
    const { verses: v, reciterFolder, isLoading } = stateRef.current;
    if (isLoading || !v.length || index < 0 || index >= v.length) return;

    stateRef.current.isLoading = true;
    stateRef.current.currentIndex = index;
    setCurrentIndex(index);
    setIsLoadingAudio(true);
    setAudioError(null);

    try {
      flatListRef.current?.scrollToIndex({ index, animated: true, viewPosition: 0.3 });
    } catch (_) {}

    const verse = v[index];

    // Persist last-read position
    AsyncStorage.setItem('last_read', JSON.stringify({
      surahNumber: verse.surahNumber,
      surahName: verse.surahName,
      surahNameEn: verse.surahNameEn,
      verseIndex: verse.number - 1,
    })).catch(() => {});

    recordActiveToday().catch(() => {});
    // `numberOfAyahs` is only set on page-mode items (a page can mix surahs,
    // so the surah's own total isn't `v.length` there); surah mode loads the
    // whole surah, so `v.length` already *is* its total ayah count.
    const totalAyahsInSurah = verse.numberOfAyahs ?? v.length;
    if (verse.number === totalAyahsInSurah) {
      recordSurahFinished(verse.surahNumber).catch(() => {});
    }

    const s = String(verse.surahNumber).padStart(3, '0');
    const a = String(verse.number).padStart(3, '0');
    const url = `https://everyayah.com/data/${reciterFolder}/${s}${a}.mp3`;

    try {
      await setAudioModeAsync({ playsInSilentMode: true, shouldPlayInBackground: true });
      player.replace(url);
      player.play();
    } catch (e) {
      console.warn('Audio load error:', e.message);
      setAudioError({ index });
    } finally {
      setIsLoadingAudio(false);
      stateRef.current.isLoading = false;
    }
  }, [player]);

  useEffect(() => {
    if (!status.didJustFinish) return;
    const next = stateRef.current.currentIndex + 1;
    if (next >= stateRef.current.verses.length) { success(); return; }
    loadAndPlayVerse(next);
  }, [status.didJustFinish]);

  const togglePlayPause = () => {
    medium();
    if (isPlaying) {
      player.pause();
    } else if (status.isLoaded) {
      player.play();
    } else {
      loadAndPlayVerse(currentIndex);
    }
  };

  const playPrev = () => loadAndPlayVerse(Math.max(0, currentIndex - 1));
  const playNext = () => loadAndPlayVerse(Math.min(verses.length - 1, currentIndex + 1));
  const retryAudioLoad = () => audioError && loadAndPlayVerse(audioError.index);

  const bookmarkVerse = useCallback(async (item) => {
    const translation =
      defaultLang === 'ru' ? item.ru : defaultLang === 'kz' ? item.kz : item.en;
    const id = `${item.surahNumber}:${item.number}`;
    const bookmark = {
      id,
      surahNumber: item.surahNumber,
      surahName: item.surahName,
      surahNameEn: item.surahNameEn,
      verseNumber: item.number,
      arabicText: item.arabicText,
      translation,
      lang: defaultLang,
      timestamp: Date.now(),
    };

    try {
      const raw = await AsyncStorage.getItem('bookmarks');
      const existing = raw ? JSON.parse(raw) : [];
      const deduped = existing.filter(b => b.id !== id);
      await AsyncStorage.setItem('bookmarks', JSON.stringify([bookmark, ...deduped]));
    } catch (_) {}

    success();
    setFlashedVerseId(id);
    if (flashTimeoutRef.current) clearTimeout(flashTimeoutRef.current);
    flashTimeoutRef.current = setTimeout(() => setFlashedVerseId(null), 1500);
  }, [defaultLang]);

  const renderVerse = ({ item, index }) => {
    const active = index === currentIndex;
    const translation =
      defaultLang === 'en' ? item.en : defaultLang === 'ru' ? item.ru : item.kz;
    const verseId = `${item.surahNumber}:${item.number}`;
    const justBookmarked = flashedVerseId === verseId;
    const showTranscriptionText = showTranscription && !!item.transliteration;
    const showTranslationText = showTranslation && !!translation;
    // A page's continuous stream can cross into a new surah mid-list (index>0);
    // the very first item's divider is handled separately, by ListHeader.
    const showDividerAbove = view.mode === 'page' && index > 0 && item.number === 1;
    const showBismillahAbove = showDividerAbove && item.surahNumber !== 1 && item.surahNumber !== 9;

    return (
      <View>
        {showDividerAbove && (
          <SurahDivider
            surahNumber={item.surahNumber}
            surahName={item.surahName}
            surahNameEn={item.surahNameEn}
          />
        )}
        {showBismillahAbove && <BismillahBanner />}
        <TouchableOpacity
          style={[styles.verseRow, active && styles.verseRowActive]}
          onPress={() => { revealControls(); loadAndPlayVerse(index); }}
          onLongPress={() => bookmarkVerse(item)}
          delayLongPress={400}
          activeOpacity={0.7}
        >
          <View style={styles.verseHeader}>
            <Text style={[styles.verseNumText, active && styles.verseNumTextActive]}>
              {item.surahNumber}:{item.number}
            </Text>
            {justBookmarked && (
              <View style={styles.bookmarkFlash}>
                <Ionicons name="bookmark" size={11} color="#FFFFFF" />
                <Text style={styles.bookmarkFlashText}>Saved</Text>
              </View>
            )}
          </View>

          {showArabic && <Text style={styles.arabicText}>{item.arabicText}</Text>}

          {showTranscriptionText ? (
            <Text style={styles.transliterationText}>
              {translitStyle === 'simple'
                ? simplifyTranslit(item.transliteration)
                : item.transliteration}
            </Text>
          ) : null}

          {showTranslationText && showTranscriptionText ? (
            <View style={styles.verseDivider} />
          ) : null}

          {showTranslationText ? (
            <Text style={styles.translationText}>{translation}</Text>
          ) : null}
        </TouchableOpacity>
      </View>
    );
  };

  const reciterName = RECITERS.find((r) => r.id === selectedReciterId)?.name ?? DEFAULT_RECITER.name;
  const translationOpt = TRANSLATION_OPTIONS.find((o) => o.key === defaultLang);
  const themeOpt = THEME_OPTIONS.find((o) => o.value === colorMode) ?? THEME_OPTIONS[1];

  // Mushaf is a rendering style over the same page data as Page mode (see
  // selectReadingMode) — only meaningful once that data has actually loaded.
  const isMushaf = readingMode === 'mushaf' && view.mode === 'page';
  const activeVerse = verses[currentIndex];
  const activeVerseId = activeVerse ? `${activeVerse.surahNumber}:${activeVerse.number}` : null;

  const onMushafVersePress = (item) => {
    const idx = verses.findIndex((v) => v.surahNumber === item.surahNumber && v.number === item.number);
    if (idx < 0) return;
    revealControls();
    loadAndPlayVerse(idx);
  };

  const closeSettings = () => {
    setSettingsOpen(false);
    setActiveSubPanel(null);
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <StatusBar
        barStyle={C.statusBarStyle === 'dark' ? 'dark-content' : 'light-content'}
        backgroundColor={C.bg}
      />

      <Pressable style={{ flex: 1 }} onPress={toggleControls}>
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={C.accent} />
            <Text style={styles.loadingTxt}>{view.mode === 'surah' ? 'Loading surah...' : 'Loading page...'}</Text>
          </View>
        ) : error ? (
          <View style={styles.center}>
            <Text style={styles.errorTxt}>Failed to load. Check your connection.</Text>
          </View>
        ) : isMushaf ? (
          <ScrollView contentContainerStyle={styles.verseList} showsVerticalScrollIndicator={false}>
            {ListHeader}
            <MushafPage
              verses={verses}
              activeVerseId={activeVerseId}
              flashedVerseId={flashedVerseId}
              scale={scale}
              onVersePress={onMushafVersePress}
              onVerseLongPress={bookmarkVerse}
            />
            {ListFooter}
          </ScrollView>
        ) : (
          <FlatList
            ref={flatListRef}
            data={verses}
            keyExtractor={item => `${item.surahNumber}:${item.number}`}
            renderItem={renderVerse}
            extraData={{ currentIndex, defaultLang, flashedVerseId, translitStyle, showArabic, showTranslation, showTranscription }}
            contentContainerStyle={styles.verseList}
            showsVerticalScrollIndicator={false}
            onScrollToIndexFailed={() => {}}
            ListHeaderComponent={ListHeader}
            ListFooterComponent={ListFooter}
          />
        )}
      </Pressable>

      {controlsVisible && (
        <TouchableOpacity
          style={[styles.gearBtn, { bottom: insets.bottom + playerHeight + 16 }]}
          onPress={() => { light(); setSettingsOpen(true); }}
        >
          <Ionicons name="settings-outline" size={22} color={C.text} />
        </TouchableOpacity>
      )}

      <View style={styles.player} onLayout={(e) => setPlayerHeight(e.nativeEvent.layout.height)}>
        <View style={styles.playerInfo}>
          <Text style={styles.playerVerse}>
            Verse {currentIndex + 1}{verses.length > 0 ? ` / ${verses.length}` : ''}
          </Text>
          {showAudioProgress && (
            <Text style={styles.playerTime}>
              {formatSecs(status.currentTime)} / {formatSecs(status.duration)}
            </Text>
          )}
        </View>

        {showAudioProgress && (
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progressPct}%` }]} />
          </View>
        )}

        {audioError && (
          <View style={styles.playerError}>
            <Text style={styles.playerErrorTxt}>Couldn't load audio — check your connection</Text>
            <TouchableOpacity onPress={retryAudioLoad}>
              <Text style={styles.playerErrorRetry}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.playerControls}>
          <TouchableOpacity style={styles.controlBtn} onPress={playPrev}>
            <Ionicons name="play-skip-back" size={22} color={C.gold} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.playBtn} onPress={togglePlayPause}>
            {isLoadingAudio || status.isBuffering ? (
              <ActivityIndicator size="small" color={C.onAccent} />
            ) : (
              <Ionicons name={isPlaying ? 'pause' : 'play'} size={26} color={C.onAccent} />
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.controlBtn} onPress={playNext}>
            <Ionicons name="play-skip-forward" size={22} color={C.gold} />
          </TouchableOpacity>
        </View>
      </View>

      <Modal
        transparent
        visible={settingsModalMounted}
        animationType="none"
        statusBarTranslucent
        onRequestClose={() => (activeSubPanel ? setActiveSubPanel(null) : closeSettings())}
      >
        <View style={{ flex: 1 }}>
          <Sheet visible={settingsOpen} onClose={closeSettings} title="Settings">
            <ReaderSettingsPanel
              readingMode={readingMode}
              onSelectReadingMode={selectReadingMode}
              onNavigate={(key) => setActiveSubPanel(key)}
              rowSubtitles={{
                arabicFont: 'Amiri',
                transcription: translitStyle === 'simple' ? 'Simple' : 'Standard',
                translation: translationOpt ? `${translationOpt.label} — ${translationOpt.translator}` : '',
                reciter: reciterName,
                colorTheme: themeOpt.label,
              }}
              toggles={{ showArabic, showTranslation, showTranscription, showTajweed }}
              onToggleChange={toggleDisplayPref}
            />
          </Sheet>

          <Sheet
            visible={!!activeSubPanel}
            onClose={() => setActiveSubPanel(null)}
            title={activeSubPanel ? SUB_PANELS[activeSubPanel].title : ''}
          >
            {activeSubPanel === 'arabicFont' && (
              <ArabicFontPanel fontSize={fontSize} onFontSizeChange={setFontSize} />
            )}
            {activeSubPanel === 'transcription' && (
              <TranscriptionPanel
                translitStyle={translitStyle}
                onTranslitStyleChange={setTranslitStyle}
                fontSize={fontSize}
                onFontSizeChange={setFontSize}
              />
            )}
            {activeSubPanel === 'translation' && (
              <TranslationPanel
                defaultLang={defaultLang}
                onSelectLang={setDefaultLang}
                fontSize={fontSize}
                onFontSizeChange={setFontSize}
                previewVerse={verses[0]}
              />
            )}
            {activeSubPanel === 'reciter' && (
              <ReciterPanel selectedReciterId={selectedReciterId} onSelectReciter={selectReciter} />
            )}
            {activeSubPanel === 'colorTheme' && (
              <ColorThemePanel colorMode={colorMode} onSelectColorMode={setColorMode} />
            )}
          </Sheet>
        </View>
      </Modal>

      <Modal
        transparent
        visible={pagePickerMounted}
        animationType="none"
        statusBarTranslucent
        onRequestClose={() => setPagePickerOpen(false)}
      >
        <Sheet visible={pagePickerOpen} onClose={() => setPagePickerOpen(false)} title="Go to Page">
          <View style={styles.pagePickerBody}>
            <Stepper label="Page" value={pickerPageNumber} min={1} max={TOTAL_PAGES} onChange={setPickerPageNumber} />
            <PillButton
              variant="primary"
              label="Go to Page"
              icon="arrow-forward"
              onPress={() => { goToPage(pickerPageNumber); setPagePickerOpen(false); }}
              style={styles.pagePickerCta}
            />
          </View>
        </Sheet>
      </Modal>
    </SafeAreaView>
  );
}
