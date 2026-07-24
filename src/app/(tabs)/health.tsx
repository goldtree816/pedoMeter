import React, { useState } from 'react';
import Svg, { Polyline, Circle, Defs, LinearGradient, Stop, Polygon, Text as SvgText } from 'react-native-svg';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Alert,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING } from '../../constants/theme';
import { useSettings, WeightRecord } from '../../context/SettingsContext';

const { width } = Dimensions.get('window');
const GRAPH_WIDTH = width - 48 - 32; // screen - horizontal padding - card padding

// ─── BMI color bar segments ───────────────────────────────────────────────────
const BMI_SEGMENTS = [
  { color: '#90A4AE', label: 'Underweight', max: 18.5 },
  { color: '#66BB6A', label: 'Healthy weight', max: 25 },
  { color: '#D4E157', label: 'Overweight', max: 30 },
  { color: '#FFA726', label: 'Above Healthy Weight', max: 35 },
  { color: '#EF5350', label: 'Obese', max: 40 },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getBmiInfo(bmi: number): { label: string; color: string } {
  if (bmi < 18.5) return { label: 'Underweight', color: '#90A4AE' };
  if (bmi < 25)   return { label: 'Healthy weight', color: '#66BB6A' };
  if (bmi < 30)   return { label: 'Overweight', color: '#D4E157' };
  if (bmi < 35)   return { label: 'Above Healthy Weight', color: '#FFA726' };
  return { label: 'Obese', color: '#EF5350' };
}

function formatDate(isoDate: string): string {
  const [y, m, d] = isoDate.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ─── Weight line graph ────────────────────────────────────────────────────────
function WeightGraph({
  history,
  unit,
  currentWeight,
}: {
  history: WeightRecord[];
  unit: 'kg' | 'lbs';
  currentWeight: number;
}) {
  const toDisplay = (kg: number) => (unit === 'lbs' ? kg * 2.20462 : kg);

  // ── Fixed 30-day window ───────────────────────────────────────────────────
  const Y_AXIS_WIDTH = 42;
  const graphW = GRAPH_WIDTH - Y_AXIS_WIDTH;
  const graphH = 200;
  const PAD_TOP = 16;
  const PAD_BOTTOM = 8;
  const plotH = graphH - PAD_TOP - PAD_BOTTOM;

  const windowEnd = new Date();
  windowEnd.setHours(23, 59, 59, 999);
  const windowStart = new Date(windowEnd);
  windowStart.setDate(windowStart.getDate() - 29);
  windowStart.setHours(0, 0, 0, 0);
  const windowMs = windowEnd.getTime() - windowStart.getTime();

  // Map an ISO date string to an X pixel position
  const dateToX = (isoDate: string): number => {
    const [y, m, d] = isoDate.split('-').map(Number);
    const dt = new Date(y, m - 1, d);
    const ratio = Math.max(0, Math.min(1, (dt.getTime() - windowStart.getTime()) / windowMs));
    return ratio * graphW;
  };

  // 5 evenly-spaced X-axis labels across the 30-day window
  const xLabels = Array.from({ length: 5 }, (_, i) => {
    const d = new Date(windowStart);
    d.setDate(d.getDate() + Math.round((i / 4) * 29));
    return {
      label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      ratio: i / 4,
    };
  });

  // Only show entries within the 30-day window
  const data = history.filter((r) => {
    const [y, m, d] = r.date.split('-').map(Number);
    const dt = new Date(y, m - 1, d);
    return dt >= windowStart && dt <= windowEnd;
  });

  // ── Y axis ────────────────────────────────────────────────────────────────
  const baseWeight = toDisplay(currentWeight);
  const allWeights = data.length > 0 ? data.map((r) => toDisplay(r.weight)) : [baseWeight];
  const minW = Math.min(...allWeights) - 2;
  const maxW = Math.max(...allWeights) + 2;

  const toY = (w: number) =>
    PAD_TOP + plotH - ((w - minW) / (maxW - minW || 1)) * plotH;

  const numYLabels = 6;
  const yLabels = Array.from({ length: numYLabels }, (_, i) =>
    Math.round(maxW - (i / (numYLabels - 1)) * (maxW - minW))
  );

  // ── Build data points ─────────────────────────────────────────────────────
  // Each data point is plotted at its actual date position on the X axis.
  // For single points we add subtle extension lines so the dot has visual context.
  const rawPoints = data.map((r) => ({
    x: dateToX(r.date),
    y: toY(toDisplay(r.weight)),
    label: formatDate(r.date),
    weight: toDisplay(r.weight),
    isReal: true,
  }));

  let points: { x: number; y: number; label: string; weight: number; isReal: boolean }[];

  if (rawPoints.length === 0) {
    // No data at all — show a flat reference line at the current weight
    points = [
      { x: 0, y: toY(baseWeight), label: '', weight: baseWeight, isReal: false },
      { x: graphW, y: toY(baseWeight), label: '', weight: baseWeight, isReal: false },
    ];
  } else if (rawPoints.length === 1) {
    // Single entry — keep the real point at its date, add thin extension lines
    const pt = rawPoints[0];
    const extL = Math.max(0, pt.x - 30);
    const extR = Math.min(graphW, pt.x + 30);
    points = [
      { x: extL, y: pt.y, label: '', weight: pt.weight, isReal: false },
      pt,
      { x: extR, y: pt.y, label: '', weight: pt.weight, isReal: false },
    ];
  } else {
    points = rawPoints;
  }

  const polylinePoints = points.map((p) => `${p.x},${p.y}`).join(' ');
  const fillPolygon =
    points.length >= 2
      ? points.map((p) => `${p.x},${p.y}`).join(' ') +
        ` ${points[points.length - 1].x},${graphH} ${points[0].x},${graphH}`
      : '';

  // Removed complex HTML tooltips in favor of native SVG text

  return (
    <View>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
        {/* Y-axis labels */}
        <View
          style={{
            width: Y_AXIS_WIDTH,
            height: graphH,
            justifyContent: 'space-between',
            paddingTop: PAD_TOP,
            paddingBottom: PAD_BOTTOM,
          }}
        >
          {yLabels.map((v, i) => (
            <Text key={i} style={graphStyles.yLabel}>{v}</Text>
          ))}
        </View>

        {/* SVG canvas */}
        <View style={{ width: graphW, height: graphH, overflow: 'visible' }}>
          <Svg width={graphW} height={graphH}>
            <Defs>
              <LinearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor={COLORS.greenAccent} stopOpacity="0.35" />
                <Stop offset="1" stopColor={COLORS.greenAccent} stopOpacity="0.02" />
              </LinearGradient>
            </Defs>

            {/* Grid lines */}
            {yLabels.map((_, idx) => {
              const gy = PAD_TOP + (idx / (numYLabels - 1)) * plotH;
              return (
                <Polyline key={idx} points={`0,${gy} ${graphW},${gy}`}
                  fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
              );
            })}

            {/* Gradient fill */}
            {fillPolygon !== '' && <Polygon points={fillPolygon} fill="url(#lineGrad)" />}

            {/* Line */}
            {points.length >= 2 && (
              <Polyline points={polylinePoints} fill="none"
                stroke={COLORS.greenAccent} strokeWidth="2.5"
                strokeLinejoin="round" strokeLinecap="round" />
            )}

            {/* Dots and Labels — only render for real data points */}
            {points.map((pt, idx) => {
              if (!pt.isReal) return null;
              return (
                <React.Fragment key={idx}>
                  <Circle cx={pt.x} cy={pt.y} r={10} fill="rgba(82,196,130,0.2)" />
                  <Circle cx={pt.x} cy={pt.y}
                    r={6}
                    fill={COLORS.greenAccent}
                    stroke="#fff" strokeWidth={2} />
                  
                  {/* Weight label for the particular date */}
                  <SvgText
                    x={pt.x}
                    y={pt.y - 16}
                    fill={COLORS.greenAccent}
                    fontSize="12"
                    fontWeight="bold"
                    textAnchor="middle"
                  >
                    {pt.weight.toFixed(1)}
                  </SvgText>
                  
                  {/* Date label below the dot */}
                  <SvgText
                    x={pt.x}
                    y={pt.y + 22}
                    fill="rgba(255,255,255,0.5)"
                    fontSize="9"
                    fontWeight="600"
                    textAnchor="middle"
                  >
                    {pt.label}
                  </SvgText>
                </React.Fragment>
              );
            })}
          </Svg>
        </View>
      </View>

      {/* X-axis: 5 evenly-spaced date labels across the 30-day window */}
      <View style={{ height: 18, marginLeft: Y_AXIS_WIDTH, position: 'relative' }}>
        {xLabels.map((xl, i) => (
          <Text key={i}
            style={[graphStyles.xLabel, {
              position: 'absolute',
              left: xl.ratio * graphW - (i === 4 ? 32 : i === 0 ? 0 : 16),
            }]}>
            {xl.label}
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
    paddingRight: 6,
  },
  xLabel: {
    fontSize: 10,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  // Removed tooltip styles as we use SvgText now
  deltaBadge: { borderRadius: 5, paddingHorizontal: 7, paddingVertical: 2, marginTop: 4 },
  deltaText: { color: '#fff', fontSize: 11, fontWeight: '900' },
});

// ─── BMI Color Bar ────────────────────────────────────────────────────────────
function BmiColorBar({ bmi }: { bmi: number }) {
  const clampedBmi = Math.max(10, Math.min(bmi, 45));
  const pct = ((clampedBmi - 10) / 35) * 100;
  const { label, color } = getBmiInfo(bmi);

  return (
    <View>
      {/* Badge */}
      <View
        style={[
          bmiBarStyles.badge,
          {
            backgroundColor: color,
            alignSelf: 'flex-start',
            marginBottom: 10,
            marginLeft: `${Math.min(Math.max(pct - 10, 0), 60)}%` as any,
          },
        ]}
      >
        <Text style={bmiBarStyles.badgeText}>{label}</Text>
      </View>

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
          style={[bmiBarStyles.indicator, { left: `${pct}%` as any }]}
        />
      </View>
    </View>
  );
}

const bmiBarStyles = StyleSheet.create({
  badge: {
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 6,
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
    top: -4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#fff',
    borderWidth: 2.5,
    borderColor: COLORS.greenAccent,
    marginLeft: -9,
  },
});

// ─── Shared: Compact Weight+Height Input Block ───────────────────────────────
function WeightHeightInputs({
  weightInput, setWeightInput,
  weightUnit, setWeightUnit,
  heightUnit, setHeightUnit,
  cmInput, setCmInput,
  feetInput, setFeetInput,
  inchesInput, setInchesInput,
  darkBg,
}: {
  weightInput: string; setWeightInput: (v: string) => void;
  weightUnit: 'kg' | 'lb'; setWeightUnit: (u: 'kg' | 'lb') => void;
  heightUnit: 'cm' | 'in'; setHeightUnit: (u: 'cm' | 'in') => void;
  cmInput: string; setCmInput: (v: string) => void;
  feetInput: string; setFeetInput: (v: string) => void;
  inchesInput: string; setInchesInput: (v: string) => void;
  darkBg?: boolean;
}) {
  const s = darkBg ? sharedInputStyles.dark : sharedInputStyles.light;
  return (
    <View>
      {/* Weight */}
      <Text style={[sharedInputStyles.label, darkBg && { color: 'rgba(255,255,255,0.5)' }]}>WEIGHT</Text>
      <View style={sharedInputStyles.row}>
        <TextInput
          style={[sharedInputStyles.input, darkBg && sharedInputStyles.inputDark]}
          keyboardType="decimal-pad"
          value={weightInput}
          onChangeText={setWeightInput}
          placeholder="0.0"
          placeholderTextColor={darkBg ? '#555' : '#aaa'}
        />
        <View style={[sharedInputStyles.toggle, darkBg && sharedInputStyles.toggleDark]}>
          {(['kg', 'lb'] as const).map((u) => (
            <TouchableOpacity
              key={u}
              style={[sharedInputStyles.toggleBtn, weightUnit === u && sharedInputStyles.toggleBtnActive]}
              onPress={() => {
                const val = parseFloat(weightInput) || 0;
                if (u === 'kg' && weightUnit === 'lb') setWeightInput((val / 2.20462).toFixed(1));
                else if (u === 'lb' && weightUnit === 'kg') setWeightInput((val * 2.20462).toFixed(1));
                setWeightUnit(u);
              }}
            >
              <Text style={[sharedInputStyles.toggleText, weightUnit === u && sharedInputStyles.toggleTextActive]}>
                {u.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Height */}
      <Text style={[sharedInputStyles.label, { marginTop: 16 }, darkBg && { color: 'rgba(255,255,255,0.5)' }]}>HEIGHT</Text>
      <View style={sharedInputStyles.row}>
        {heightUnit === 'in' ? (
          <>
            <TextInput
              style={[sharedInputStyles.input, { flex: 0.42 }, darkBg && sharedInputStyles.inputDark]}
              keyboardType="decimal-pad" value={feetInput} onChangeText={setFeetInput}
              placeholder="FT" placeholderTextColor={darkBg ? '#555' : '#aaa'} />
            <Text style={[sharedInputStyles.ftLabel, darkBg && { color: 'rgba(255,255,255,0.4)' }]}>FT</Text>
            <TextInput
              style={[sharedInputStyles.input, { flex: 0.42 }, darkBg && sharedInputStyles.inputDark]}
              keyboardType="decimal-pad" value={inchesInput} onChangeText={setInchesInput}
              placeholder="IN" placeholderTextColor={darkBg ? '#555' : '#aaa'} />
            <Text style={[sharedInputStyles.ftLabel, darkBg && { color: 'rgba(255,255,255,0.4)' }]}>IN</Text>
          </>
        ) : (
          <TextInput
            style={[sharedInputStyles.input, darkBg && sharedInputStyles.inputDark]}
            keyboardType="decimal-pad" value={cmInput} onChangeText={setCmInput}
            placeholder="0" placeholderTextColor={darkBg ? '#555' : '#aaa'} />
        )}
        <View style={[sharedInputStyles.toggle, darkBg && sharedInputStyles.toggleDark]}>
          {(['cm', 'in'] as const).map((u) => (
            <TouchableOpacity
              key={u}
              style={[sharedInputStyles.toggleBtn, heightUnit === u && sharedInputStyles.toggleBtnActive]}
              onPress={() => {
                if (u === 'in' && heightUnit === 'cm') {
                  const cm = parseFloat(cmInput) || 0;
                  const ti = cm / 2.54;
                  setFeetInput(Math.floor(ti / 12).toString());
                  setInchesInput((ti % 12).toFixed(1));
                } else if (u === 'cm' && heightUnit === 'in') {
                  const ft = parseFloat(feetInput) || 0;
                  const inch = parseFloat(inchesInput) || 0;
                  setCmInput(((ft * 12 + inch) * 2.54).toFixed(0));
                }
                setHeightUnit(u);
              }}
            >
              <Text style={[sharedInputStyles.toggleText, heightUnit === u && sharedInputStyles.toggleTextActive]}>
                {u.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
}

const sharedInputStyles = StyleSheet.create({
  label: { fontSize: 11, fontWeight: '700', color: '#999', marginBottom: 6, letterSpacing: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 },
  input: {
    flex: 1, fontSize: 20, fontWeight: '700', color: '#333',
    borderBottomWidth: 1.5, borderBottomColor: '#ddd',
    paddingVertical: 6, paddingHorizontal: 2, minWidth: 60,
  },
  inputDark: { color: '#fff', borderBottomColor: 'rgba(255,255,255,0.2)' },
  ftLabel: { fontSize: 12, fontWeight: '700', color: '#999', marginHorizontal: -4 },
  toggle: {
    flexDirection: 'row', borderRadius: 8, overflow: 'hidden',
    borderWidth: 1.5, borderColor: '#ddd',
  },
  toggleDark: { borderColor: 'rgba(255,255,255,0.15)' },
  toggleBtn: { paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#f0f0f0' },
  toggleBtnActive: { backgroundColor: COLORS.greenAccent },
  toggleText: { fontSize: 12, fontWeight: '800', color: '#888' },
  toggleTextActive: { color: '#fff' },
  dark: {},
  light: {},
});

// ─── Add Weight Modal (weight + height + calendar) ────────────────────────────
interface AddWeightModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (weightKg: number, heightCm: number, dateIso: string) => void;
  currentWeightKg: number;
  currentHeightCm: number;
}

function AddWeightModal({ visible, onClose, onSave, currentWeightKg, currentHeightCm }: AddWeightModalProps) {
  const today = new Date();
  const [weightUnit, setWeightUnit] = useState<'kg' | 'lb'>('kg');
  const [weightInput, setWeightInput] = useState(currentWeightKg.toFixed(1));

  // Height state
  const [heightUnit, setHeightUnit] = useState<'cm' | 'in'>('cm');
  const [cmInput, setCmInput] = useState(currentHeightCm.toFixed(0));
  const [feetInput, setFeetInput] = useState(Math.floor((currentHeightCm / 2.54) / 12).toString());
  const [inchesInput, setInchesInput] = useState(((currentHeightCm / 2.54) % 12).toFixed(1));

  // Calendar state
  const [calYear, setCalYear] = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth()); // 0-indexed
  const [selectedDay, setSelectedDay] = useState(today.getDate());

  const MONTH_NAMES = [
    'January','February','March','April','May','June',
    'July','August','September','October','November','December',
  ];
  const DAY_NAMES = ['Su','Mo','Tu','We','Th','Fr','Sa'];

  // Reset when modal opens
  React.useEffect(() => {
    if (visible) {
      const n = new Date();
      setCalYear(n.getFullYear());
      setCalMonth(n.getMonth());
      setSelectedDay(n.getDate());
      setWeightUnit('kg');
      setWeightInput(currentWeightKg.toFixed(1));
      setHeightUnit('cm');
      setCmInput(currentHeightCm.toFixed(0));
      const ti = currentHeightCm / 2.54;
      setFeetInput(Math.floor(ti / 12).toString());
      setInchesInput((ti % 12).toFixed(1));
    }
  }, [visible]);



  const prevMonth = () => {
    if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1); }
    else setCalMonth(m => m - 1);
  };
  const nextMonth = () => {
    const n = new Date();
    // Don't go beyond current month
    if (calYear === n.getFullYear() && calMonth === n.getMonth()) return;
    if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1); }
    else setCalMonth(m => m + 1);
  };

  // Build calendar grid
  const firstDay = new Date(calYear, calMonth, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const todayFull = new Date();
  const isFutureDay = (d: number) => {
    const sel = new Date(calYear, calMonth, d);
    return sel > todayFull;
  };
  const isToday = (d: number) =>
    d === todayFull.getDate() &&
    calMonth === todayFull.getMonth() &&
    calYear === todayFull.getFullYear();

  const calCells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  // Pad to full rows
  while (calCells.length % 7 !== 0) calCells.push(null);

  const handleSave = () => {
    let weightKg = parseFloat(weightInput) || 0;
    if (weightUnit === 'lb') weightKg = weightKg / 2.20462;
    let heightCm: number;
    if (heightUnit === 'in') {
      const ft = parseFloat(feetInput) || 0;
      const inch = parseFloat(inchesInput) || 0;
      heightCm = (ft * 12 + inch) * 2.54;
    } else {
      heightCm = parseFloat(cmInput) || 0;
    }
    if (weightKg <= 0 || heightCm <= 0) {
      Alert.alert('Invalid', 'Please enter valid weight and height values.');
      return;
    }
    const mm = String(calMonth + 1).padStart(2, '0');
    const dd = String(selectedDay).padStart(2, '0');
    const dateIso = `${calYear}-${mm}-${dd}`;
    onSave(weightKg, heightCm, dateIso);
  };

  const isNextDisabled =
    calYear === todayFull.getFullYear() && calMonth === todayFull.getMonth();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={addModalStyles.overlay}
      >
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={onClose}
        />
        <View style={addModalStyles.sheet}>
          {/* Handle bar */}
          <View style={addModalStyles.handle} />

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <Text style={addModalStyles.title}>Log Weight</Text>

          {/* ── Weight + Height ── */}
          <WeightHeightInputs
            weightInput={weightInput} setWeightInput={setWeightInput}
            weightUnit={weightUnit} setWeightUnit={setWeightUnit}
            heightUnit={heightUnit} setHeightUnit={setHeightUnit}
            cmInput={cmInput} setCmInput={setCmInput}
            feetInput={feetInput} setFeetInput={setFeetInput}
            inchesInput={inchesInput} setInchesInput={setInchesInput}
            darkBg
          />

          {/* ── Calendar ── */}
          <View style={addModalStyles.calendarBox}>
            {/* Month navigation */}
            <View style={addModalStyles.calHeader}>
              <TouchableOpacity onPress={prevMonth} style={addModalStyles.navBtn}>
                <Text style={addModalStyles.navArrow}>{'‹'}</Text>
              </TouchableOpacity>
              <Text style={addModalStyles.monthLabel}>
                {MONTH_NAMES[calMonth]} {calYear}
              </Text>
              <TouchableOpacity
                onPress={nextMonth}
                style={[addModalStyles.navBtn, isNextDisabled && { opacity: 0.3 }]}
                disabled={isNextDisabled}
              >
                <Text style={addModalStyles.navArrow}>{'›'}</Text>
              </TouchableOpacity>
            </View>

            {/* Day-of-week headers */}
            <View style={addModalStyles.calWeekRow}>
              {DAY_NAMES.map((d) => (
                <Text key={d} style={addModalStyles.calDayName}>{d}</Text>
              ))}
            </View>

            {/* Calendar grid */}
            <View style={addModalStyles.calGrid}>
              {calCells.map((day, idx) => {
                const future = day ? isFutureDay(day) : false;
                const selected = day === selectedDay;
                const todayMark = day ? isToday(day) : false;
                return (
                  <TouchableOpacity
                    key={idx}
                    style={[
                      addModalStyles.calCell,
                      selected && addModalStyles.calCellSelected,
                      todayMark && !selected && addModalStyles.calCellToday,
                    ]}
                    onPress={() => !future && day && setSelectedDay(day)}
                    disabled={!day || future}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        addModalStyles.calCellText,
                        selected && addModalStyles.calCellTextSelected,
                        (!day || future) && addModalStyles.calCellDisabled,
                        todayMark && !selected && addModalStyles.calCellTodayText,
                      ]}
                    >
                      {day ?? ''}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Selected date display */}
            <View style={addModalStyles.selectedDateRow}>
              <MaterialCommunityIcons name="calendar-check" size={16} color={COLORS.greenAccent} />
              <Text style={addModalStyles.selectedDateText}>
                {'  '}Selected:{' '}
                <Text style={{ fontWeight: '900', color: COLORS.greenAccent }}>
                  {MONTH_NAMES[calMonth]} {selectedDay}, {calYear}
                </Text>
              </Text>
            </View>
          </View>
          </ScrollView>

          {/* ── Actions ── */}
          <View style={addModalStyles.actions}>
            <TouchableOpacity onPress={onClose} style={addModalStyles.cancelBtn}>
              <Text style={addModalStyles.cancelText}>CANCEL</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleSave} style={addModalStyles.saveBtn}>
              <Text style={addModalStyles.saveText}>SAVE</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const addModalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  sheet: {
    backgroundColor: '#1A2340',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: 32,
    paddingTop: 12,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignSelf: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    color: '#fff',
    marginBottom: 20,
    textAlign: 'center',
  },
  // Weight input row
  weightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  weightInput: {
    flex: 1,
    fontSize: 28,
    fontWeight: '900',
    color: '#fff',
    borderBottomWidth: 2,
    borderBottomColor: COLORS.greenAccent,
    paddingVertical: 6,
    paddingHorizontal: 4,
    textAlign: 'center',
  },
  unitToggle: {
    flexDirection: 'row',
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  unitBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: 'rgba(255,255,255,0.07)',
  },
  unitBtnActive: {
    backgroundColor: COLORS.greenAccent,
  },
  unitText: {
    fontSize: 13,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.5)',
  },
  unitTextActive: {
    color: '#fff',
  },
  // Calendar
  calendarBox: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: 12,
    marginBottom: 20,
  },
  calHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  navBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navArrow: {
    fontSize: 22,
    color: '#fff',
    lineHeight: 26,
  },
  monthLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: '#fff',
  },
  calWeekRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  calDayName: {
    flex: 1,
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.4)',
  },
  calGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calCell: {
    width: `${100 / 7}%` as any,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 100,
  },
  calCellSelected: {
    backgroundColor: COLORS.greenAccent,
  },
  calCellToday: {
    borderWidth: 1.5,
    borderColor: COLORS.greenAccent,
  },
  calCellText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },
  calCellTextSelected: {
    color: '#fff',
    fontWeight: '900',
  },
  calCellDisabled: {
    color: 'rgba(255,255,255,0.2)',
  },
  calCellTodayText: {
    color: COLORS.greenAccent,
    fontWeight: '800',
  },
  selectedDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  selectedDateText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
  },
  // Actions
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 15,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.6)',
  },
  saveBtn: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: COLORS.greenAccent,
    alignItems: 'center',
  },
  saveText: {
    fontSize: 15,
    fontWeight: '900',
    color: '#fff',
  },
});

