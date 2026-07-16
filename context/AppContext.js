import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const AppContext = createContext({
  effectiveScheme: 'light',
  colorMode: null,
  setColorMode: () => {},
  fontSize: 'medium',
  setFontSize: () => {},
  defaultLang: 'en',
  setDefaultLang: () => {},
  showAudioProgress: true,
  setShowAudioProgress: () => {},
});

export function AppProvider({ children }) {
  const system = useColorScheme();
  const [colorMode, setColorModeState] = useState(null);
  const [fontSize, setFontSizeState] = useState('medium');
  const [defaultLang, setDefaultLangState] = useState('en');
  const [showAudioProgress, setShowAudioProgressState] = useState(true);

  useEffect(() => {
    AsyncStorage.multiGet(['colorMode', 'fontSize', 'defaultLang', 'showAudioProgress']).then(pairs => {
      const map = Object.fromEntries(pairs.map(([k, v]) => [k, v]));
      if (map.colorMode === 'light' || map.colorMode === 'dark') {
        setColorModeState(map.colorMode);
      }
      if (map.fontSize === 'small' || map.fontSize === 'medium' || map.fontSize === 'large') {
        setFontSizeState(map.fontSize);
      }
      if (map.defaultLang === 'en' || map.defaultLang === 'ru' || map.defaultLang === 'kz') {
        setDefaultLangState(map.defaultLang);
      }
      if (map.showAudioProgress != null) {
        setShowAudioProgressState(map.showAudioProgress !== '0');
      }
    });
  }, []);

  const setColorMode = async (val) => {
    setColorModeState(val);
    await AsyncStorage.setItem('colorMode', val ?? '');
  };

  const setFontSize = async (val) => {
    setFontSizeState(val);
    await AsyncStorage.setItem('fontSize', val);
  };

  const setDefaultLang = async (val) => {
    setDefaultLangState(val);
    await AsyncStorage.setItem('defaultLang', val);
  };

  const setShowAudioProgress = async (val) => {
    setShowAudioProgressState(val);
    await AsyncStorage.setItem('showAudioProgress', val ? '1' : '0');
  };

  const effectiveScheme = colorMode ?? system ?? 'light';

  const value = useMemo(
    () => ({
      effectiveScheme,
      colorMode,
      setColorMode,
      fontSize,
      setFontSize,
      defaultLang,
      setDefaultLang,
      showAudioProgress,
      setShowAudioProgress,
    }),
    [effectiveScheme, colorMode, fontSize, defaultLang, showAudioProgress],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useSettings() {
  return useContext(AppContext);
}
