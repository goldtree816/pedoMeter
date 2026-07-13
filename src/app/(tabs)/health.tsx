import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING } from '../../constants/theme';
import { useSettings } from '../../context/SettingsContext';

const { width } = Dimensions.get('window');
const GRAPH_WIDTH = width - 48 - 32; // screen - horizontal padding - card padding

// ─── weight mock history (last 30 days) ──────────────────────────────────────
// We'll build 5 data points from Jun 13 → Jul 11
const WEIGHT_HISTORY = [
  { label: 'Jun 13', weight: 155.1 },
  { label: 'Jun 20', weight: 154.8 },
  { label: 'Jun 27', weight: 154.6 },
  { label: 'Jul 4', weight: 154.4 },
  { label: 'Jul 11', weight: 154.3 },
];

// ─── BMI color bar segments ───────────────────────────────────────────────────
const BMI_SEGMENTS = [
  { color: '#90A4AE', label: 'Under', max: 18.5 },   // gray
  { color: '#66BB6A', label: 'Normal', max: 25 },     // green
  { color: '#D4E157', label: 'Over', max: 30 },       // lime-yellow
  { color: '#FFA726', label: 'Obese I', max: 35 },    // orange
  { color: '#EF5350', label: 'Obese II', max: 40 },   // red
];

// ─── Weight line graph ────────────────────────────────────────────────────────
function WeightGraph({ currentWeight }: { currentWeight: number }) {
  const minW = Math.min(...WEIGHT_HISTORY.map((d) => d.weight)) - 1;
  const maxW = Math.max(...WEIGHT_HISTORY.map((d) => d.weight)) + 1;
  const graphH = 120;
  const pointCount = WEIGHT_HISTORY.length;
  const stepX = GRAPH_WIDTH / (pointCount - 1);

  const toY = (w: number) => graphH - ((w - minW) / (maxW - minW)) * graphH;

  // Generate SVG-like path using Views for RN
  const points = WEIGHT_HISTORY.map((d, i) => ({
    x: i * stepX,
    y: toY(d.weight),
    label: d.label,
    weight: d.weight,
  }));

  // Y-axis labels
  const yLabels = [156, 155, 154, 153, 152];

  return (
    <View>
      {/* Y axis + chart area side by side */}
      <View style={{ flexDirection: 'row' }}>
        {/* Y axis */}
        <View style={{ width: 32, height: graphH + 20, justifyContent: 'space-between', paddingTop: 4, paddingBottom: 20 }}>
          {yLabels.map((v) => (
            <Text key={v} style={graphStyles.yLabel}>{v}</Text>
          ))}
        </View>

        {/* Graph area */}
        <View style={{ flex: 1, height: graphH + 20 }}>
          {/* Horizontal grid lines */}
          {yLabels.map((v, idx) => (
            <View
              key={v}
              style={[
                graphStyles.gridLine,
                { top: (idx / (yLabels.length - 1)) * graphH },
              ]}
            />
          ))}

          {/* Connecting lines between points */}
          {points.slice(0, -1).map((pt, idx) => {
            const next = points[idx + 1];
            const dx = next.x - pt.x;
            const dy = next.y - pt.y;
            const len = Math.sqrt(dx * dx + dy * dy);
            const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
            return (
              <View
                key={idx}
                style={{
                  position: 'absolute',
                  left: pt.x,
                  top: pt.y,
                  width: len,
                  height: 1.5,
                  backgroundColor: 'rgba(255,255,255,0.25)',
                  transformOrigin: 'left center',
                  transform: [{ rotate: `${angle}deg` }],
                }}
              />
            );
          })}

          {/* Dots */}
          {points.map((pt, idx) => {
            const isLast = idx === points.length - 1;
            return (
              <View
                key={idx}
                style={{
                  position: 'absolute',
                  left: pt.x - (isLast ? 5 : 4),
                  top: pt.y - (isLast ? 5 : 4),
                  width: isLast ? 10 : 8,
                  height: isLast ? 10 : 8,
                  borderRadius: isLast ? 5 : 4,
                  backgroundColor: isLast ? COLORS.greenAccent : 'rgba(255,255,255,0.35)',
                  borderWidth: isLast ? 2 : 0,
                  borderColor: isLast ? '#fff' : 'transparent',
                }}
              />
            );
          })}
        </View>
      </View>

      {/* X-axis labels */}
      <View style={{ flexDirection: 'row', paddingLeft: 32 }}>
        {WEIGHT_HISTORY.map((d, i) => (
          <Text
            key={i}
            style={[
              graphStyles.xLabel,
              { flex: 1, textAlign: i === 0 ? 'left' : i === WEIGHT_HISTORY.length - 1 ? 'right' : 'center' },
            ]}
          >
            {d.label}
          </Text>
        ))}
      </View>
    </View>
  );
}

