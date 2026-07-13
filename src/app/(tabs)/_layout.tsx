import React from 'react';
import { Tabs } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS } from '../../constants/theme';

// Inline TabBar using expo-router's tabBar prop for simpler integration
export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <CustomTabBar {...props} />}
    >
      <Tabs.Screen name="index" options={{ title: 'Today' }} />
      <Tabs.Screen name="report" options={{ title: 'Report' }} />
      <Tabs.Screen name="health" options={{ title: 'Health' }} />
      <Tabs.Screen name="more" options={{ title: 'More' }} />
    </Tabs>
  );
}

type TabRouteName = 'index' | 'report' | 'health' | 'more';

const TAB_CONFIG: Record<
  TabRouteName,
  { label: string; icon: keyof typeof MaterialCommunityIcons.glyphMap; iconActive: keyof typeof MaterialCommunityIcons.glyphMap }
> = {
  index:  { label: 'Today',  icon: 'home-outline',  iconActive: 'home' },
  report: { label: 'Report', icon: 'chart-bar',      iconActive: 'chart-bar' },
  health: { label: 'Health', icon: 'heart-pulse',    iconActive: 'heart-pulse' },
  more:   { label: 'More',   icon: 'cog-outline',    iconActive: 'cog' },
};

function CustomTabBar({ state, navigation }: { state: any; navigation: any }) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      {state.routes.map((route: any, index: number) => {
        const isFocused = state.index === index;
        const config = TAB_CONFIG[route.name as TabRouteName];
        if (!config) return null;

        const color = isFocused ? COLORS.greenAccent : COLORS.textSecondary;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <TouchableOpacity
            key={route.key}
            style={styles.tab}
            onPress={onPress}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityState={{ selected: isFocused }}
          >
            <MaterialCommunityIcons
              name={isFocused ? config.iconActive : config.icon}
              size={24}
              color={color}
            />
            <Text style={[styles.label, { color }]}>{config.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#111626',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#1A2135',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    minHeight: 52,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});
