import React, { useMemo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../theme/colors';
import { light as hapticLight } from '../utils/haptics';
import { useI18n } from '../hooks/useI18n';

const HIDDEN_ON_ROUTES = ['SurahReader'];

const ICONS = {
  Home: ['home', 'home-outline'],
  Quran: ['book', 'book-outline'],
  Memorize: ['repeat', 'repeat-outline'],
  Discover: ['search', 'search-outline'],
  You: ['person-circle', 'person-circle-outline'],
};

const TAB_KEYS = {
  Home: 'tabs.home',
  Quran: 'tabs.quran',
  Memorize: 'tabs.memorize',
  Discover: 'tabs.discover',
  You: 'tabs.you',
};

const makeStyles = (C) =>
  StyleSheet.create({
    wrap: {
      position: 'absolute',
      left: 20,
      right: 20,
      borderRadius: 32,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: C.tabBorder,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-around',
      height: 60,
      paddingHorizontal: 8,
    },
    tab: { flex: 1, alignItems: 'center', justifyContent: 'center', height: 44 },
    tabPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 10,
      height: 40,
      borderRadius: 20,
    },
    tabPillActive: { backgroundColor: C.surfaceGray },
    tabLabel: { fontSize: 11, fontWeight: '600', color: C.textSecondary },
    tabLabelActive: { color: C.text },
    dot: {
      position: 'absolute',
      top: 0,
      right: -2,
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: C.destructive,
    },
  });

export default function CustomTabBar({ state, navigation, insets }) {
  const C = useTheme();
  const { t } = useI18n();
  const styles = useMemo(() => makeStyles(C), [C]);

  const focusedTabRoute = state.routes[state.index];
  const focusedNestedRouteName = getFocusedRouteNameFromRoute(focusedTabRoute);
  if (HIDDEN_ON_ROUTES.includes(focusedNestedRouteName)) return null;

  return (
    <View style={[styles.wrap, { bottom: insets.bottom + 12 }]}>
      <BlurView intensity={50} tint={C.blurTint} style={StyleSheet.absoluteFill} />
      <View style={styles.row}>
        {state.routes.map((route, index) => {
          const focused = index === state.index;
          const [activeIcon, inactiveIcon] = ICONS[route.name] ?? ['ellipse', 'ellipse-outline'];
          const labelKey = TAB_KEYS[route.name];

          const onPress = () => {
            hapticLight();
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!focused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          return (
            <Pressable
              key={route.key}
              style={styles.tab}
              onPress={onPress}
              accessibilityRole="tab"
              accessibilityLabel={labelKey ? t(labelKey) : route.name}
              accessibilityState={focused ? { selected: true } : {}}
            >
              <View style={[styles.tabPill, focused && styles.tabPillActive]}>
                <View>
                  <Ionicons
                    name={focused ? activeIcon : inactiveIcon}
                    size={focused ? 18 : 22}
                    color={focused ? C.text : C.textSecondary}
                  />
                  {route.name === 'Home' && <View style={styles.dot} />}
                </View>
                {focused && labelKey ? (
                  <Text style={[styles.tabLabel, styles.tabLabelActive]} numberOfLines={1}>
                    {t(labelKey)}
                  </Text>
                ) : null}
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
