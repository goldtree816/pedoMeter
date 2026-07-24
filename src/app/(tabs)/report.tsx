import React, { useState, useCallback } from 'react';
import { useLocalSearchParams, useFocusEffect } from 'expo-router';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING } from '../../constants/theme';
import { useSettings } from '../../context/SettingsContext';

const { width } = Dimensions.get('window');
const CHART_WIDTH = width - 48;

type MetricTab = 'Step' | 'Calorie' | 'Time' | 'Distance';

// ─────────────────── helpers ────────────────────────────────────────────────

function getLast7Days(records: any[], dailyGoal: number) {
  const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const result = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const record = records.find((r) => {
      const rd = new Date(r.date);
      return (
        rd.getFullYear() === d.getFullYear() &&
        rd.getMonth() === d.getMonth() &&
        rd.getDate() === d.getDate()
      );
    });
    result.push({
      label: i === 0 ? 'Today' : days[d.getDay()],
      steps: record?.steps ?? 0,
      calories: record?.calories ?? 0,
      distance: record?.distance ?? 0,
      time: record?.activeDuration ?? 0,
      metGoal: record ? record.steps >= dailyGoal : false,
    });
  }
  return result;
}

function getTodayHours(records: any[]) {
  const today = new Date();
  const todayRecord = records.find((r) => {
    const d = new Date(r.date);
    return (
      d.getFullYear() === today.getFullYear() &&
      d.getMonth() === today.getMonth() &&
      d.getDate() === today.getDate()
    );
  });
  const totalSteps = todayRecord?.steps ?? 0;
  // Simulate hourly distribution
  const hours = [];
  const labels = ['06', '09', '12', '15', '18', '21', '24'];
  const distribution = [0.02, 0.08, 0.15, 0.12, 0.3, 0.25, 0.08];
  for (let i = 0; i < 7; i++) {
    hours.push({
      label: labels[i],
      steps: Math.round(totalSteps * distribution[i]),
    });
  }
  return hours;
}

function getMonthBars(records: any[], dailyGoal: number) {
  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const bars: { label: string; steps: number; metGoal: boolean }[] = [];
  // Show ~6 sample points across the month
  const sampleDays = [3, 9, 15, 21, 27];
  sampleDays.forEach((day) => {
    const d = new Date(now.getFullYear(), now.getMonth(), day);
    const record = records.find((r) => {
      const rd = new Date(r.date);
      return (
        rd.getFullYear() === d.getFullYear() &&
        rd.getMonth() === d.getMonth() &&
        rd.getDate() === d.getDate()
      );
    });
    const monthAbbr = d.toLocaleDateString('en-US', { month: 'short' });
    bars.push({
      label: `${monthAbbr} ${day}`,
      steps: record?.steps ?? 0,
      metGoal: record ? record.steps >= dailyGoal : false,
    });
  });
  return bars;
}

function getYearBars(records: any[]) {
  const now = new Date();
  const monthLabels = ['Jan', 'Mar', 'May', 'Jul', 'Sept', 'Nov'];
  const monthIndices = [0, 2, 4, 6, 8, 10];
  return monthLabels.map((label, idx) => {
    const monthTotal = records
      .filter((r) => {
        const d = new Date(r.date);
        return d.getFullYear() === now.getFullYear() && d.getMonth() === monthIndices[idx];
      })
      .reduce((sum, r) => sum + r.steps, 0);
    return { label, steps: monthTotal };
  });
}

// ─────────────────── sub-components ─────────────────────────────────────────

function GoalBadge({ value, color = COLORS.greenAccent }: { value: number; color?: string }) {
  return (
    <View style={[goalBadgeStyles.badge, { backgroundColor: color }]}>
      <Text style={goalBadgeStyles.text}>{value.toLocaleString()}</Text>
    </View>
  );
}

const goalBadgeStyles = StyleSheet.create({
  badge: {
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  text: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '800',
  },
});

interface BarChartProps {
  data: { label: string; steps: number; metGoal?: boolean }[];
  goalLine?: number;
  maxValue?: number;
  barWidth?: number;
  height?: number;
  showGoalBadge?: boolean;
  activeMetric?: MetricTab;
  metricValues?: number[];
  distanceUnit?: string;
}

