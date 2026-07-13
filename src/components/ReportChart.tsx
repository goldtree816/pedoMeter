import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';
import { useSettings, StepRecord } from '../context/SettingsContext';

const CHART_HEIGHT = 180;
const BAR_MAX_HEIGHT = 140;

export default function ReportChart() {
  const { records, dailyGoal, distanceUnit } = useSettings();
  const [selectedDayIndex, setSelectedDayIndex] = useState<number | null>(null);

  // Get the last 7 days records, oldest first (for left-to-right reading in chart)
  const getChartData = () => {
    const data = [];
    const weekdayLetters = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayName = weekdayLetters[d.getDay()];
      
      const record = records.find((r) => {
        const rd = new Date(r.date);
        return (
          rd.getFullYear() === d.getFullYear() &&
          rd.getMonth() === d.getMonth() &&
          rd.getDate() === d.getDate()
        );
      });

      data.push({
        dayName,
        steps: record ? record.steps : 0,
        calories: record ? record.calories : 0,
        distance: record ? record.distance : 0,
        metGoal: record ? record.steps >= dailyGoal : false,
        date: d,
      });
    }
    return data;
  };

  const chartData = getChartData();

  // Find max value in steps to scale the bar heights
  const maxSteps = Math.max(...chartData.map((d) => d.steps), 6000); // minimum scale is 6000 steps

  return (
    <View style={styles.chartContainer}>
      
      {/* Tooltip Header showing details of tapped day */}
      <View style={styles.tooltipHeader}>
        {selectedDayIndex !== null ? (
          <View style={styles.tooltipContent}>
            <View style={styles.tooltipTitleRow}>
              <Text style={styles.tooltipDay}>
                {chartData[selectedDayIndex].date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
              </Text>
              {chartData[selectedDayIndex].metGoal && (
                <View style={styles.goalMetBadge}>
                  <Text style={styles.goalMetBadgeText}>GOAL MET</Text>
                </View>
              )}
            </View>
            
            <View style={styles.tooltipStatsRow}>
              <View style={styles.tooltipStat}>
                <Text style={styles.tooltipVal}>{chartData[selectedDayIndex].steps}</Text>
                <Text style={styles.tooltipLabel}>Steps</Text>
              </View>
              <View style={styles.tooltipStat}>
                <Text style={styles.tooltipVal}>{chartData[selectedDayIndex].distance.toFixed(2)} {distanceUnit}</Text>
                <Text style={styles.tooltipLabel}>Distance</Text>
              </View>
              <View style={styles.tooltipStat}>
                <Text style={styles.tooltipVal}>{chartData[selectedDayIndex].calories} kcal</Text>
                <Text style={styles.tooltipLabel}>Calories</Text>
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.placeholderTooltip}>
            <MaterialCommunityIcons name="gesture-tap" size={18} color={COLORS.textSecondary} />
            <Text style={styles.placeholderTooltipText}>Tap a bar to view detailed steps history</Text>
          </View>
        )}
      </View>

      {/* Bars row */}
      <View style={styles.barsContainer}>
        {chartData.map((data, index) => {
          const barHeight = (data.steps / maxSteps) * BAR_MAX_HEIGHT;
          const isSelected = selectedDayIndex === index;
          
          return (
            <TouchableOpacity
              key={index}
              style={styles.barColumn}
              activeOpacity={0.8}
              onPress={() => setSelectedDayIndex(isSelected ? null : index)}
            >
              {/* Steps count small text on top of active bar */}
              {data.steps > 0 && (
                <Text style={[styles.barStepsValue, isSelected && styles.activeBarStepsVal]}>
                  {data.steps > 1000 ? `${(data.steps / 1000).toFixed(1)}k` : data.steps}
                </Text>
              )}
              
              {/* Bar view */}
              <View style={styles.barTrack}>
                <View 
                  style={[
                    styles.barFill, 
                    { height: Math.max(8, barHeight) },
                    data.metGoal && styles.barFillGoalMet,
                    isSelected && styles.barFillSelected
                  ]} 
                />
              </View>

              {/* Day Label */}
              <Text style={[styles.barDayLabel, isSelected && styles.activeBarDayLabel]}>
                {data.dayName}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
      
      {/* Target range indicator */}
      <View style={styles.targetLegend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendIndicator, { backgroundColor: COLORS.greenAccent }]} />
          <Text style={styles.legendText}>Goal Met (≥{dailyGoal})</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendIndicator, { backgroundColor: '#3D4763' }]} />
          <Text style={styles.legendText}>In Progress</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  chartContainer: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  tooltipHeader: {
    height: 75,
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#242F4D',
    marginBottom: 16,
    paddingBottom: 10,
  },
  tooltipContent: {
    flex: 1,
  },
  tooltipTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  tooltipDay: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  goalMetBadge: {
    backgroundColor: 'rgba(38, 195, 106, 0.15)',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  goalMetBadgeText: {
    fontSize: 9,
    color: COLORS.greenAccent,
    fontWeight: '800',
  },
  tooltipStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  tooltipStat: {
    alignItems: 'flex-start',
  },
  tooltipVal: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  tooltipLabel: {
    fontSize: 10,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  placeholderTooltip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  placeholderTooltipText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  barsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: CHART_HEIGHT,
    paddingHorizontal: 4,
  },
  barColumn: {
    alignItems: 'center',
    flex: 1,
  },
  barStepsValue: {
    fontSize: 10,
    color: COLORS.textSecondary,
    fontWeight: '700',
    marginBottom: 4,
  },
  activeBarStepsVal: {
    color: COLORS.greenAccent,
  },
  barTrack: {
    height: BAR_MAX_HEIGHT,
    width: 14,
    backgroundColor: COLORS.progressTrack,
    borderRadius: 7,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    backgroundColor: '#3D4763', // default in progress color
    borderRadius: 7,
  },
  barFillGoalMet: {
    backgroundColor: 'rgba(38, 195, 106, 0.6)', // goal met translucent green
  },
  barFillSelected: {
    backgroundColor: COLORS.greenAccent, // highlighted goal color
  },
  barDayLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '700',
    marginTop: 8,
  },
  activeBarDayLabel: {
    color: '#FFFFFF',
  },
  targetLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#242F4D',
    paddingTop: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
});
