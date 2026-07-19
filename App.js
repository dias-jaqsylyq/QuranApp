import React, { useCallback } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { useFonts, Amiri_400Regular, Amiri_700Bold } from '@expo-google-fonts/amiri';
import * as SplashScreen from 'expo-splash-screen';

import SurahListScreen from './screens/SurahListScreen';
import SurahReaderScreen from './screens/SurahReaderScreen';
import ReciterScreen from './screens/ReciterScreen';
import SearchScreen from './screens/SearchScreen';
import DailyKhatmScreen from './screens/DailyKhatmScreen';
import HifzHomeScreen from './screens/HifzHomeScreen';
import AddHifzPlanScreen from './screens/AddHifzPlanScreen';
import BookmarksScreen from './screens/BookmarksScreen';
import QiblaScreen from './screens/QiblaScreen';
import SettingsScreen from './screens/SettingsScreen';
import HomeScreen from './screens/HomeScreen';
import ProfileScreen from './screens/ProfileScreen';
import EditProfileScreen from './screens/EditProfileScreen';
import AuthScreen from './screens/AuthScreen';
import CustomTabBar from './components/CustomTabBar';
import { AppProvider } from './context/AppContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { useTheme } from './theme/colors';
import { useI18n } from './hooks/useI18n';

SplashScreen.preventAutoHideAsync();

const Tab = createBottomTabNavigator();
const QuranStack = createNativeStackNavigator();
const ProfileStack = createNativeStackNavigator();
const DiscoverStack = createNativeStackNavigator();
const MemorizeStack = createNativeStackNavigator();

function QuranNavigator() {
  const C = useTheme();
  const { t } = useI18n();
  return (
    <QuranStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: C.playerBg },
        headerTintColor: C.gold,
        headerTitleStyle: { fontWeight: '700', fontSize: 17 },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: C.bg },
      }}
    >
      <QuranStack.Screen
        name="SurahList"
        component={SurahListScreen}
        options={{ headerShown: false }}
      />
      <QuranStack.Screen
        name="SurahReader"
        component={SurahReaderScreen}
        options={({ route }) => ({
          title: route.params?.pageNumber != null
            ? t('common.pageN', { n: route.params.pageNumber })
            : (route.params?.surahNameEn ?? t('common.surah')),
          headerBackTitle: t('quran.headerBack'),
        })}
      />
    </QuranStack.Navigator>
  );
}

function ProfileNavigator() {
  return (
    <ProfileStack.Navigator screenOptions={{ headerShown: false }}>
      <ProfileStack.Screen name="Profile" component={ProfileScreen} />
      <ProfileStack.Screen name="Settings" component={SettingsScreen} />
      <ProfileStack.Screen name="EditProfile" component={EditProfileScreen} />
      <ProfileStack.Screen name="Reciters" component={ReciterScreen} />
      <ProfileStack.Screen name="Auth" component={AuthScreen} options={{ presentation: 'modal' }} />
    </ProfileStack.Navigator>
  );
}

function DiscoverNavigator() {
  const C = useTheme();
  const { t } = useI18n();
  return (
    <DiscoverStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: C.playerBg },
        headerTintColor: C.gold,
        headerTitleStyle: { fontWeight: '700', fontSize: 17 },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: C.bg },
      }}
    >
      <DiscoverStack.Screen
        name="Search"
        component={SearchScreen}
        options={{ headerShown: false }}
      />
      <DiscoverStack.Screen
        name="DailyKhatm"
        component={DailyKhatmScreen}
        options={{ title: t('khatm.navTitle'), headerBackTitle: t('khatm.headerBack') }}
      />
      <DiscoverStack.Screen
        name="Bookmarks"
        component={BookmarksScreen}
        options={{ headerShown: false }}
      />
      <DiscoverStack.Screen
        name="Qibla"
        component={QiblaScreen}
        options={{ title: t('qibla.navTitle'), headerBackTitle: t('qibla.headerBack') }}
      />
    </DiscoverStack.Navigator>
  );
}

function MemorizeNavigator() {
  const C = useTheme();
  const { t } = useI18n();
  return (
    <MemorizeStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: C.playerBg },
        headerTintColor: C.gold,
        headerTitleStyle: { fontWeight: '700', fontSize: 17 },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: C.bg },
      }}
    >
      <MemorizeStack.Screen
        name="HifzHome"
        component={HifzHomeScreen}
        options={{ headerShown: false }}
      />
      <MemorizeStack.Screen
        name="AddHifzPlan"
        component={AddHifzPlanScreen}
        options={{ title: t('hifz.addSurahTitle'), headerBackTitle: t('hifz.headerBack') }}
      />
    </MemorizeStack.Navigator>
  );
}

function AppTabs() {
  return (
    <Tab.Navigator
      initialRouteName="Home"
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Home"      component={HomeScreen} />
      <Tab.Screen name="Quran"     component={QuranNavigator} />
      <Tab.Screen name="Memorize"  component={MemorizeNavigator} />
      <Tab.Screen name="Discover"  component={DiscoverNavigator} />
      <Tab.Screen name="You"       component={ProfileNavigator} />
    </Tab.Navigator>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({ Amiri_400Regular, Amiri_700Bold });

  return (
    <AppProvider>
      <AuthProvider>
        <AppRoot fontsLoaded={fontsLoaded} />
      </AuthProvider>
    </AppProvider>
  );
}

// Keeps the native splash (already showing the app icon, per app.json) on
// screen until fonts AND the first Supabase session check are both done, so
// the Profile/Settings auth state never flashes the wrong value on launch.
function AppRoot({ fontsLoaded }) {
  const { initializing } = useAuth();
  const ready = fontsLoaded && !initializing;

  const onLayoutRootView = useCallback(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;

  return (
    <SafeAreaProvider onLayout={onLayoutRootView}>
      <NavigationContainer>
        <AppTabsWithStatus />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

function AppTabsWithStatus() {
  const C = useTheme();
  return (
    <>
      <StatusBar style={C.statusBarStyle} />
      <AppTabs />
    </>
  );
}