function BarChart({
  data,
  goalLine,
  maxValue,
  barWidth = 18,
  height = 120,
  showGoalBadge = false,
  activeMetric = 'Step',
  metricValues,
  distanceUnit = 'Mile',
}: BarChartProps) {
  const values = metricValues ?? data.map((d) => d.steps);
  const max = maxValue ?? Math.max(...values, 1);

  return (
    <View style={{ height: height + 40, position: 'relative', marginTop: 8 }}>
      {/* Goal dashed line */}
      {goalLine !== undefined && max > 0 && (
        <View
          style={{
            position: 'absolute',
            top: height - (goalLine / max) * height,
            left: 0,
            right: 0,
            flexDirection: 'row',
            alignItems: 'center',
          }}
          pointerEvents="none"
        >
          {showGoalBadge && <GoalBadge value={goalLine} />}
          <View
            style={{
              flex: 1,
              borderTopWidth: 1.5,
              borderColor: COLORS.greenAccent,
              borderStyle: 'dashed',
              marginLeft: showGoalBadge ? 4 : 0,
            }}
          />
        </View>
      )}

      {/* Y-axis labels */}
      {goalLine !== undefined && (
        <>
          <Text
            style={{
              position: 'absolute',
              left: 0,
              top: height - (goalLine / max) * height - 8,
              color: COLORS.textSecondary,
              fontSize: 10,
              width: 40,
            }}
          >
            {goalLine.toLocaleString()}
          </Text>
          <Text
            style={{
              position: 'absolute',
              left: 0,
              bottom: 24,
              color: COLORS.textSecondary,
              fontSize: 10,
            }}
          >
            0
          </Text>
        </>
      )}

      {/* Bars */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'flex-end',
          height: height,
          justifyContent: 'space-around',
          paddingLeft: goalLine !== undefined ? 44 : 0,
        }}
      >
        {data.map((item, idx) => {
          const val = metricValues ? metricValues[idx] : item.steps;
          const barH = max > 0 ? Math.max(val > 0 ? 4 : 0, (val / max) * height) : 0;
          const isGreen = item.metGoal;

          return (
            <View key={idx} style={{ alignItems: 'center', flex: 1 }}>
              {val > 0 && (
                <View
                  style={{
                    backgroundColor: COLORS.greenAccent,
                    borderRadius: 4,
                    paddingHorizontal: 4,
                    paddingVertical: 1,
                    marginBottom: 2,
                  }}
                >
                  <Text style={{ color: '#fff', fontSize: 9, fontWeight: '700' }}>
                    {val > 1000 ? `${(val / 1000).toFixed(1)}k` : Math.round(val)}
                  </Text>
                </View>
              )}
              <View
                style={{
                  width: barWidth,
                  height: barH,
                  backgroundColor: isGreen
                    ? COLORS.greenAccent
                    : val > 0
                    ? '#3D5068'
                    : 'transparent',
                  borderRadius: 4,
                }}
              />
            </View>
          );
        })}
      </View>

      {/* X-axis labels */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-around',
          paddingLeft: goalLine !== undefined ? 44 : 0,
          marginTop: 6,
        }}
      >
        {data.map((item, idx) => (
          <Text
            key={idx}
            style={{
              flex: 1,
              textAlign: 'center',
              color: COLORS.textSecondary,
              fontSize: 10,
              fontWeight: '600',
            }}
          >
            {item.label}
          </Text>
        ))}
      </View>
    </View>
  );
}

// ─────────────────── main screen ─────────────────────────────────────────────

