import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING } from '../constants/theme';

// ─── Types ────────────────────────────────────────────────────────────────────
export interface ExerciseStep {
  id: string;
  name: string;
  desc: string;
  durationSec: number;
  icon: string;
  iconColor: string;
  bg: string;
}

export interface HotWorkoutDetail {
  id: string;
  name: string;
  subtitle: string;
  kcal: number;
  durationMin: number;
  accentColor: string;
  exercises: ExerciseStep[];
}

// ─── Workout data ─────────────────────────────────────────────────────────────
export const HOT_WORKOUT_DETAILS: HotWorkoutDetail[] = [
  {
    id: 'hw-1',
    name: 'Fat Burning HIIT',
    subtitle: 'Burn fat more effectively',
    kcal: 30,
    durationMin: 2,
    accentColor: '#FF764B',
    exercises: [
      { id: 'hw1-1', name: 'Skipping Without Rope', desc: 'Mimic jump rope motion with high knees. Burns calories fast and warms up the whole body.', durationSec: 20, icon: 'run-fast', iconColor: '#FF764B', bg: '#2A1A14' },
      { id: 'hw1-2', name: 'Cross Knee Plank',      desc: 'From plank position, drive alternating knees toward opposite elbows. Targets core and obliques.', durationSec: 20, icon: 'human',    iconColor: '#29B6F6', bg: '#1A2635' },
      { id: 'hw1-3', name: 'Modified Burpees',      desc: 'Squat, kick legs back, return, and jump. A full-body fat-torching movement at moderate pace.', durationSec: 20, icon: 'arm-flex', iconColor: '#26C36A', bg: '#142614' },
      { id: 'hw1-4', name: 'Burpees',               desc: 'Full burpee with explosive jump at the top. Maximum calorie burn in minimum time.', durationSec: 20, icon: 'weight-lifter', iconColor: '#F6C444', bg: '#2A2510' },
    ],
  },
  {
    id: 'hw-2',
    name: '2 Min Chest Workout',
    subtitle: 'Quick bigger chest building',
    kcal: 20,
    durationMin: 2,
    accentColor: '#29B6F6',
    exercises: [
      { id: 'hw2-1', name: 'Wide Push-Ups',         desc: 'Hands wider than shoulders to maximally engage the outer chest fibres.', durationSec: 20, icon: 'dumbbell',  iconColor: '#29B6F6', bg: '#1A2635' },
      { id: 'hw2-2', name: 'Diamond Push-Ups',      desc: 'Hands form a diamond under the chest, heavily loading inner chest and triceps.', durationSec: 20, icon: 'arm-flex', iconColor: '#F6C444', bg: '#2A2510' },
      { id: 'hw2-3', name: 'Chest Dips (chairs)',   desc: 'Lower between two sturdy chairs to stretch and strengthen the lower chest.', durationSec: 20, icon: 'weight-lifter', iconColor: '#26C36A', bg: '#142614' },
      { id: 'hw2-4', name: 'Decline Push-Ups',      desc: 'Feet elevated to shift load to the upper chest and front deltoids.', durationSec: 20, icon: 'run',       iconColor: '#FF764B', bg: '#2A1A14' },
      { id: 'hw2-5', name: 'Pulse Push-Ups',        desc: 'Small pulsing reps at the bottom half of a push-up keep muscles under constant tension.', durationSec: 20, icon: 'human',    iconColor: '#9C7EF0', bg: '#1E1A35' },
    ],
  },
  {
    id: 'hw-3',
    name: '2 Min Flat Belly',
    subtitle: 'Strengthen abs and improve endurance',
    kcal: 18,
    durationMin: 2,
    accentColor: '#26C36A',
    exercises: [
      { id: 'hw3-1', name: 'Crunches',              desc: 'Classic upper-ab crunch — lift shoulder blades off the floor while keeping lower back down.', durationSec: 20, icon: 'human',    iconColor: '#26C36A', bg: '#142614' },
      { id: 'hw3-2', name: 'Bicycle Crunches',      desc: 'Alternating elbow-to-knee twists that hit both upper and lower abs along with the obliques.', durationSec: 20, icon: 'run',       iconColor: '#FF764B', bg: '#2A1A14' },
      { id: 'hw3-3', name: 'Leg Raises',            desc: 'Lying flat, raise straight legs to 90° to deeply engage the lower abdominal region.', durationSec: 20, icon: 'arm-flex', iconColor: '#F6C444', bg: '#2A2510' },
      { id: 'hw3-4', name: 'Plank Hold',            desc: 'Hold a straight-line plank on forearms for overall core stability and endurance.', durationSec: 20, icon: 'dumbbell',  iconColor: '#29B6F6', bg: '#1A2635' },
      { id: 'hw3-5', name: 'Mountain Climbers',     desc: 'Drive knees alternately into the chest from plank — cardio meets core in one move.', durationSec: 20, icon: 'run-fast', iconColor: '#9C7EF0', bg: '#1E1A35' },
    ],
  },
  {
    id: 'hw-4',
    name: 'Only 4 Moves for Abs',
    subtitle: 'Quick and effective core training',
    kcal: 22,
    durationMin: 4,
    accentColor: '#F6C444',
    exercises: [
      { id: 'hw4-1', name: 'Crunches',              desc: 'Controlled upward crunch to peak-contract the rectus abdominis.', durationSec: 30, icon: 'arm-flex', iconColor: '#F6C444', bg: '#2A2510' },
      { id: 'hw4-2', name: 'Reverse Crunches',      desc: 'Curl the hips off the floor to target the hard-to-reach lower abs.', durationSec: 30, icon: 'human',    iconColor: '#26C36A', bg: '#142614' },
      { id: 'hw4-3', name: 'Side Plank (L)',        desc: 'Left side plank — oblique strength and lateral stability.', durationSec: 30, icon: 'dumbbell',  iconColor: '#29B6F6', bg: '#1A2635' },
      { id: 'hw4-4', name: 'Side Plank (R)',        desc: 'Right side plank — balances oblique strength from both sides.', durationSec: 30, icon: 'weight-lifter', iconColor: '#EF5350', bg: '#2A1414' },
    ],
  },
  {
    id: 'hw-5',
    name: 'Pre-Run Warm Up',
    subtitle: 'Prepare your joints for running',
    kcal: 15,
    durationMin: 3,
    accentColor: '#FF764B',
    exercises: [
      { id: 'hw5-1', name: 'Ankle Rotations',       desc: 'Circle each ankle to lubricate the joint and prevent common running sprains.', durationSec: 20, icon: 'run',       iconColor: '#FF764B', bg: '#2A1A14' },
      { id: 'hw5-2', name: 'Leg Swings',            desc: 'Swing each leg forward and back to dynamically open the hip flexors and hamstrings.', durationSec: 20, icon: 'run-fast', iconColor: '#F6C444', bg: '#2A2510' },
      { id: 'hw5-3', name: 'High Knees (slow)',     desc: 'Slow, exaggerated high-knee steps to activate hip flexors and warm up the core.', durationSec: 20, icon: 'human',    iconColor: '#26C36A', bg: '#142614' },
      { id: 'hw5-4', name: 'Butt Kicks',            desc: 'Kick heels toward glutes while jogging in place — primes the hamstrings for running.', durationSec: 20, icon: 'arm-flex', iconColor: '#9C7EF0', bg: '#1E1A35' },
      { id: 'hw5-5', name: 'Calf Raises',           desc: 'Rise onto toes to warm up calves and Achilles tendons before pavement impact.', durationSec: 20, icon: 'weight-lifter', iconColor: '#29B6F6', bg: '#1A2635' },
    ],
  },
  {
    id: 'hw-6',
    name: 'Morning Warm Up',
    subtitle: 'Wake up your body, prepare for the day',
    kcal: 12,
    durationMin: 3,
    accentColor: '#F6C444',
    exercises: [
      { id: 'hw6-1', name: 'Neck Rolls',            desc: 'Gently roll the neck in slow circles to release overnight stiffness.', durationSec: 20, icon: 'human',    iconColor: '#F6C444', bg: '#2A2510' },
      { id: 'hw6-2', name: 'Shoulder Circles',      desc: 'Roll shoulders forward and back to open the chest and upper back.', durationSec: 20, icon: 'human-handsup', iconColor: '#9C7EF0', bg: '#1E1A35' },
      { id: 'hw6-3', name: 'Torso Twists',          desc: 'Standing trunk rotation to mobilise the thoracic spine after sleep.', durationSec: 20, icon: 'arm-flex', iconColor: '#FF764B', bg: '#2A1A14' },
      { id: 'hw6-4', name: 'Hip Circles',           desc: 'Wide hip rotations to loosen the hip joints and lower-back muscles.', durationSec: 20, icon: 'run',       iconColor: '#26C36A', bg: '#142614' },
      { id: 'hw6-5', name: 'Jumping Jacks',         desc: 'Classic full-body activator — elevates heart rate and wakes up the nervous system.', durationSec: 20, icon: 'run-fast', iconColor: '#29B6F6', bg: '#1A2635' },
    ],
  },
  {
    id: 'hw-7',
    name: 'Sleepy Time Stretching',
    subtitle: 'Get a high-quality sleep',
    kcal: 8,
    durationMin: 5,
    accentColor: '#9C7EF0',
    exercises: [
      { id: 'hw7-1', name: 'Child\'s Pose',         desc: 'Sit back on heels and extend arms forward — deeply relaxes the spine and hips.', durationSec: 30, icon: 'yoga',     iconColor: '#9C7EF0', bg: '#1E1A35' },
      { id: 'hw7-2', name: 'Supine Spinal Twist',   desc: 'Lie on your back and cross one knee over to the opposite side, releasing the lower back.', durationSec: 30, icon: 'sleep',    iconColor: '#29B6F6', bg: '#1A2635' },
      { id: 'hw7-3', name: 'Legs Up the Wall',      desc: 'Rest legs vertically against a wall to calm the nervous system and drain tired legs.', durationSec: 30, icon: 'human',    iconColor: '#26C36A', bg: '#142614' },
      { id: 'hw7-4', name: 'Butterfly Stretch',     desc: 'Soles together, knees drop out to the sides — gentle inner-thigh and groin release.', durationSec: 30, icon: 'human-handsup', iconColor: '#F6C444', bg: '#2A2510' },
    ],
  },
  {
    id: 'hw-8',
    name: 'Neck & Shoulder Relief',
    subtitle: 'Loosen muscles and reduce pains',
    kcal: 5,
    durationMin: 4,
    accentColor: '#29B6F6',
    exercises: [
      { id: 'hw8-1', name: 'Ear-to-Shoulder Tilt',  desc: 'Tilt ear toward shoulder and hold, gently stretching the lateral neck muscles.', durationSec: 30, icon: 'human-handsup', iconColor: '#29B6F6', bg: '#1A2635' },
      { id: 'hw8-2', name: 'Chin Tucks',            desc: 'Pull chin straight back to strengthen the deep neck flexors and correct forward posture.', durationSec: 20, icon: 'human',    iconColor: '#9C7EF0', bg: '#1E1A35' },
      { id: 'hw8-3', name: 'Cross-Body Arm Stretch', desc: 'Pull one arm across the chest to open the rear deltoid and outer shoulder capsule.', durationSec: 20, icon: 'arm-flex', iconColor: '#F6C444', bg: '#2A2510' },
      { id: 'hw8-4', name: 'Doorway Chest Opener',  desc: 'Stand in a doorway, press arms to frame, and lean forward — releases pec tension.', durationSec: 30, icon: 'weight-lifter', iconColor: '#26C36A', bg: '#142614' },
    ],
  },
  {
    id: 'hw-9',
    name: 'Full Body Stretching',
    subtitle: 'Relax your body and improve range of motion',
    kcal: 10,
    durationMin: 7,
    accentColor: '#26C36A',
    exercises: [
      { id: 'hw9-1', name: 'Standing Quad Stretch', desc: 'Balance on one leg, pull the other foot to your glutes — deep front-thigh stretch.', durationSec: 20, icon: 'run',       iconColor: '#26C36A', bg: '#142614' },
      { id: 'hw9-2', name: 'Hamstring Forward Fold', desc: 'Feet hip-width apart, fold forward with a long spine to lengthen the hamstrings.', durationSec: 20, icon: 'human',    iconColor: '#F6C444', bg: '#2A2510' },
      { id: 'hw9-3', name: 'Cat-Cow Flow',          desc: 'Alternate between arching and rounding the back on all fours — mobilises the full spine.', durationSec: 20, icon: 'yoga',     iconColor: '#9C7EF0', bg: '#1E1A35' },
      { id: 'hw9-4', name: 'Hip Flexor Lunge',      desc: 'Low lunge position, sink hips forward to release the often-tight hip flexor.', durationSec: 20, icon: 'run-fast', iconColor: '#29B6F6', bg: '#1A2635' },
      { id: 'hw9-5', name: 'Seated Spinal Twist',   desc: 'Seated twist through the thoracic spine — improves rotation and digestion.', durationSec: 20, icon: 'arm-flex', iconColor: '#FF764B', bg: '#2A1A14' },
      { id: 'hw9-6', name: 'Chest & Bicep Stretch', desc: 'Clasp hands behind back, lift arms — opens chest, biceps, and front shoulders.', durationSec: 20, icon: 'dumbbell',  iconColor: '#EF5350', bg: '#2A1414' },
    ],
  },
  {
    id: 'hw-10',
    name: 'Shoulder Tension Relief',
    subtitle: 'Relieve shoulder tension and ease pain',
    kcal: 6,
    durationMin: 5,
    accentColor: '#EF5350',
    exercises: [
      { id: 'hw10-1', name: 'Shoulder Rolls',       desc: 'Slow forward and backward shoulder rolls to release trapezius tightness.', durationSec: 20, icon: 'human-male',  iconColor: '#EF5350', bg: '#2A1414' },
      { id: 'hw10-2', name: 'Thread the Needle',    desc: 'On all fours, thread one arm under the body to release the upper back and shoulder.', durationSec: 30, icon: 'human-handsup', iconColor: '#9C7EF0', bg: '#1E1A35' },
      { id: 'hw10-3', name: 'Wall Angel',           desc: 'Slide arms up and down against a wall to strengthen scapular stabilisers and open the chest.', durationSec: 20, icon: 'arm-flex', iconColor: '#29B6F6', bg: '#1A2635' },
      { id: 'hw10-4', name: 'Prone Y-T-W',         desc: 'Lying face-down, raise arms into Y, T, and W shapes — activates the lower trapezius.', durationSec: 20, icon: 'dumbbell',  iconColor: '#F6C444', bg: '#2A2510' },
      { id: 'hw10-5', name: 'Pendulum Swing',       desc: 'Lean forward, let arm hang, and swing it gently in circles to decompress the shoulder joint.', durationSec: 30, icon: 'weight-lifter', iconColor: '#26C36A', bg: '#142614' },
    ],
  },
];

