import React, { useState } from 'react';
import { Platform, View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';
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

      {Platform.OS === 'android' && (
        <View style={styles.adContainer}>
          <BannerAd
            unitId="ca-app-pub-6741963315615698/6978203749"
            size={BannerAdSize.BANNER}
            onAdFailedToLoad={(error) => {
              console.warn('[AdMob] Banner failed to load', error);
            }}
          />
        </View>
      )}
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
  adContainer: {
    alignItems: 'center',
    backgroundColor: COLORS.background,
    minHeight: 50,
    paddingVertical: 4,
  },
});