// ─── Edit Weight & Height Modal ───────────────────────────────────────────────
interface EditWeightHeightModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (weightKg: number, heightCm: number) => void;
  currentWeightKg: number;
  currentHeightCm: number;
}

function EditWeightHeightModal({ visible, onClose, onSave, currentWeightKg, currentHeightCm }: EditWeightHeightModalProps) {
  const [weightUnit, setWeightUnit] = useState<'kg' | 'lb'>('kg');
  const [weightInput, setWeightInput] = useState(currentWeightKg.toFixed(1));
  const [heightUnit, setHeightUnit] = useState<'cm' | 'in'>('cm');
  const [cmInput, setCmInput] = useState(currentHeightCm.toFixed(0));
  const [feetInput, setFeetInput] = useState(Math.floor((currentHeightCm / 2.54) / 12).toString());
  const [inchesInput, setInchesInput] = useState(((currentHeightCm / 2.54) % 12).toFixed(1));

  React.useEffect(() => {
    if (visible) {
      setWeightUnit('kg');
      setWeightInput(currentWeightKg.toFixed(1));
      setHeightUnit('cm');
      setCmInput(currentHeightCm.toFixed(0));
      const ti = currentHeightCm / 2.54;
      setFeetInput(Math.floor(ti / 12).toString());
      setInchesInput((ti % 12).toFixed(1));
    }
  }, [visible]);

  const handleSave = () => {
    let weightKg = parseFloat(weightInput) || 0;
    if (weightUnit === 'lb') weightKg = weightKg / 2.20462;
    let heightCm: number;
    if (heightUnit === 'in') {
      const ft = parseFloat(feetInput) || 0;
      const inch = parseFloat(inchesInput) || 0;
      heightCm = (ft * 12 + inch) * 2.54;
    } else {
      heightCm = parseFloat(cmInput) || 0;
    }
    if (weightKg <= 0 || heightCm <= 0) {
      Alert.alert('Invalid Input', 'Please enter valid weight and height values.');
      return;
    }
    onSave(weightKg, heightCm);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={modalStyles.overlay}
      >
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />
        <View style={modalStyles.card}>
          <Text style={modalStyles.sectionTitle}>Edit Profile</Text>
          <WeightHeightInputs
            weightInput={weightInput} setWeightInput={setWeightInput}
            weightUnit={weightUnit} setWeightUnit={setWeightUnit}
            heightUnit={heightUnit} setHeightUnit={setHeightUnit}
            cmInput={cmInput} setCmInput={setCmInput}
            feetInput={feetInput} setFeetInput={setFeetInput}
            inchesInput={inchesInput} setInchesInput={setInchesInput}
          />
          <View style={[modalStyles.actions, { marginTop: 24 }]}>
            <TouchableOpacity onPress={onClose} style={modalStyles.actionBtn}>
              <Text style={modalStyles.cancelText}>CANCEL</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleSave} style={modalStyles.actionBtn}>
              <Text style={modalStyles.saveText}>SAVE</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}


