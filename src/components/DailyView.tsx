import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { COLORS, SPACING } from '../constants/theme';

import CategoryDetailScreen from './CategoryDetailScreen';
import HotWorkoutDetailScreen from './HotWorkoutDetailScreen';

// ─── Category tiles config ────────────────────────────────────────────────────
const CATEGORIES = [
  {
    id: 'cat-1',
    label: 'Fast\nworkout',
    bgColor: '#1E2741',
    icon: 'lightning-bolt' as const,
    iconColor: '#F6C444',
    iconBg: 'rgba(255,118,75,0.15)',
  },
  {
    id: 'cat-2',
    label: 'Stretch',
    bgColor: '#4A35A0',
    icon: 'human-handsup' as const,
    iconColor: '#FFFFFF',
    iconBg: 'rgba(156,126,240,0.2)',
  },
  {
    id: 'cat-3',
    label: 'Pain\nrelief',
    bgColor: '#2A1A1A',
    icon: 'heart-pulse' as const,
    iconColor: '#EF5350',
    iconBg: 'rgba(239,83,80,0.15)',
  },
  {
    id: 'cat-4',
    label: 'Body\nfocus',
    bgColor: '#3D2811',
    icon: 'weight-lifter' as const,
    iconColor: '#F6C444',
    iconBg: 'rgba(246,196,68,0.15)',
  },
  {
    id: 'cat-5',
    label: 'Warm up',
    bgColor: '#0D4F8C',
    icon: 'run-fast' as const,
    iconColor: '#29B6F6',
    iconBg: 'rgba(41,182,246,0.15)',
  },
];

// ─── Hot workout list ─────────────────────────────────────────────────────────
const HOT_WORKOUTS = [
  { id: 'hw-1',  name: 'Fat burning HIIT',              usedBy: '514,743', icon: 'fire',            iconColor: '#FF764B', bg: '#2A1A14' },
  { id: 'hw-2',  name: '2 min chest workout',           usedBy: '516,667', icon: 'dumbbell',        iconColor: '#29B6F6', bg: '#1A2635' },
  { id: 'hw-3',  name: '2 min flat belly',              usedBy: '815,644', icon: 'human',           iconColor: '#26C36A', bg: '#142614' },
  { id: 'hw-4',  name: 'ONLY 4 moves for abs',          usedBy: '976,165', icon: 'arm-flex',        iconColor: '#F6C444', bg: '#2A2510' },
  { id: 'hw-5',  name: 'Pre-run warm up',               usedBy: '129,938', icon: 'run',             iconColor: '#FF764B', bg: '#2A1A14' },
  { id: 'hw-6',  name: 'Morning warm up',               usedBy: '334,202', icon: 'weather-sunny',   iconColor: '#F6C444', bg: '#2A2510' },
  { id: 'hw-7',  name: 'Sleepy time stretching',        usedBy: '593,880', icon: 'sleep',           iconColor: '#9C7EF0', bg: '#1E1A35' },
  { id: 'hw-8',  name: 'Neck & shoulder tension relief',usedBy: '213,147', icon: 'human-handsup',   iconColor: '#29B6F6', bg: '#1A2635' },
  { id: 'hw-9',  name: 'Full body stretching',          usedBy: '775,523', icon: 'yoga',            iconColor: '#26C36A', bg: '#142614' },
  { id: 'hw-10', name: 'Shoulder tension relief',       usedBy: '293,982', icon: 'human-male',      iconColor: '#EF5350', bg: '#2A1414' },
];

// ─── Layout helpers ───────────────────────────────────────────────────────────
// Arranges 5 categories into two stacked columns (2 + 2) + one solo column (1)
const COL_A = [CATEGORIES[0], CATEGORIES[3]]; // Fast workout, Body focus
const COL_B = [CATEGORIES[1], CATEGORIES[4]]; // Stretch, Warm up
const COL_C = [CATEGORIES[2]];                // Pain relief