// ─── Props ────────────────────────────────────────────────────────────────────
interface Props {
  visible: boolean;
  workoutId: string | null;
  onClose: () => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatDuration(sec: number): string {
  if (sec < 60) return `${sec} s`;
  return `${Math.floor(sec / 60)} min ${sec % 60 > 0 ? `${sec % 60} s` : ''}`.trim();
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function HotWorkoutDetailScreen({ visible, workoutId, onClose }: Props) {
  const detail = HOT_WORKOUT_DETAILS.find((w) => w.id === workoutId);

  if (!detail) return null;

  const totalSec = detail.exercises.reduce((s, e) => s + e.durationSec, 0);
  const totalMin = Math.ceil(totalSec / 60);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />

        {/* ── Top nav bar ── */}
        <View style={styles.navbar}>
          <TouchableOpacity style={styles.navBtn} onPress={onClose} activeOpacity={0.7}>
            <MaterialCommunityIcons name="arrow-left" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.navTitle}>{detail.name.toUpperCase()}</Text>
          <View style={styles.navBtn} />
        </View>

        {/* ── Subtitle ── */}
        <Text style={styles.subtitle}>{detail.subtitle}</Text>

        {/* ── Stats strip ── */}
        <View style={styles.statsStrip}>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: detail.accentColor }]}>
              ≈ {detail.kcal}
            </Text>
            <Text style={styles.statLabel}>KCAL</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: detail.accentColor }]}>
              {totalMin}
            </Text>
            <Text style={styles.statLabel}>MIN</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: detail.accentColor }]}>
              {detail.exercises.length}
            </Text>
            <Text style={styles.statLabel}>WORKOUTS</Text>
          </View>
        </View>

        {/* ── Exercises list ── */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <Text style={styles.sectionTitle}>Workouts</Text>

          <View style={styles.exerciseCard}>
            {detail.exercises.map((ex, idx) => (
              <TouchableOpacity
                key={ex.id}
                style={[
                  styles.exRow,
                  idx < detail.exercises.length - 1 && styles.exRowBorder,
                ]}
                activeOpacity={0.75}
                onPress={() =>
                  Alert.alert(ex.name, ex.desc)
                }
              >
                {/* Icon thumb */}
                <View style={[styles.exThumb, { backgroundColor: ex.bg }]}>
                  <MaterialCommunityIcons
                    name={ex.icon as any}
                    size={30}
                    color={ex.iconColor}
                  />
                </View>

                {/* Info */}
                <View style={styles.exInfo}>
                  <Text style={styles.exName}>{ex.name.toUpperCase()}</Text>
                  <Text style={styles.exDesc} numberOfLines={2}>
                    {ex.desc}
                  </Text>
                  <Text style={styles.exDuration}>{formatDuration(ex.durationSec)}</Text>
                </View>

                {/* Arrow */}
                <View style={styles.arrowCircle}>
                  <MaterialCommunityIcons name="chevron-right" size={20} color="#FFFFFF" />
                </View>
              </TouchableOpacity>
            ))}
          </View>

          <View style={{ height: 110 }} />
        </ScrollView>

        {/* ── START button ── */}
        <View style={styles.startWrapper}>
          <TouchableOpacity
            style={[styles.startBtn, { backgroundColor: COLORS.greenAccent }]}
            activeOpacity={0.85}
            onPress={() => Alert.alert('Starting Workout', `${detail.name} — Get ready! 💪`)}
          >
            <Text style={styles.startBtnText}>START</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  // navbar
  navbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.four,
    paddingTop: 8,
    paddingBottom: 4,
  },
  navBtn: {
    width: 36,
    alignItems: 'center',
  },
  navTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.8,
    flex: 1,
    textAlign: 'center',
  },

  subtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 16,
    paddingHorizontal: SPACING.four,
  },

  // stats strip
  statsStrip: {
    flexDirection: 'row',
    backgroundColor: COLORS.cardBackground,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 14,
    marginBottom: 4,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  statValue: {
    fontSize: 26,
    fontWeight: '900',
  },
  statLabel: {
    fontSize: 10,
    color: COLORS.textSecondary,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  statDivider: {
    width: 1,
    backgroundColor: COLORS.border,
    marginVertical: 4,
  },

  // scroll
  scrollContent: {
    paddingHorizontal: SPACING.four,
    paddingTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 14,
  },

  // exercise card
  exerciseCard: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  exRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 14,
  },
  exRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  exThumb: {
    width: 58,
    height: 58,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  exInfo: {
    flex: 1,
    gap: 3,
  },
  exName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.4,
    lineHeight: 18,
  },
  exDesc: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '500',
    lineHeight: 16,
  },
  exDuration: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '700',
    marginTop: 2,
  },
  arrowCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },

  // start button
  startWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: SPACING.four,
    paddingBottom: 28,
    paddingTop: 12,
    backgroundColor: COLORS.background,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  startBtn: {
    borderRadius: 40,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  startBtnText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 2,
  },
});
