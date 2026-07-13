import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../constants/theme';

// Using a minimal type for the TabBar props compatible with expo-router's internal tab bar
interface TabRoute {
  key: string;
  name: string;
}

interface TabBarProps {
  state: {
    index: number;
    routes: TabRoute[];
  };
  navigation: {
    emit: (event: { type: string; target: string; canPreventDefault?: boolean }) => { defaultPrevented: boolean };
    navigate: (name: string) => void;
  };
}

type TabRouteName = 'index' | 'report' | 'health' | 'more';

const TAB_CONFIG: Record<
  TabRouteName,
  { label: string; icon: keyof typeof MaterialCommunityIcons.glyphMap; iconActive: keyof typeof MaterialCommunityIcons.glyphMap }
> = {
  index: { label: 'Today', icon: 'home-outline', iconActive: 'home' },
  report: { label: 'Report', icon: 'chart-bar', iconActive: 'chart-bar' },
  health: { label: 'Health', icon: 'heart-pulse', iconActive: 'heart-pulse' },
  more: { label: 'More', icon: 'cog-outline', iconActive: 'cog' },
};

export default function TabBar({ state, navigation }: TabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      {state.routes.map((route, index) => {
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
            accessibilityLabel={config.label}
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
