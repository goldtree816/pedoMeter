import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING } from '../../constants/theme';
import { useSettings } from '../../context/SettingsContext';
import WheelPicker from '../../components/WheelPicker';

export default function NewRecordScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ editId?: string }>();
  const { records, dailyGoal, addSteps, updateSteps } = useSettings();

  const isEditing = !!params.editId;
  const editRecord = isEditing ? records.find(r => r.id === params.editId) : null;

  // Form states
  const [stepsInput, setStepsInput] = useState('2000');
  const [note, setNote] = useState('');
  
  // Custom Time picker states
  const hoursItems = Array.from({ length: 24 }).map((_, i) => i.toString().padStart(2, '0'));
  const minutesItems = Array.from({ length: 60 }).map((_, i) => i.toString().padStart(2, '0'));
  const dateItems = ['3 days ago', '2 days ago', 'Yesterday', 'Today'];

  const [selectedDateIndex, setSelectedDateIndex] = useState(3); // Default to 'Today'
  const [selectedHourIndex, setSelectedHourIndex] = useState(new Date().getHours());
  const [selectedMinuteIndex, setSelectedMinuteIndex] = useState(new Date().getMinutes());

  // Populate form if editing
  useEffect(() => {
    if (isEditing && editRecord) {
      setStepsInput(editRecord.steps.toString());
      setNote(editRecord.note || '');
      
      const recordDate = new Date(editRecord.date);
      setSelectedHourIndex(recordDate.getHours());
      setSelectedMinuteIndex(recordDate.getMinutes());
      
      // Determine date offset
      const today = new Date();
      today.setHours(0,0,0,0);
      const logDay = new Date(editRecord.date);
      logDay.setHours(0,0,0,0);
      const diffTime = today.getTime() - logDay.getTime();
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0) setSelectedDateIndex(3);
      else if (diffDays === 1) setSelectedDateIndex(2);
      else if (diffDays === 2) setSelectedDateIndex(1);
      else if (diffDays === 3) setSelectedDateIndex(0);
      else setSelectedDateIndex(3); // Fallback
    }
  }, [isEditing, editRecord]);

  const handleIncrement = (amount: number) => {
    const val = parseInt(stepsInput, 10);
    if (!isNaN(val)) {
      setStepsInput(Math.max(0, val + amount).toString());
    }
  };

  const handleSave = () => {
    const steps = parseInt(stepsInput, 10);
    if (isNaN(steps) || steps <= 0) {
      Alert.alert("Invalid Input", "Please enter a valid step count greater than 0.");
      return;
    }

    // Construct selected Date object
    const targetDate = new Date();
    const dateOffset = 3 - selectedDateIndex; // Today=3 => offset=0, Yesterday=2 => offset=1, etc.
    targetDate.setDate(targetDate.getDate() - dateOffset);
    targetDate.setHours(selectedHourIndex, selectedMinuteIndex, 0, 0);

    if (isEditing && params.editId) {
      updateSteps(params.editId, steps, targetDate, note);
      Alert.alert("Record Updated", "Your step log has been saved.");
    } else {
      addSteps(steps, targetDate, note);
      Alert.alert("Record Created", "Your steps have been logged successfully.");
    }
    
    router.back();
  };

  // Forecast how the added steps will boost goal completion
  const getGoalForecast = () => {
    const steps = parseInt(stepsInput, 10);
    if (isNaN(steps) || steps <= 0) return '0%';
    const totalTodayPlusNew = steps;
    const pct = Math.min(100, Math.round((totalTodayPlusNew / dailyGoal) * 100));
    return `${pct}%`;
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.closeButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons name="close" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{isEditing ? 'Edit record' : 'New record'}</Text>
        <View style={{ width: 40 }} /> {/* Spacer */}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Step Increments Card */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Steps taken</Text>
          
          <View style={styles.stepsInputRow}>
            <TouchableOpacity 
              style={styles.stepBtn}
              onPress={() => handleIncrement(-500)}
              activeOpacity={0.7}
            >
              <Text style={styles.stepBtnText}>-500</Text>
            </TouchableOpacity>

            <TextInput
              style={styles.stepsDisplayInput}
              keyboardType="number-pad"
              value={stepsInput}
              onChangeText={setStepsInput}
            />

            <TouchableOpacity 
              style={styles.stepBtn}
              onPress={() => handleIncrement(500)}
              activeOpacity={0.7}
            >
              <Text style={styles.stepBtnText}>+500</Text>
            </TouchableOpacity>
          </View>

          {/* Goal contribution forecast indicator */}
          <View style={styles.forecastContainer}>
            <View style={styles.forecastInfo}>
              <MaterialCommunityIcons name="trophy-outline" size={16} color={COLORS.yellow} />
              <Text style={styles.forecastText}>
                Goal progression: <Text style={styles.forecastHighlight}>{getGoalForecast()}</Text> of daily goal
              </Text>
            </View>
          </View>
        </View>

        {/* Date & Time Wheel Pickers */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Date & Time</Text>
          
          <View style={styles.pickersRow}>
            {/* Date Scroller */}
            <View style={styles.pickerCol}>
              <Text style={styles.pickerLabel}>Day</Text>
              <WheelPicker
                items={dateItems}
                selectedIndex={selectedDateIndex}
                onIndexChange={setSelectedDateIndex}
                itemHeight={38}
              />
            </View>

            {/* Separator */}
            <View style={styles.pickerSeparator} />

            {/* Hour Scroller */}
            <View style={styles.pickerCol}>
              <Text style={styles.pickerLabel}>Hour</Text>
              <WheelPicker
                items={hoursItems}
                selectedIndex={selectedHourIndex}
                onIndexChange={setSelectedHourIndex}
                itemHeight={38}
              />
            </View>

            {/* Separator */}
            <View style={styles.pickerSeparator} />

            {/* Minute Scroller */}
            <View style={styles.pickerCol}>
              <Text style={styles.pickerLabel}>Min</Text>
              <WheelPicker
                items={minutesItems}
                selectedIndex={selectedMinuteIndex}
                onIndexChange={setSelectedMinuteIndex}
                itemHeight={38}
              />
            </View>
          </View>
        </View>

        {/* Note Option */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Add Note</Text>
          <TextInput
            style={styles.noteInput}
            value={note}
            onChangeText={setNote}
            placeholder="E.g., Park run, morning walk..."
            placeholderTextColor="#5A6482"
          />
        </View>

      </ScrollView>

      {/* Sticky Bottom Save Button */}
      <View style={styles.buttonWrapper}>
        <TouchableOpacity 
          style={styles.saveButton}
          activeOpacity={0.8}
          onPress={handleSave}
        >
          <Text style={styles.saveButtonText}>SAVE</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.four,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#242F4D',
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  scrollContent: {
    paddingHorizontal: SPACING.four,
    paddingTop: 16,
    paddingBottom: 100, // Leave space for Save button
  },
  card: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.four,
  },
  cardLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 16,
  },
  stepsInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  stepBtn: {
    backgroundColor: '#1E2841',
    borderWidth: 1,
    borderColor: '#34405F',
    borderRadius: 14,
    height: 46,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepBtnText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '800',
  },
  stepsDisplayInput: {
    flex: 1,
    backgroundColor: '#161C2E',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    height: 54,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  forecastContainer: {
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#242F4D',
    paddingTop: 14,
  },
  forecastInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  forecastText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  forecastHighlight: {
    color: COLORS.greenAccent,
    fontWeight: '900',
  },
  pickersRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#161C2E',
    borderRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  pickerCol: {
    flex: 1,
    alignItems: 'center',
  },
  pickerLabel: {
    fontSize: 10,
    color: COLORS.textSecondary,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  pickerSeparator: {
    width: 1,
    height: 60,
    backgroundColor: '#242F4D',
  },
  noteInput: {
    backgroundColor: '#161C2E',
    borderRadius: 14,
    height: 48,
    paddingHorizontal: 16,
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  buttonWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: SPACING.four,
    paddingVertical: SPACING.four,
    backgroundColor: COLORS.background,
  },
  saveButton: {
    backgroundColor: COLORS.greenAccent,
    borderRadius: 28,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.greenAccent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
  },
});
