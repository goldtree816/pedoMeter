import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { COLORS } from '../../constants/theme';
import TopTabsHeader, { SubTab } from '../../components/TopTabsHeader';
import TodayDashboard from '../../components/TodayDashboard';
import WalkingPlan from '../../components/WalkingPlan';
import DailyView from '../../components/DailyView';

export default function DashboardScreen() {
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('today');

  const renderSubView = () => {
    switch (activeSubTab) {
      case 'today':
        return <TodayDashboard />;
      case 'plan':
        // Clicking "Next" in WalkingPlan moves user to Daily view
        return <WalkingPlan onNextPress={() => setActiveSubTab('daily')} />;
      case 'daily':
        return <DailyView />;
      default:
        return <TodayDashboard />;
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="light" />
      
      {/* Top Header Navigation (Today | Plan | Daily) */}
      <TopTabsHeader 
        activeTab={activeSubTab} 
        onTabChange={(tab) => setActiveSubTab(tab)} 
        onRightPress={() => {
          // Toggle between Dashboard and Plan as a shortcut
          setActiveSubTab(activeSubTab === 'today' ? 'plan' : 'today');
        }}
      />

      {/* Render the Active Tab Sub-view */}
      <View style={styles.content}>
        {renderSubView()}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
  },
});
