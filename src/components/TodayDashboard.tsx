import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { COLORS, SPACING } from '../constants/theme';
import { useSettings, StepRecord } from '../context/SettingsContext';

export default function TodayDashboard() {
  const router = useRouter();
  const {
    records,
    dailyGoal,
    isPaused,
    waterIntake,
    waterGoal,
    distanceUnit,
    addWater,
    setIsPaused,
  } = useSettings();

  // Find today's record
  const todayRecord = records.find((r) => {
    const today = new Date();
    const d = new Date(r.date);
    return (
      d.getFullYear() === today.getFullYear() &&
      d.getMonth() === today.getMonth() &&
      d.getDate() === today.getDate()
    );
  });

  const stepsToday = todayRecord ? todayRecord.steps : 0;
  const distanceToday = todayRecord ? todayRecord.distance : 0.0;
  const caloriesToday = todayRecord ? todayRecord.calories : 0.0;
  const activeDurationToday = todayRecord ? todayRecord.activeDuration : 0;

  // Format active duration, e.g. "0h 0m"
  const formatDuration = (mins: number) => {
    const hrs = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    return `${hrs}h ${remainingMins}m`;
  };

  // Calculate daily average steps of previous 7 days (including today)
  const calculateDailyAverage = () => {
    if (records.length === 0) return 0;
    const total = records.reduce((sum, r) => sum + r.steps, 0);
    return Math.round(total / Math.max(1, records.length));
  };

  const dailyAverage = calculateDailyAverage();

  // Recreate the last 7 days starting from 6 days ago to today
  const getWeekdayList = () => {
    const days = [];
    const weekdayLetters = ['S', 'M', 'T', 'W', 'T', 'F', 'S']; // Sunday = 0
    
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayOfWeek = d.getDay();
      const letter = weekdayLetters[dayOfWeek];
      
      // Find step count for this day
      const record = records.find((r) => {
        const rd = new Date(r.date);
        return (
          rd.getFullYear() === d.getFullYear() &&
          rd.getMonth() === d.getMonth() &&
          rd.getDate() === d.getDate()
        );
      });

      const steps = record ? record.steps : 0;
      const metGoal = steps >= dailyGoal;
      const isToday = i === 0;
      const isYesterday = i === 1;

      days.push({
        letter,
        metGoal,
        isToday,
        isYesterday,
        steps,
      });
    }
    return days;
  };

  const weekdays = getWeekdayList();

  // Water tracking calculations
  const glassesTotal = 4;
  const ozPerGlass = 6;
  const waterGlassesFilled = Math.min(glassesTotal, Math.floor(waterIntake / ozPerGlass));

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
      
      {/* 1. Main Dashboard Steps Card (Hero Section) */}
      <View style={styles.heroCard}>
        <View style={styles.heroHeader}>
          <View style={styles.stepsTextRow}>
            <TouchableOpacity onPress={() => router.push('/report-details?metric=Step')} activeOpacity={0.7}>
              <Text style={styles.stepsCount}>{stepsToday}</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.editIcon}
              onPress={() => router.push({ pathname: '/settings/new-record', params: { editId: todayRecord?.id } })}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="pencil" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity 
            style={styles.pauseButton}
            onPress={() => setIsPaused(!isPaused)}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons 
              name={isPaused ? "play" : "pause"} 
              size={20} 
              color="#FFFFFF" 
            />
          </TouchableOpacity>
        </View>

        <Text style={styles.goalText}>/{dailyGoal} Steps</Text>

        {/* Linear Progress Bar */}
        <View style={styles.progressBarTrack}>
          <View 
            style={[
              styles.progressBarFill, 
              { width: `${Math.min(100, Math.max(1, (stepsToday / dailyGoal) * 100))}%` }
            ]} 
          />
        </View>

        {/* Metrics Row */}
        <View style={styles.metricsRow}>
          {/* Distance */}
          <TouchableOpacity 
            style={styles.metricItem}
            activeOpacity={0.7}
            onPress={() => router.push('/report-details?metric=Distance')}
          >
            <View style={[styles.iconCircle, { backgroundColor: 'rgba(246, 196, 68, 0.15)' }]}>
              <MaterialCommunityIcons name="shoe-print" size={20} color={COLORS.yellow} />
            </View>
            <Text style={styles.metricValue}>{distanceToday.toFixed(2)}</Text>
            <Text style={styles.metricLabel}>{distanceUnit}</Text>
          </TouchableOpacity>

          {/* Calories */}
          <TouchableOpacity 
            style={styles.metricItem}
            activeOpacity={0.7}
            onPress={() => router.push('/report-details?metric=Calorie')}
          >
            <View style={[styles.iconCircle, { backgroundColor: 'rgba(255, 118, 75, 0.15)' }]}>
              <MaterialCommunityIcons name="fire" size={20} color={COLORS.orange} />
            </View>
            <Text style={styles.metricValue}>{caloriesToday.toFixed(1)}</Text>
            <Text style={styles.metricLabel}>Calories</Text>
          </TouchableOpacity>

          {/* Time */}
          <TouchableOpacity 
            style={styles.metricItem}
            activeOpacity={0.7}
            onPress={() => router.push('/report-details?metric=Time')}
          >
            <View style={[styles.iconCircle, { backgroundColor: 'rgba(41, 182, 246, 0.15)' }]}>
              <MaterialCommunityIcons name="clock-outline" size={20} color={COLORS.blue} />
            </View>
            <Text style={styles.metricValue}>{formatDuration(activeDurationToday)}</Text>
            <Text style={styles.metricLabel}>Time</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 2. Daily Average Weekday Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Daily average: <Text style={styles.boldText}>{dailyAverage}</Text></Text>
        
        <View style={styles.weekdayRow}>
          {weekdays.map((day, index) => {
            // Yesterday gets the solid green circle with white star (from Screenshot 2)
            const showStar = day.isYesterday && day.metGoal;
            
            return (
              <View key={index} style={styles.dayContainer}>
                <View 
                  style={[
                    styles.dayCircle,
                    showStar && styles.starCircle,
                    day.isToday && styles.todayCircle,
                    day.metGoal && !showStar && !day.isToday && styles.goalMetCircle
                  ]}
                >
                  {showStar ? (
                    <MaterialCommunityIcons name="star" size={16} color="#FFFFFF" />
                  ) : (
                    <Text 
                      style={[
                        styles.dayLetter, 
                        showStar && styles.activeLetter,
                        day.isToday && styles.todayLetter,
                        day.metGoal && !showStar && styles.goalMetLetter
                      ]}
                    >
                      {day.letter}
                    </Text>
                  )}
                  {day.isToday && <View style={styles.pulseDot} />}
                </View>
                <Text style={[styles.dayLabelSub, day.isToday && styles.todayLabelSubText]}>
                  {day.isToday ? 'T' : day.letter}
                </Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* 3. Water Tracker Card */}
      <View style={styles.card}>
        <View style={styles.waterHeader}>
          <Text style={styles.cardTitle}>Water: <Text style={styles.boldText}>{waterIntake} / {waterGoal} fl oz</Text></Text>
          <TouchableOpacity onPress={() => addWater(6)} activeOpacity={0.7}>
            <Text style={styles.moreButton}>More</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.glassesRow}>
          {Array.from({ length: glassesTotal }).map((_, i) => {
            const isFilled = i < waterGlassesFilled;
            const isNext = i === waterGlassesFilled;

            return (
              <TouchableOpacity
                key={i}
                style={[
                  styles.glassContainer,
                  isFilled && styles.filledGlass
                ]}
                activeOpacity={0.7}
                onPress={() => addWater(6)}
              >
                <MaterialCommunityIcons 
                  name={isFilled ? "cup" : "cup-outline"} 
                  size={32} 
                  color={isFilled ? COLORS.blue : "#5A6482"} 
                />
                {isNext && (
                  <View style={styles.glassPlusOverlay}>
                    <MaterialCommunityIcons name="plus" size={14} color="#FFFFFF" />
                  </View>
                )}
                <Text style={styles.glassLabel}>{ozPerGlass} fl oz</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: SPACING.four,
    paddingTop: 8,
  },
  heroCard: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 24,
    padding: 20,
    marginBottom: SPACING.four,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stepsTextRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 10,
  },
  stepsCount: {
    fontSize: 54,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -1,
  },
  editIcon: {
    padding: 4,
  },
  pauseButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#26304C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  goalText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '600',
    marginTop: -4,
    marginBottom: 16,
  },
  progressBarTrack: {
    height: 8,
    backgroundColor: COLORS.progressTrack,
    borderRadius: 4,
    marginBottom: 24,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: COLORS.greenAccent,
    borderRadius: 4,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#242F4D',
    paddingTop: 16,
  },
  metricItem: {
    alignItems: 'center',
    flex: 1,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  metricLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '600',
    marginTop: 2,
  },
  card: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 24,
    padding: 20,
    marginBottom: SPACING.four,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardTitle: {
    fontSize: 15,
    color: '#FFFFFF',
    fontWeight: '600',
    marginBottom: 16,
  },
  boldText: {
    fontWeight: '800',
  },
  weekdayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dayContainer: {
    alignItems: 'center',
    gap: 6,
  },
  dayCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#36405B',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  starCircle: {
    backgroundColor: COLORS.greenAccent,
    borderColor: COLORS.greenAccent,
  },
  goalMetCircle: {
    borderColor: COLORS.greenAccent,
  },
  todayCircle: {
    borderColor: '#FFFFFF',
  },
  dayLetter: {
    fontSize: 13,
    fontWeight: '700',
    color: '#5A6482',
  },
  activeLetter: {
    color: '#FFFFFF',
  },
  goalMetLetter: {
    color: COLORS.greenAccent,
  },
  todayLetter: {
    color: '#FFFFFF',
  },
  pulseDot: {
    position: 'absolute',
    bottom: -1,
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#FFFFFF',
  },
  dayLabelSub: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '700',
  },
  todayLabelSubText: {
    color: COLORS.greenAccent,
  },
  waterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  moreButton: {
    fontSize: 14,
    color: COLORS.greenAccent,
    fontWeight: '700',
  },
  glassesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  glassContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 60,
    height: 60,
    backgroundColor: '#161C2E',
    borderRadius: 12,
    position: 'relative',
    gap: 4,
  },
  filledGlass: {
    backgroundColor: 'rgba(41, 182, 246, 0.12)',
    borderColor: 'rgba(41, 182, 246, 0.2)',
    borderWidth: 1,
  },
  glassPlusOverlay: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: COLORS.greenAccent,
    borderRadius: 7,
    width: 14,
    height: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glassLabel: {
    fontSize: 9,
    color: COLORS.textSecondary,
    fontWeight: '700',
  },
});
