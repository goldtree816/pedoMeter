import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING } from '../constants/theme';

export type SubTab = 'today' | 'plan' | 'daily';

interface TopTabsHeaderProps {
  activeTab: SubTab;
  onTabChange: (tab: SubTab) => void;
  onRightPress?: () => void;
}

export default function TopTabsHeader({ activeTab, onTabChange, onRightPress }: TopTabsHeaderProps) {
  const tabs: { key: SubTab; label: string }[] = [
    { key: 'today', label: 'Today' },
    { key: 'plan', label: 'Plan' },
    { key: 'daily', label: 'Daily' },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.tabsRow}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={styles.tabItem}
              onPress={() => onTabChange(tab.key)}
              activeOpacity={0.7}
            >
              <Text style={[styles.tabText, isActive && styles.activeTabText]}>
                {tab.label}
              </Text>
              {isActive && <View style={styles.indicator} />}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Top right chevron button (from Screenshot 2) */}
      <TouchableOpacity
        style={styles.rightButton}
        activeOpacity={0.7}
        onPress={onRightPress}
      >
        <MaterialCommunityIcons name="chevron-down" size={20} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.four,
    paddingTop: 16,
    paddingBottom: 10,
    backgroundColor: 'transparent',
  },
  tabsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
  },
  tabItem: {
    alignItems: 'center',
    paddingVertical: 6,
    position: 'relative',
  },
  tabText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#8E98B0', // muted text secondary
  },
  activeTabText: {
    color: COLORS.greenAccent, // vibrant green active state
  },
  indicator: {
    position: 'absolute',
    bottom: -2,
    width: 28,
    height: 3,
    backgroundColor: COLORS.greenAccent,
    borderRadius: 2,
  },
  rightButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.greenAccent,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.greenAccent,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
});