const graphStyles = StyleSheet.create({
  yLabel: {
    fontSize: 10,
    color: COLORS.textSecondary,
    textAlign: 'right',
  },
  gridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  xLabel: {
    fontSize: 10,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
});

// ─── BMI Color Bar ────────────────────────────────────────────────────────────
function BmiColorBar({ bmi }: { bmi: number }) {
  // Clamp indicator position 0..100%
  const clampedBmi = Math.max(10, Math.min(bmi, 45));
  const pct = ((clampedBmi - 10) / 35) * 100;

  return (
    <View>
      {/* Category label */}
      {(() => {
        let label = 'Normal weight';
        let color = '#66BB6A';
        if (bmi < 18.5) { label = 'Underweight'; color = '#90A4AE'; }
        else if (bmi >= 30) { label = 'Obese'; color = '#EF5350'; }
        else if (bmi >= 25) { label = 'Overweight'; color = '#FFA726'; }
        return (
          <View style={[bmiBarStyles.badge, { backgroundColor: color, alignSelf: 'flex-start', marginBottom: 10 }]}>
            <Text style={bmiBarStyles.badgeText}>{label}</Text>
          </View>
        );
      })()}

      {/* Color bar */}
      <View style={bmiBarStyles.bar}>
        {BMI_SEGMENTS.map((seg, idx) => (
          <View
            key={idx}
            style={[bmiBarStyles.seg, { backgroundColor: seg.color, flex: 1 }]}
          />
        ))}

        {/* Indicator */}
        <View
          style={[
            bmiBarStyles.indicator,
            { left: `${pct}%` as any },
          ]}
        />
      </View>
    </View>
  );
}

const bmiBarStyles = StyleSheet.create({
  badge: {
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  badgeText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '800',
  },
  bar: {
    flexDirection: 'row',
    height: 10,
    borderRadius: 5,
    overflow: 'visible',
    position: 'relative',
  },
  seg: {
    height: 10,
  },
  indicator: {
    position: 'absolute',
    top: -3,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#fff',
    borderWidth: 2.5,
    borderColor: COLORS.greenAccent,
    marginLeft: -8,
  },
});

// ─── main screen ──────────────────────────────────────────────────────────────

export default function HealthScreen() {
  const { weight, height } = useSettings();

  // Convert kg → lbs for display
  const weightLbs = (weight * 2.20462).toFixed(1);
  const currentWeight = parseFloat(weightLbs);

  const heightInMeters = height / 100;
  const bmi = weight / (heightInMeters * heightInMeters);
  const bmiVal = Number(bmi.toFixed(2));

  let bmiLabel = 'Normal weight';
  let bmiColor = '#66BB6A';
  if (bmiVal < 18.5) { bmiLabel = 'Underweight'; bmiColor = '#90A4AE'; }
  else if (bmiVal >= 30) { bmiLabel = 'Obese'; bmiColor = '#EF5350'; }
  else if (bmiVal >= 25) { bmiLabel = 'Overweight'; bmiColor = '#FFA726'; }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Health</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* ── Workout Banner ──────────────────────────────────────────────── */}
        <TouchableOpacity
          style={styles.workoutBanner}
          activeOpacity={0.85}
          onPress={() => Alert.alert('Workout', 'Starting your fast workout session!')}
        >
          {/* Avatar placeholder */}
          <View style={styles.avatarCircle}>
            <MaterialCommunityIcons name="human-female" size={34} color="#fff" />
          </View>

          <View style={styles.bannerText}>
            <Text style={styles.bannerTitle}>2-7 min fast workout!</Text>
            <Text style={styles.bannerSub}>Let's start a day with energy! 💪</Text>
          </View>

          <View style={styles.bannerArrow}>
            <MaterialCommunityIcons name="arrow-right" size={18} color="#fff" />
          </View>
        </TouchableOpacity>

        {/* ── Weight Section ───────────────────────────────────────────────── */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Weight</Text>
            <TouchableOpacity onPress={() => Alert.alert('Add Weight', 'Log today\'s weight')}>
              <Text style={styles.addLink}>ADD</Text>
            </TouchableOpacity>
          </View>

          {/* Current weight + last 30 days badge */}
          <View style={styles.weightRow}>
            <View>
              <Text style={styles.weightSub}>Current</Text>
              <Text style={styles.weightVal}>{currentWeight} lbs</Text>
            </View>
            <View>
              <Text style={styles.weightSub}>Last 30 days</Text>
              <View style={styles.last30Badge}>
                <Text style={styles.last30Text}>-.-</Text>
              </View>
            </View>
          </View>

          {/* Year label */}
          <Text style={styles.yearLabel}>2026</Text>

          {/* Weight graph */}
          <WeightGraph currentWeight={currentWeight} />
        </View>

        {/* ── BMI Section ─────────────────────────────────────────────────── */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.bmiTitle}>
              BMI (kg/m²):{' '}
              <Text style={[styles.bmiValue, { color: bmiColor }]}>{bmiVal}</Text>
            </Text>
            <TouchableOpacity
              onPress={() => Alert.alert('Edit BMI', 'Update your height and weight in More settings')}
            >
              <Text style={styles.addLink}>EDIT</Text>
            </TouchableOpacity>
          </View>

          <View style={{ marginTop: 12 }}>
            <BmiColorBar bmi={bmiVal} />
          </View>
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

  // Workout Banner
  workoutBanner: {
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
  avatarCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#2A3050',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  bannerText: {
    flex: 1,
    gap: 4,
  },
  bannerTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  bannerSub: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  bannerArrow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: COLORS.textSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Cards
  card: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  addLink: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.greenAccent,
  },

  // Weight
  weightRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 12,
  },
  weightSub: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 2,
  },
  weightVal: {
    fontSize: 30,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  last30Badge: {
    backgroundColor: COLORS.greenAccent,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 56,
  },
  last30Text: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '900',
  },
  yearLabel: {
    fontSize: 10,
    color: COLORS.textSecondary,
    fontWeight: '600',
    marginBottom: 4,
    paddingLeft: 32,
  },

  // BMI
  bmiTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  bmiValue: {
    fontSize: 20,
    fontWeight: '900',
  },
});