const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 10,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#111',
    marginBottom: 12,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  input: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: '#555',
    borderBottomWidth: 1.5,
    borderBottomColor: '#ddd',
    paddingVertical: 6,
    paddingHorizontal: 2,
    minWidth: 60,
  },
  ftLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#888',
    marginHorizontal: -4,
  },
  unitToggle: {
    flexDirection: 'row',
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#ddd',
  },
  unitBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#f0f0f0',
  },
  unitBtnActive: {
    backgroundColor: COLORS.greenAccent,
  },
  unitBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#888',
  },
  unitBtnTextActive: {
    color: '#fff',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 28,
    gap: 20,
  },
  actionBtn: {
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  cancelText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#29B6F6',
  },
  saveText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#29B6F6',
  },
});

// ─── main screen ──────────────────────────────────────────────────────────────

export default function HealthScreen() {
  const { weight, height, setHeight, addWeightRecord, weightHistory } =
    useSettings();

  const [addWeightVisible, setAddWeightVisible] = useState(false);
  const [editHeightVisible, setEditHeightVisible] = useState(false);
  // Display unit preference (saved per session)
  const [displayWeightUnit, setDisplayWeightUnit] = useState<'kg' | 'lbs'>('lbs');

  // ── Derived metrics ──
  const heightInMeters = height / 100;
  const bmi = weight / (heightInMeters * heightInMeters);
  const bmiVal = Number(bmi.toFixed(2));
  const { label: bmiLabel, color: bmiColor } = getBmiInfo(bmiVal);

  // Current weight display
  const currentDisplayWeight =
    displayWeightUnit === 'lbs'
      ? (weight * 2.20462).toFixed(1)
      : weight.toFixed(1);

  // Last 30-day change
  const last30Change = (() => {
    if (weightHistory.length < 2) return null;
    const first = weightHistory[0].weight;
    const last = weightHistory[weightHistory.length - 1].weight;
    const diff =
      displayWeightUnit === 'lbs'
        ? (last - first) * 2.20462
        : last - first;
    
    if (Math.abs(diff) < 0.1) return 'No change';
    const action = diff > 0 ? 'Increased by' : 'Decreased by';
    return `${action} ${Math.abs(diff).toFixed(1)} ${displayWeightUnit}`;
  })();

  // Badge color: orange = gained weight, green = lost weight
  const last30BadgeColor = (() => {
    if (weightHistory.length < 2) return COLORS.cardBackground;
    const diff = weightHistory[weightHistory.length - 1].weight - weightHistory[0].weight;
    if (diff > 0) return '#FFA726'; // gain = orange
    if (diff < 0) return '#66BB6A'; // loss = green
    return COLORS.cardBackground;
  })();

  const handleAddWeight = (weightKg: number, heightCm: number, dateIso: string) => {
    addWeightRecord(weightKg, dateIso);
    setHeight(heightCm);
    setAddWeightVisible(false);
  };

  const handleEditWeight = (weightKg: number, heightCm: number) => {
    addWeightRecord(weightKg);
    setHeight(heightCm);
    setEditHeightVisible(false);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Health</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >

        {/* ── Workout Banner ──────────────────────────────────────────────── */}
        <TouchableOpacity
          style={styles.workoutBanner}
          activeOpacity={0.85}
          onPress={() => Alert.alert('Workout', 'Starting your fast workout session!')}
        >
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
            <TouchableOpacity onPress={() => setAddWeightVisible(true)}>
              <Text style={styles.addLink}>ADD</Text>
            </TouchableOpacity>
          </View>

          {/* Current weight + last 30 days badge */}
          <View style={styles.weightRow}>
            <View>
              <Text style={styles.weightSub}>Current</Text>
              <Text style={styles.weightVal}>
                {currentDisplayWeight}{' '}
                <Text style={styles.weightUnit}>{displayWeightUnit}</Text>
              </Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.weightSub}>Last 30 days</Text>
              <View
                style={[
                  styles.last30Badge,
                  { backgroundColor: last30BadgeColor },
                ]}
              >
                <Text style={styles.last30Text}>
                  {last30Change ?? '-.-'}
                </Text>
              </View>
            </View>
          </View>

          {/* Year label */}
          <Text style={styles.yearLabel}>2026</Text>

          {/* Weight graph */}
          <WeightGraph history={weightHistory} unit={displayWeightUnit} currentWeight={weight} />
        </View>

        {/* ── BMI Section ─────────────────────────────────────────────────── */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.bmiTitle}>
              BMI (kg/m²):{' '}
              <Text style={[styles.bmiValue, { color: bmiColor }]}>
                {bmiVal}
              </Text>
            </Text>
            <TouchableOpacity onPress={() => setEditHeightVisible(true)}>
              <Text style={styles.addLink}>EDIT</Text>
            </TouchableOpacity>
          </View>

          <View style={{ marginTop: 12 }}>
            <BmiColorBar bmi={bmiVal} />
          </View>

          {/* Height display */}
          <View style={styles.heightRow}>
            <MaterialCommunityIcons
              name="human-male-height"
              size={16}
              color={COLORS.textSecondary}
            />
            <Text style={styles.heightText}>
              Height:{' '}
              {(() => {
                const totalIn = height / 2.54;
                const ft = Math.floor(totalIn / 12);
                const inch = (totalIn % 12).toFixed(1);
                return `${height.toFixed(0)} cm  (${ft}ft ${inch}in)`;
              })()}
            </Text>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ── Add Weight Modal (with calendar) ───────────────────────────────── */}
      <AddWeightModal
        visible={addWeightVisible}
        onClose={() => setAddWeightVisible(false)}
        onSave={handleAddWeight}
        currentWeightKg={weight}
        currentHeightCm={height}
      />

      {/* ── Edit Weight & Height Modal ──────────────────────────────────────────────── */}
      <EditWeightHeightModal
        visible={editHeightVisible}
        onClose={() => setEditHeightVisible(false)}
        onSave={handleEditWeight}
        currentWeightKg={weight}
        currentHeightCm={height}
      />
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
    marginBottom: 2,
  },
  weightVal: {
    fontSize: 30,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  weightUnit: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  last30Badge: {
    backgroundColor: COLORS.yellow,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 56,
  },
  last30Text: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
  },
  yearLabel: {
    fontSize: 10,
    color: COLORS.textSecondary,
    fontWeight: '600',
    marginBottom: 4,
    paddingLeft: 36,
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

  // Height
  heightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  heightText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
});
