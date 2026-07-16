# Graph Report - .  (2026-06-19)

## Corpus Check
- Corpus is ~12,585 words - fits in a single context window. You may not need a graph.

## Summary
- 298 nodes · 477 edges · 32 communities (18 shown, 14 thin omitted)
- Extraction: 95% EXTRACTED · 5% INFERRED · 0% AMBIGUOUS · INFERRED: 23 edges (avg confidence: 0.83)
- Token cost: 210,384 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Profile & Settings UI Components|Profile & Settings UI Components]]
- [[_COMMUNITY_App Settings & Reciter Context|App Settings & Reciter Context]]
- [[_COMMUNITY_NPM Dependencies|NPM Dependencies]]
- [[_COMMUNITY_Expo App Configuration|Expo App Configuration]]
- [[_COMMUNITY_App Navigation & Tab Bar|App Navigation & Tab Bar]]
- [[_COMMUNITY_Topic Cards & Surah Search Data|Topic Cards & Surah Search Data]]
- [[_COMMUNITY_ProfileSettings Screens & Theme|Profile/Settings Screens & Theme]]
- [[_COMMUNITY_Surah Reader Screen|Surah Reader Screen]]
- [[_COMMUNITY_Bookmarks Screen|Bookmarks Screen]]
- [[_COMMUNITY_Reciter Selection Flow|Reciter Selection Flow]]
- [[_COMMUNITY_Surah List & Search Screens|Surah List & Search Screens]]
- [[_COMMUNITY_Home Screen & Mock Data|Home Screen & Mock Data]]
- [[_COMMUNITY_HomeProfile Screen Interactions|Home/Profile Screen Interactions]]
- [[_COMMUNITY_Project Docs & Config Cross-Refs|Project Docs & Config Cross-Refs]]
- [[_COMMUNITY_Reading Progress & Audio Playback|Reading Progress & Audio Playback]]
- [[_COMMUNITY_Profile Stat Card|Profile Stat Card]]
- [[_COMMUNITY_Theme Color Palettes|Theme Color Palettes]]
- [[_COMMUNITY_Gradient Topic Card Data|Gradient Topic Card Data]]
- [[_COMMUNITY_Claude Code Settings|Claude Code Settings]]
- [[_COMMUNITY_Home Mock Data Fragments|Home Mock Data Fragments]]
- [[_COMMUNITY_Style Factories (ReciterSettings)|Style Factories (Reciter/Settings)]]
- [[_COMMUNITY_Adaptive Icon Asset|Adaptive Icon Asset]]
- [[_COMMUNITY_Favicon Asset|Favicon Asset]]
- [[_COMMUNITY_App Icon Asset|App Icon Asset]]
- [[_COMMUNITY_Splash Icon Asset|Splash Icon Asset]]
- [[_COMMUNITY_Haptics Helper (heavy)|Haptics Helper (heavy)]]
- [[_COMMUNITY_Onboarding Mock Data|Onboarding Mock Data]]
- [[_COMMUNITY_Activity Filters List|Activity Filters List]]
- [[_COMMUNITY_Search Screen Styles|Search Screen Styles]]
- [[_COMMUNITY_Font Options Constant|Font Options Constant]]
- [[_COMMUNITY_Surah List Screen Styles|Surah List Screen Styles]]
- [[_COMMUNITY_Time Format Helper|Time Format Helper]]

## God Nodes (most connected - your core abstractions)
1. `useTheme()` - 41 edges
2. `SurahReaderScreen component` - 24 edges
3. `light()` - 22 edges
4. `light() haptic helper` - 17 edges
5. `expo` - 13 edges
6. `SettingsScreen component` - 10 edges
7. `useTheme hook` - 10 edges
8. `SurahListScreen component` - 8 edges
9. `BookmarksScreen component` - 7 edges
10. `AppTabs()` - 6 edges

## Surprising Connections (you probably didn't know these)
- `QuranApp Icon Preview (canvas-drawn crescent moon + star + Arabic text icon mockup)` --semantically_similar_to--> `SurahHeaderBanner component`  [INFERRED] [semantically similar]
  assets/icon-preview.html → screens/SurahReaderScreen.js
- `useTheme()` --calls--> `useSettings hook`  [INFERRED]
  theme/colors.js → context/AppContext.js
- `AGENTS.md: Expo SDK 54 Documentation Notice` --references--> `Expo app.json Configuration`  [INFERRED]
  AGENTS.md → app.json
- `AGENTS.md: Expo SDK 54 Documentation Notice` --references--> `package.json Dependencies`  [INFERRED]
  AGENTS.md → package.json
