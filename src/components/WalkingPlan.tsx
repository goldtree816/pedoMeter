import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING } from '../constants/theme';
import { useSettings, WalkingGoal, GOAL_LABELS } from '../context/SettingsContext';

interface WalkingPlanProps {
  onNextPress?: () => void;
}

export default function WalkingPlan({ onNextPress }: WalkingPlanProps) {
  const { selectedGoal, setSelectedGoal } = useSettings();

  const goalsList: { key: WalkingGoal; icon: keyof typeof MaterialCommunityIcons.glyphMap }[] = [
    { key: 'lose_weight', icon: 'human-capacity-decrease' },
    { key: 'stay_fit', icon: 'heart-pulse' },
    { key: 'reduce_stress', icon: 'flower' },
    { key: 'sleep_better', icon: 'weather-night' },
  ];

  const handleNext = () => {
    if (onNextPress) {
      onNextPress();
    } else {
      const label = GOAL_LABELS[selectedGoal].title;
      Alert.alert("Plan Activated", `Your walking plan for "${label}" has been set up successfully!`);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Title Section */}
        <View style={styles.titleSection}>
          <Text style={styles.mainTitle}>Personalized walking plan</Text>
          <Text style={styles.subtitle}>What's your goal?</Text>
        </View>

        {/* Goals List */}
        <View style={styles.goalsContainer}>
          {goalsList.map((goalItem) => {
            const isSelected = selectedGoal === goalItem.key;
            const details = GOAL_LABELS[goalItem.key];
            
            return (
              <TouchableOpacity
                key={goalItem.key}
                style={[
                  styles.goalCard,
                  isSelected && styles.goalCardSelected
                ]}
                activeOpacity={0.8}
                onPress={() => setSelectedGoal(goalItem.key)}
              >
                <View style={styles.cardLeft}>
                  <View style={[styles.iconContainer, isSelected && styles.iconContainerSelected]}>
                    <MaterialCommunityIcons 
                      name={goalItem.icon} 
                      size={24} 
                      color={isSelected ? COLORS.greenAccent : '#A5B1C2'} 
                    />
                  </View>
                  <View style={styles.textContainer}>
                    <Text style={styles.goalTitle}>{details.title}</Text>
                    <Text style={styles.goalDesc}>{details.desc}</Text>
                  </View>
                </View>

                {/* Checkbox Circle */}
                <View style={[
                  styles.checkbox,
                  isSelected && styles.checkboxSelected
                ]}>
                  {isSelected && (
                    <MaterialCommunityIcons name="check" size={14} color="#FFFFFF" />
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* Sticky Bottom Next Button */}
      <View style={styles.buttonWrapper}>
        <TouchableOpacity 
          style={styles.nextButton}
          activeOpacity={0.8}
          onPress={handleNext}
        >
          <Text style={styles.nextButtonText}>Next</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.four,
    paddingTop: 16,
    paddingBottom: 100, // Leave space for the next button
  },
  titleSection: {
    alignItems: 'center',
    marginVertical: SPACING.four,
    gap: SPACING.two,
  },
  mainTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    fontWeight: '600',
  },
  goalsContainer: {
    gap: 16,
    marginTop: SPACING.three,
  },
  goalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.cardBackground,
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  goalCardSelected: {
    borderColor: 'rgba(38, 195, 106, 0.4)',
    backgroundColor: '#1E294B', // highlight card background slightly
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flex: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#1B243B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainerSelected: {
    backgroundColor: 'rgba(38, 195, 106, 0.1)',
  },
  textContainer: {
    flex: 1,
  },
  goalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  goalDesc: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '600',
    marginTop: 4,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#3D4660',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: COLORS.greenAccent,
    borderColor: COLORS.greenAccent,
  },
  buttonWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: SPACING.four,
    paddingVertical: SPACING.four,
    backgroundColor: COLORS.background, // blend with background
  },
  nextButton: {
    backgroundColor: COLORS.greenAccent,
    borderRadius: 28,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0px 4px 8px rgba(38, 195, 106, 0.3)',
    elevation: 4,
  },
  nextButtonText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