export default function DailyView() {
  // Category detail modal state
  const [activeCatId, setActiveCatId] = useState<string | null>(null);
  const [savedWorkouts, setSavedWorkouts] = useState<string[]>([]);
  // Hot workout detail modal state
  const [activeHotId, setActiveHotId] = useState<string | null>(null);

  const openCategory = (id: string) => setActiveCatId(id);
  const closeCategory = () => setActiveCatId(null);

  const openHotWorkout = (id: string) => setActiveHotId(id);
  const closeHotWorkout = () => setActiveHotId(null);

  const toggleSave = (id: string) =>
    setSavedWorkouts((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  // ─── Tile renderer ──────────────────────────────────────────────────────────
  const renderTile = (cat: typeof CATEGORIES[0]) => (
    <TouchableOpacity
      key={cat.id}
      style={[styles.categoryTile, { backgroundColor: cat.bgColor }]}
      activeOpacity={0.82}
      onPress={() => openCategory(cat.id)}
    >
      <Text style={styles.categoryLabel}>{cat.label}</Text>
      <View style={[styles.catIconCircle, { backgroundColor: cat.iconBg }]}>
        <MaterialCommunityIcons name={cat.icon} size={26} color={cat.iconColor} />
      </View>
    </TouchableOpacity>
  );

  return (
    <>
      {/* ── Category Detail Modal ── */}
      <CategoryDetailScreen
        visible={activeCatId !== null}
        categoryId={activeCatId}
        onClose={closeCategory}
      />

      {/* ── Hot Workout Detail Modal ── */}
      <HotWorkoutDetailScreen
        visible={activeHotId !== null}
        workoutId={activeHotId}
        onClose={closeHotWorkout}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* ── Guess You Might Need ── */}
        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>Guess you might need</Text>
          <View style={styles.sectionActions}>
            <TouchableOpacity style={styles.iconBtn}>
              <MaterialCommunityIcons name="history" size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconBtn}>
              <MaterialCommunityIcons name="dots-vertical" size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Category grid: scrollable horizontal, 2-col + solo */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryScroll}
        >
          {/* Column A: Fast workout + Body focus */}
          <View style={styles.categoryColumn}>
            {COL_A.map(renderTile)}
          </View>

          {/* Column B: Stretch + Warm up */}
          <View style={styles.categoryColumn}>
            {COL_B.map(renderTile)}
          </View>

          {/* Column C: Pain relief (solo tile, full height) */}
          <View style={styles.categoryColumn}>
            {COL_C.map(renderTile)}
          </View>
        </ScrollView>

        {/* ── Hot Section ── */}
        <View style={styles.hotCard}>
          <View style={styles.hotHeader}>
            <View>
              <Text style={styles.hotTitle}>Hot</Text>
              <Text style={styles.hotSubtitle}>{HOT_WORKOUTS.length} Workouts</Text>
            </View>
            <View style={styles.hotAvatarCircle}>
              <MaterialCommunityIcons name="fire" size={28} color="#FF764B" />
            </View>
          </View>

          {HOT_WORKOUTS.map((workout, index) => (
            <TouchableOpacity
              key={workout.id}
              style={[
                styles.workoutRow,
                index < HOT_WORKOUTS.length - 1 && styles.workoutRowBorder,
              ]}
              activeOpacity={0.75}
              onPress={() => openHotWorkout(workout.id)}
            >
              <View style={[styles.workoutThumb, { backgroundColor: workout.bg }]}>
                <MaterialCommunityIcons name={workout.icon as any} size={32} color={workout.iconColor} />
              </View>

              <View style={styles.workoutInfo}>
                <Text style={styles.workoutName} numberOfLines={2}>
                  {workout.name}
                </Text>
                <Text style={styles.workoutUsed}>Used by {workout.usedBy} people</Text>
              </View>

              <TouchableOpacity
                style={styles.bookmarkBtn}
                onPress={() => toggleSave(workout.id)}
              >
                <MaterialCommunityIcons
                  name={savedWorkouts.includes(workout.id) ? 'bookmark' : 'bookmark-outline'}
                  size={20}
                  color={savedWorkouts.includes(workout.id) ? COLORS.greenAccent : COLORS.textSecondary}
                />
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
        </View>


        <View style={{ height: 40 }} />
      </ScrollView>
    </>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: SPACING.four,
    paddingTop: 12,
  },

  // ── Section header
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  sectionSub: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  sectionActions: {
    flexDirection: 'row',
    gap: 4,
  },
  iconBtn: {
    padding: 6,
  },

  // ── Category grid
  categoryScroll: {
    gap: 10,
    marginBottom: 20,
    paddingRight: 4,
  },
  categoryColumn: {
    gap: 10,
  },
  categoryTile: {
    width: 148,
    height: 100,
    borderRadius: 20,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  categoryLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: 20,
    flex: 1,
  },
  catIconCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Hot card
  hotCard: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
  },
  hotHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  hotTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  hotSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '600',
    marginTop: 2,
  },
  hotAvatarCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255,118,75,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,118,75,0.25)',
  },

  // ── Workout row
  workoutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 14,
  },
  workoutRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  workoutThumb: {
    width: 64,
    height: 64,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  workoutInfo: {
    flex: 1,
    gap: 4,
  },
  workoutName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    lineHeight: 20,
  },
  workoutUsed: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  bookmarkBtn: {
    padding: 6,
  },

});