- `ICONS map (tab icon names)` --shares_data_with--> `AppTabs()`  [INFERRED]
  components/CustomTabBar.js → App.js

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Shared haptic feedback interaction pattern across touchable components** — avatarview_handlecamerapress, customtabbar_onpress, gradienttopiccard_handlepress, pillbutton_handlepress, settingsrow_handlepress, statcard_handlepress [INFERRED 0.85]
- **useTheme + makeStyles(C) dynamic styling pattern shared by presentational components** — avatarview_makestyles, customtabbar_makestyles, pillbutton_makestyles, sectionheader_makestyles, settingsrow_makestyles, statcard_makestyles, theme_colors_usetheme [INFERRED 0.85]
- **AppContext settings persisted to AsyncStorage (colorMode, fontSize, defaultLang)** — appcontext_setcolormode, appcontext_setfontsize, appcontext_setdefaultlang, appcontext_appprovider [EXTRACTED 1.00]
- **Screens applying consistent haptic feedback on interaction (light/medium/success)** — haptics_light, haptics_medium, haptics_success, bookmarksscreen_bookmarksscreen, editprofilescreen_editprofilescreen, homescreen_homescreen, profilescreen_profilescreen, reciterscreen_reciterscreen, searchscreen_searchscreen, settingsscreen_settingsscreen, surahlistscreen_surahlistscreen, surahreaderscreen_surahreaderscreen [EXTRACTED 0.95]
- **Screens consuming useTheme()/makeStyles(C) dynamic theming pattern from theme/colors.js** — colors_usetheme, bookmarksscreen_makestyles, editprofilescreen_makestyles, homescreen_makestyles, profilescreen_makestyles, reciterscreen_makestyles, searchscreen_makestyles, settingsscreen_makestyles, surahlistscreen_makestyles, surahreaderscreen_makestyles [EXTRACTED 0.95]
- **Selected reciter persisted in AsyncStorage('selected_reciter') and read by three independent screens to drive UI/audio** — reciterscreen_storage_key, settingsscreen_reciter_mirror, surahreaderscreen_selected_reciter_key, reciters_data [INFERRED 0.90]

## Communities (32 total, 14 thin omitted)

### Community 0 - "Profile & Settings UI Components"
Cohesion: 0.08
Nodes (30): AvatarView component, handleCameraPress, makeStyles (AvatarView), AvatarView(), PillButton(), SectionHeader(), SettingsRow(), StatCard() (+22 more)

### Community 1 - "App Settings & Reciter Context"
Cohesion: 0.09
Nodes (17): AppContext, AppProvider(), useSettings(), RECITERS, useSurah(), ReciterScreen(), SettingsScreen(), bannerSt (+9 more)

### Community 2 - "NPM Dependencies"
Cohesion: 0.07
Nodes (27): dependencies, expo, expo-audio, expo-blur, @expo-google-fonts/amiri, expo-haptics, expo-linear-gradient, expo-status-bar (+19 more)

### Community 3 - "Expo App Configuration"
Cohesion: 0.09
Nodes (22): backgroundColor, foregroundImage, adaptiveIcon, edgeToEdgeEnabled, expo, android, icon, ios (+14 more)

### Community 4 - "App Navigation & Tab Bar"
Cohesion: 0.11
Nodes (19): App(), AppTabs(), AppTabsWithStatus(), ProfileNavigator(), ProfileStack, QuranNavigator(), QuranStack, Tab (+11 more)

### Community 5 - "Topic Cards & Surah Search Data"
Cohesion: 0.14
Nodes (10): GradientTopicCard(), styles, QUICK_LINKS, TOPICS, surahCache, surahListCache, useSurahList(), SearchScreen() (+2 more)

### Community 6 - "Profile/Settings Screens & Theme"
Cohesion: 0.19
Nodes (17): AppContext (React Context), useSettings hook, useTheme hook, comingSoon handler, confirmDelete handler, EditProfileScreen component, goBack handler, light() haptic helper (+9 more)

### Community 7 - "Surah Reader Screen"
Cohesion: 0.13
Nodes (16): QuranApp Icon Preview (canvas-drawn crescent moon + star + Arabic text icon mockup), LANG_OPTIONS constant, showProgressBar local cosmetic state, BismillahBanner component, makeStyles(C, scale) style factory, OrnamentLine SVG component, PageMetaRow component, playNext handler (+8 more)

