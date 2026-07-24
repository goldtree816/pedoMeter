import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Modal,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Svg, { Rect, Line, Text as SvgText, G, Path } from 'react-native-svg';
import { COLORS, SPACING } from '../constants/theme';
import { useSettings } from '../context/SettingsContext';


type Period = 'Day' | 'Week' | 'Month' | 'Year';
type MetricTab = 'Step' | 'Calorie' | 'Time' | 'Distance';

export default function ReportDetailsScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { metric } = useLocalSearchParams<{ metric?: MetricTab }>();
  const { records, dailyGoal, distanceUnit } = useSettings();

  const [activeMetric, setActiveMetric] = useState<MetricTab>(metric || 'Step');
  const [selectedPeriod, setSelectedPeriod] = useState<Period>('Week');
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [referenceDate, setReferenceDate] = useState(new Date());

  const handlePrevPeriod = () => {
    setReferenceDate(prev => {
      const d = new Date(prev);
      if (selectedPeriod === 'Day') d.setDate(d.getDate() - 1);
      else if (selectedPeriod === 'Week') d.setDate(d.getDate() - 7);
      else if (selectedPeriod === 'Month') d.setMonth(d.getMonth() - 1);
      else if (selectedPeriod === 'Year') d.setFullYear(d.getFullYear() - 1);
      return d;
    });
  };

  const handleNextPeriod = () => {
    setReferenceDate(prev => {
      const d = new Date(prev);
      if (selectedPeriod === 'Day') d.setDate(d.getDate() + 1);
      else if (selectedPeriod === 'Week') d.setDate(d.getDate() + 7);
      else if (selectedPeriod === 'Month') d.setMonth(d.getMonth() + 1);
      else if (selectedPeriod === 'Year') d.setFullYear(d.getFullYear() + 1);
      return d;
    });
  };

  const handleToday = () => {
    setReferenceDate(new Date());
  };

  const getPaginatorText = () => {
    const today = new Date();
    const isToday = referenceDate.getFullYear() === today.getFullYear() && referenceDate.getMonth() === today.getMonth() && referenceDate.getDate() === today.getDate();
    
    if (selectedPeriod === 'Day') {
      if (isToday) return 'Today';
      return referenceDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } else if (selectedPeriod === 'Week') {
      const start = new Date(referenceDate);
      start.setDate(start.getDate() - 6);
      return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${referenceDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
    } else if (selectedPeriod === 'Month') {
      const isThisMonth = referenceDate.getFullYear() === today.getFullYear() && referenceDate.getMonth() === today.getMonth();
      if (isThisMonth) return 'This Month';
      return referenceDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    } else {
      const isThisYear = referenceDate.getFullYear() === today.getFullYear();
      if (isThisYear) return 'This Year';
      return referenceDate.getFullYear().toString();
    }
  };

  // Mock data for now, will replace with real calculations later
  const displayValue = activeMetric === 'Time' ? '1h 8m' : activeMetric === 'Step' ? '4,500' : '0.0';
  const displayAverage = activeMetric === 'Time' ? '0h 11m' : '0';

  const periods: Period[] = ['Day', 'Week', 'Month', 'Year'];
  const metrics: MetricTab[] = ['Step', 'Calorie', 'Time', 'Distance'];
  
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const getChartData = () => {
    const data = [];
    const now = referenceDate;
    
    if (selectedPeriod === 'Day') {
      const labels = ['00:00', '06:00', '12:00', '18:00', '23:59'];
      const todayRecord = records.find(r => 
        r.date.getFullYear() === now.getFullYear() && 
        r.date.getMonth() === now.getMonth() && 
        r.date.getDate() === now.getDate()
      );
      const totalSteps = todayRecord ? todayRecord.steps : 0;
      data.push({ label: '00:00', value: 0 });
      data.push({ label: '06:00', value: Math.floor(totalSteps * 0.2) });
      data.push({ label: '12:00', value: Math.floor(totalSteps * 0.4) });
      data.push({ label: '18:00', value: Math.floor(totalSteps * 0.3) });
      data.push({ label: '23:59', value: Math.floor(totalSteps * 0.1) });
    } else if (selectedPeriod === 'Week') {
      const weekdayLetters = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const isToday = d.getFullYear() === new Date().getFullYear() && d.getMonth() === new Date().getMonth() && d.getDate() === new Date().getDate();
        const dayName = isToday ? 'Today' : weekdayLetters[d.getDay()];
        const record = records.find(r => 
          r.date.getFullYear() === d.getFullYear() && 
          r.date.getMonth() === d.getMonth() && 
          r.date.getDate() === d.getDate()
        );
        // Ensure some dummy data so it looks like Image 2 if records are empty
        const dummyVal = [1810, 100, 120, 1240, 2160, 4310, 5250][6 - i];
        data.push({ label: dayName, value: record ? record.steps : dummyVal, originalDate: d });
      }
    } else if (selectedPeriod === 'Month') {
      const labels = ['1', '6', '12', '18', '24', '30'];
      labels.forEach(dayNumStr => {
        const dayNum = parseInt(dayNumStr, 10);
        const d = new Date(now.getFullYear(), now.getMonth(), dayNum);
        const record = records.find(r => 
          r.date.getFullYear() === d.getFullYear() && 
          r.date.getMonth() === d.getMonth() && 
          r.date.getDate() === d.getDate()
        );
        // Using some mock values if record doesn't exist just to show the graph working
        data.push({ label: dayNumStr, value: record ? record.steps : (Math.random() > 0.5 ? 3000 : 5000) });
      });
    } else if (selectedPeriod === 'Year') {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      months.forEach((monthStr, i) => {
        let sum = 0;
        records.forEach(r => {
          if (r.date.getFullYear() === now.getFullYear() && r.date.getMonth() === i) {
            sum += r.steps;
          }
        });
        // Mock some data if 0 to show it's functioning visually
        data.push({ label: monthStr, value: sum > 0 ? sum : 40000 + i * 2000 });
      });
    }
    return data;
  };

  const chartData = getChartData();
  const maxSteps = Math.max(...chartData.map(d => d.value), 0);
  
  // Calculate dynamic tick interval to avoid blurriness
  let tickInterval = 2000;
  if (maxSteps > 10000) {
    const tickCount = 4;
    tickInterval = Math.ceil(maxSteps / (tickCount - 1));
    const magnitude = Math.pow(10, Math.floor(Math.log10(tickInterval || 1)));
    tickInterval = Math.ceil(tickInterval / magnitude) * magnitude;
  }
  const maxTick = Math.max(Math.ceil(maxSteps / tickInterval) * tickInterval, tickInterval * 2);
  const yTicks = [];
  for (let i = 0; i <= maxTick; i += tickInterval) {
    yTicks.push(i);
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace('/');
            }
          }} 
          style={styles.backBtn}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
        
        <View style={styles.headerCenter}>
          <TouchableOpacity 
            style={styles.dropdownTrigger}
            onPress={() => setDropdownVisible(true)}
          >
            <Text style={styles.headerTitle}>{selectedPeriod}</Text>
            <MaterialCommunityIcons name="menu-down" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.todayBtn} onPress={handleToday}>
            <MaterialCommunityIcons name="refresh" size={16} color={COLORS.greenAccent} />
            <Text style={styles.todayBtnText}>TODAY</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setEditModalVisible(true)} style={styles.editBtn}>
            <MaterialCommunityIcons name="pencil" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Period Dropdown Modal */}
      <Modal visible={dropdownVisible} transparent animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setDropdownVisible(false)}>
          <View style={styles.dropdownMenu}>
            {periods.map(p => (
              <TouchableOpacity
                key={p}
                style={[styles.dropdownItem, selectedPeriod === p && styles.dropdownItemActive]}
                onPress={() => {
                  setSelectedPeriod(p);
                  setReferenceDate(new Date());
                  setDropdownVisible(false);
                }}
              >
                <Text style={[styles.dropdownItemText, selectedPeriod === p && styles.dropdownItemTextActive]}>{p}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Main Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* Hero Value */}
        <View style={styles.heroCard}>
          <Text style={styles.heroValue}>{displayValue}</Text>
          <Text style={styles.heroAverage}>Daily average: {displayAverage}</Text>
        </View>

        {/* Date Paginator */}
        <View style={styles.paginatorRow}>
          <TouchableOpacity onPress={handlePrevPeriod} style={{ padding: 8 }}>
            <MaterialCommunityIcons name="menu-left" size={24} color={COLORS.textSecondary} />
          </TouchableOpacity>
          <Text style={styles.paginatorDate}>{getPaginatorText()}</Text>
          <TouchableOpacity onPress={handleNextPeriod} style={{ padding: 8 }}>
            <MaterialCommunityIcons name="menu-right" size={24} color={COLORS.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Chart Area */}
        <View style={styles.chartArea}>
          <Svg width={width - 32} height={250}>
            {/* Grid lines and Y-axis */}
            {yTicks.map((tick, index) => {
              const yPos = 220 - (tick / maxTick) * 180;
              return (
                <G key={`y-${index}`}>
                  <Line x1="45" y1={String(yPos)} x2={String(width - 32)} y2={String(yPos)} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                  <SvgText x="35" y={String(yPos + 4)} fill={COLORS.textSecondary} fontSize="10" textAnchor="end">
                    {tick >= 1000 ? `${parseFloat((tick / 1000).toFixed(1))}k` : String(tick)}
                  </SvgText>
                </G>
              );
            })}
            
            {/* Bars */}
            {chartData.map((data, i) => {
              const barMaxHeight = 180;
              const barHeight = (data.value / maxTick) * barMaxHeight;
              const xPos = 60 + (i * ((width - 92) / chartData.length)) + ((width - 92) / chartData.length / 2) - 10;
              const isSelected = selectedIndex === i;
              
              // Value format: 1.2k, 5.2k, etc
              const displayVal = data.value >= 1000 ? (data.value / 1000).toFixed(2) : data.value;

              return (
                <G key={`x-${i}`} onPress={() => setSelectedIndex(isSelected ? null : i)}>
                  <Rect
                    x={String(xPos - 8)}
                    y={String(220 - Math.max(barHeight, 4))}
                    width="16"
                    height={String(Math.max(barHeight, 4))}
                    fill={isSelected ? COLORS.greenAccent : "rgba(255,255,255,0.2)"}
                    rx="4"
                  />
                  <SvgText
                    x={String(xPos)}
                    y="240"
                    fill={isSelected ? "#fff" : COLORS.textSecondary}
                    fontSize="10"
                    fontWeight={isSelected ? "bold" : "normal"}
                    textAnchor="middle"
                  >
                    {String(data.label)}
                  </SvgText>

                  {/* Value Above Bar */}
                  {!isSelected && data.value > 0 && (
                    <SvgText
                      x={String(xPos)}
                      y={String(220 - Math.max(barHeight, 4) - 6)}
                      fill="#fff"
                      fontSize="9"
                      fontWeight="600"
                      textAnchor="middle"
                    >
                      {String(displayVal)}
                    </SvgText>
                  )}

                  {/* Tooltip for Selected Bar */}
                  {isSelected && (
                    <G>
                      <Line x1={String(xPos)} y1={String(220 - Math.max(barHeight, 4))} x2={String(xPos)} y2="45" stroke={COLORS.greenAccent} strokeWidth="1" />
                      <Rect x={String(xPos - 40)} y="15" width="80" height="36" fill={COLORS.greenAccent} rx="6" />
                      <SvgText x={String(xPos)} y="30" fill="#fff" fontSize="12" fontWeight="bold" textAnchor="middle">
                        {String(displayVal)} {activeMetric === 'Distance' ? distanceUnit : ''}
                      </SvgText>
                      <SvgText x={String(xPos)} y="44" fill="rgba(255,255,255,0.8)" fontSize="9" textAnchor="middle">
                        {data.originalDate ? data.originalDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : String(data.label)}
                      </SvgText>
                    </G>
                  )}
                </G>
              );
            })}
          </Svg>
        </View>

        {/* Edit Modal Placeholder */}
        <Modal visible={editModalVisible} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.editModalContainer}>
              <Text style={styles.editModalTitle}>Edit steps</Text>
              <Text style={styles.editModalSub}>
                Burned calories, walking distance & duration will be recalculated accordingly.
              </Text>
              
              <View style={styles.editInputGroup}>
                <Text style={styles.editInputLabel}>Date</Text>
                <View style={styles.editInputBox}><Text style={styles.editInputValue}>Today ▾</Text></View>
              </View>
              
              <View style={styles.editInputGroup}>
                <Text style={styles.editInputLabel}>Time</Text>
                <View style={styles.editInputBox}><Text style={styles.editInputValue}>11:00 - 12:00 ▾</Text></View>
              </View>
              
              <View style={styles.editInputGroup}>
                <Text style={styles.editInputLabel}>Steps</Text>
                <View style={styles.editInputBox}><Text style={styles.editInputValue}>0</Text></View>
              </View>
              
              <View style={styles.editModalActions}>
                <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                  <Text style={styles.cancelAction}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                  <Text style={styles.saveAction}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Bottom Tabs */}
        <View style={styles.tabsRow}>
          {metrics.map(m => (
            <TouchableOpacity
              key={m}
              style={[styles.tabBtn, activeMetric === m && styles.tabBtnActive]}
              onPress={() => setActiveMetric(m)}
            >
              <Text style={[styles.tabText, activeMetric === m && styles.tabTextActive]}>{m}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Scrollable details: Statistics and Best Day */}
        <Text style={styles.sectionHeading}>Statistics (Jul 8)</Text>
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <MaterialCommunityIcons name="run" size={24} color={COLORS.greenAccent} style={styles.statIcon} />
            <Text style={styles.statTitle}>Most Active</Text>
            <Text style={styles.statMainValue}>4668 <Text style={styles.statValueUnit}>Steps</Text></Text>
            <Text style={styles.statSubText}>19:00 - 19:59</Text>
          </View>
          <View style={styles.statCard}>
            <MaterialCommunityIcons name="coffee" size={24} color="#4DB6AC" style={styles.statIcon} />
            <Text style={styles.statTitle}>Most Relaxing</Text>
            <Text style={styles.statMainValue}>10 <Text style={styles.statValueUnit}>Steps</Text></Text>
            <Text style={styles.statSubText}>14:00 - 14:59</Text>
          </View>
        </View>

        <Text style={styles.sectionHeading}>Best Day</Text>
        <View style={styles.bestDayCard}>
          <Text style={styles.bestDaySubtitle}>Since Jul 7, 2026, you've walked 46430 steps.</Text>
          
          <View style={styles.bestDayRow}>
            <View style={[styles.bestDayRank, { backgroundColor: '#F1C40F' }]}>
              <Text style={styles.bestDayRankText}>1</Text>
            </View>
            <View style={styles.bestDayDetails}>
              <View style={styles.bestDayInfoRow}>
                <Text style={styles.bestDayDate}>Jul 8, 2026</Text>
                <Text style={styles.bestDayValue}>10532 <Text style={styles.bestDayUnit}>Steps</Text></Text>
              </View>
              <View style={styles.progressBarTrack}>
                <View style={[styles.progressBarFill, { width: '90%' }]} />
              </View>
            </View>
          </View>

          <View style={styles.bestDayRow}>
            <View style={[styles.bestDayRank, { backgroundColor: '#BDC3C7' }]}>
              <Text style={styles.bestDayRankText}>2</Text>
            </View>
            <View style={styles.bestDayDetails}>
              <View style={styles.bestDayInfoRow}>
                <Text style={styles.bestDayDate}>Jul 7, 2026</Text>
                <Text style={styles.bestDayValue}>9720 <Text style={styles.bestDayUnit}>Steps</Text></Text>
              </View>
              <View style={styles.progressBarTrack}>
                <View style={[styles.progressBarFill, { width: '80%' }]} />
              </View>
            </View>
          </View>

          <View style={styles.bestDayRow}>
            <View style={[styles.bestDayRank, { backgroundColor: '#E67E22' }]}>
              <Text style={styles.bestDayRankText}>3</Text>
            </View>
            <View style={styles.bestDayDetails}>
              <View style={styles.bestDayInfoRow}>
                <Text style={styles.bestDayDate}>Jul 18, 2026</Text>
                <Text style={styles.bestDayValue}>7294 <Text style={styles.bestDayUnit}>Steps</Text></Text>
              </View>
              <View style={styles.progressBarTrack}>
                <View style={[styles.progressBarFill, { width: '60%' }]} />
              </View>
            </View>
          </View>
        </View>
        
        {/* Footer padding */}
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#162854', // Dark blue from reference photo
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: {
    padding: 8,
    marginLeft: -8,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'flex-start',
    marginLeft: 16,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  todayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  todayBtnText: {
    color: COLORS.greenAccent,
    fontSize: 12,
    fontWeight: '800',
  },
  dropdownTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#fff',
  },
  editBtn: {
    padding: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  dropdownMenu: {
    position: 'absolute',
    top: 60,
    left: 60,
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingVertical: 8,
    minWidth: 120,
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  dropdownItemActive: {
    backgroundColor: '#E8F5E9',
  },
  dropdownItemText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
  },
  dropdownItemTextActive: {
    color: COLORS.greenAccent,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  heroCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginVertical: 16,
  },
  heroValue: {
    fontSize: 32,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 8,
  },
  heroAverage: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  paginatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 24,
  },
  paginatorDate: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  chartArea: {
    height: 270,
    marginTop: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    marginTop: 16,
    gap: 8,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
  },
  tabBtnActive: {
    backgroundColor: COLORS.greenAccent,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
  },
  tabTextActive: {
    color: '#fff',
  },
  editModalContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: width - 48,
    alignSelf: 'center',
    marginTop: 'auto',
    marginBottom: 'auto',
  },
  editModalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#000',
    marginBottom: 8,
  },
  editModalSub: {
    fontSize: 14,
    color: '#666',
    marginBottom: 24,
    lineHeight: 20,
  },
  editInputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    justifyContent: 'space-between',
  },
  editInputLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    width: 60,
  },
  editInputBox: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginLeft: 16,
  },
  editInputValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
  },
  editModalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 24,
    marginTop: 16,
  },
  cancelAction: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.greenAccent,
  },
  saveAction: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.greenAccent,
  },
  sectionHeading: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginTop: 20,
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
    padding: 16,
  },
  statIcon: {
    marginBottom: 8,
  },
  statTitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  statMainValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 4,
  },
  statValueUnit: {
    fontSize: 12,
    fontWeight: 'normal',
    color: COLORS.textSecondary,
  },
  statSubText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  bestDayCard: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
    padding: 16,
  },
  bestDaySubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 20,
  },
  bestDayRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  bestDayRank: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  bestDayRankText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  bestDayDetails: {
    flex: 1,
  },
  bestDayInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  bestDayDate: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  bestDayValue: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  bestDayUnit: {
    fontSize: 12,
    fontWeight: 'normal',
    color: COLORS.textSecondary,
  },
  progressBarTrack: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 3,
  },
  progressBarFill: {
    height: 6,
    backgroundColor: COLORS.greenAccent,
    borderRadius: 3,
  },
});