export default function ReportScreen() {
  const { records, dailyGoal, distanceUnit } = useSettings();
  const { metric } = useLocalSearchParams<{ metric?: MetricTab }>();
  const [activeTab, setActiveTab] = useState<MetricTab>('Step');

  useFocusEffect(
    useCallback(() => {
      if (metric && ['Step', 'Calorie', 'Time', 'Distance'].includes(metric)) {
        setActiveTab(metric);
      }
    }, [metric])
  );

  const weekData = getLast7Days(records, dailyGoal);
  const todayHours = getTodayHours(records);
  const monthData = getMonthBars(records, dailyGoal);
  const yearData = getYearBars(records);

  const getWeekMetricValues = () => {
    switch (activeTab) {
      case 'Calorie':
        return weekData.map((d) => d.calories);
      case 'Time':
        return weekData.map((d) => d.time);
      case 'Distance':
        return weekData.map((d) => d.distance);
      default:
        return weekData.map((d) => d.steps);
    }
  };

  const weekGoalLine =
    activeTab === 'Step'
      ? dailyGoal
      : activeTab === 'Calorie'
      ? Math.round(dailyGoal * 0.04)
      : undefined;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Report</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* Challenge Banner */}
        <View style={styles.challengeCard}>
          <View style={styles.challengeLeft}>
            <View style={styles.challengeBadge}>
              <Text style={styles.challengeBadgeNum}>12</Text>
              <MaterialCommunityIcons name="shield" size={32} color={COLORS.greenAccent} style={StyleSheet.absoluteFill} />
            </View>
          </View>
          <View style={styles.challengeInfo}>
            <View style={styles.challengeRow}>
              <Text style={styles.challengeName}>Conquer Olympus</Text>
              <Text style={styles.challengeMile}>1.6 Mile left</Text>
            </View>
            <View style={styles.progressTrackOuter}>
              <View style={[styles.progressTrackFill, { width: '78%' }]} />
            </View>
          </View>
        </View>

        {/* Week Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Week</Text>
            <TouchableOpacity>
              <Text style={styles.moreLink}>More</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.chartCard}>
            <BarChart
              data={weekData}
              goalLine={weekGoalLine}
              maxValue={Math.max(...getWeekMetricValues(), weekGoalLine ?? 1, 1) * 1.2}
              barWidth={16}
              height={130}
              showGoalBadge={true}
              metricValues={getWeekMetricValues()}
              distanceUnit={distanceUnit}
            />

            {/* Metric Tabs */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.tabsRow}
              contentContainerStyle={styles.tabsContent}
            >
              {(['Step', 'Calorie', 'Time', 'Distance'] as MetricTab[]).map((tab) => (
                <TouchableOpacity
                  key={tab}
                  style={[styles.tabBtn, activeTab === tab && styles.tabBtnActive]}
                  onPress={() => setActiveTab(tab)}
                >
                  <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                    {tab}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>

        {/* Today Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Today</Text>
            <TouchableOpacity>
              <Text style={styles.moreLink}>More</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.chartCard}>
            <BarChart
              data={todayHours.map((h) => ({ label: h.label, steps: h.steps }))}
              barWidth={18}
              height={110}
              showGoalBadge={false}
            />
          </View>
        </View>

        {/* Month Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Month</Text>
            <TouchableOpacity>
              <Text style={styles.moreLink}>More</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.chartCard}>
            <Text style={styles.yAxisTop}>10000</Text>
            <BarChart
              data={monthData}
              goalLine={dailyGoal}
              maxValue={Math.max(...monthData.map((d) => d.steps), 10000) * 1.1}
              barWidth={22}
              height={120}
              showGoalBadge={true}
            />
          </View>
        </View>

        {/* Year Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Year</Text>
          </View>

          <View style={styles.chartCard}>
            <Text style={styles.yAxisTop}>20000</Text>
            <BarChart
              data={yearData.map((d) => ({ label: d.label, steps: d.steps }))}
              barWidth={24}
              height={130}
              showGoalBadge={false}
            />
          </View>
        </View>

        {/* Feedback row */}
        <View style={styles.feedbackRow}>
          <Text style={styles.feedbackText}>Got feedback or questions? Tell us</Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingHorizontal: SPACING.four,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  scrollContent: {
    paddingHorizontal: SPACING.four,
    paddingTop: 8,
  },

  // Challenge banner
  challengeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBackground,
    borderRadius: 16,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 12,
  },
  challengeLeft: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  challengeBadge: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2A1F4E',
    borderRadius: 8,
  },
  challengeBadgeNum: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
    zIndex: 1,
  },
  challengeInfo: {
    flex: 1,
    gap: 8,
  },
  challengeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  challengeName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  challengeMile: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  progressTrackOuter: {
    height: 8,
    backgroundColor: COLORS.progressTrack,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressTrackFill: {
    height: 8,
    backgroundColor: COLORS.greenAccent,
    borderRadius: 4,
  },

  // Sections
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  moreLink: {
    fontSize: 14,
    color: COLORS.greenAccent,
    fontWeight: '700',
  },
  chartCard: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  yAxisTop: {
    color: COLORS.textSecondary,
    fontSize: 10,
    marginBottom: 2,
  },

  // Metric tabs
  tabsRow: {
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 12,
  },
  tabsContent: {
    gap: 8,
    paddingRight: 4,
  },
  tabBtn: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.progressTrack,
  },
  tabBtnActive: {
    backgroundColor: COLORS.greenAccent,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  tabTextActive: {
    color: '#FFFFFF',
  },

  // Feedback
  feedbackRow: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  feedbackText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
});