### Community 8 - "Bookmarks Screen"
Cohesion: 0.18
Nodes (12): BookmarksScreen component, buildSections function, makeStyles(C) style factory, openVerse handler, STORAGE_KEY = 'bookmarks', makeStyles(C) style factory, success() haptic helper, onActionPress handler (+4 more)

### Community 9 - "Reciter Selection Flow"
Cohesion: 0.20
Nodes (10): deleteBookmark handler, medium() haptic helper, RECITERS / DEFAULT_RECITER data (data/reciters.js), ReciterScreen component, renderReciter render function, selectReciter handler, STORAGE_KEY = 'selected_reciter', Reciter name AsyncStorage mirror lookup (+2 more)

### Community 10 - "Surah List & Search Screens"
Cohesion: 0.22
Nodes (10): comingSoon handler, HexBadge SVG component, openSurah handler, SearchScreen component, HexBadge SVG component, scrollToJuz handler, SurahListScreen component, alquran.cloud API BASE URL (+2 more)

### Community 11 - "Home Screen & Mock Data"
Cohesion: 0.39
Nodes (5): AYAH_OF_THE_DAY, GUIDED_READING, WELCOME_ONBOARDING, getGreeting(), HomeScreen()

### Community 12 - "Home/Profile Screen Interactions"
Cohesion: 0.29
Nodes (7): comingSoon handler, getGreeting function, HomeScreen component, makeStyles(C) style factory, selectSegment handler, toggleLike handler, makeStyles(C) style factory

### Community 13 - "Project Docs & Config Cross-Refs"
Cohesion: 0.40
Nodes (6): AGENTS.md: Expo SDK 54 Documentation Notice, Expo app.json Configuration, CLAUDE.md (imports AGENTS.md), package.json Dependencies, DEFAULT_RECITER constant, RECITERS list

### Community 14 - "Reading Progress & Audio Playback"
Cohesion: 0.33
Nodes (6): 'last_read' AsyncStorage key (continue reading banner), everyayah.com audio URL pattern, 'last_read' AsyncStorage key (writer), loadAndPlayVerse async handler, renderVerse render function, simplifyTranslit helper

### Community 15 - "Profile Stat Card"
Cohesion: 0.40
Nodes (5): READING_STREAK constant, MOCK_PROFILE data, handlePress (StatCard), makeStyles (StatCard), StatCard component

### Community 16 - "Theme Color Palettes"
Cohesion: 0.67
Nodes (4): dark theme palette object, light theme palette object, shared palette object (accent/gold/onAccent/error), THEME_OPTIONS constant

### Community 17 - "Gradient Topic Card Data"
Cohesion: 0.50
Nodes (4): GradientTopicCard component, handlePress (GradientTopicCard), QUICK_LINKS list, TOPICS list (mood/topic cards)

## Ambiguous Edges - Review These
- `package.json Dependencies` → `RECITERS list`  [AMBIGUOUS]
  package.json · relation: conceptually_related_to
- `showProgressBar local cosmetic state` → `SurahReaderScreen component`  [AMBIGUOUS]
  screens/SettingsScreen.js · relation: references

## Knowledge Gaps
- **115 isolated node(s):** `Tab`, `QuranStack`, `ProfileStack`, `name`, `slug` (+110 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **14 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `package.json Dependencies` and `RECITERS list`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **What is the exact relationship between `showProgressBar local cosmetic state` and `SurahReaderScreen component`?**
  _Edge tagged AMBIGUOUS (relation: references) - confidence is low._
- **Why does `useTheme()` connect `Profile & Settings UI Components` to `App Settings & Reciter Context`, `App Navigation & Tab Bar`, `Topic Cards & Surah Search Data`, `Profile/Settings Screens & Theme`, `Home Screen & Mock Data`, `Profile Stat Card`?**
  _High betweenness centrality (0.303) - this node is a cross-community bridge._
- **Why does `AppContext (React Context)` connect `Profile/Settings Screens & Theme` to `App Navigation & Tab Bar`, `Surah Reader Screen`?**
  _High betweenness centrality (0.249) - this node is a cross-community bridge._
- **Why does `useSettings hook` connect `Profile/Settings Screens & Theme` to `Profile & Settings UI Components`?**
  _High betweenness centrality (0.230) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `SurahReaderScreen component` (e.g. with `LANG_OPTIONS constant` and `EDITIONS string (quran-uthmani, en.transliteration, en.asad, ru.osmanov, kk.khalifahaltai)`) actually correct?**
  _`SurahReaderScreen component` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `Tab`, `QuranStack`, `ProfileStack` to the rest of the system?**
  _115 weakly-connected nodes found - possible documentation gaps or missing edges._