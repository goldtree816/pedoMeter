import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING } from '../../constants/theme';
import { useSettings } from '../../context/SettingsContext';

// ─── small helper ────────────────────────────────────────────────────────────

function Divider() {
  return <View style={styles.divider} />;
}

interface RowProps {
  icon: React.ReactNode;
  label: string;
  sublabel?: string;
  rightContent?: React.ReactNode;
  onPress?: () => void;
  danger?: boolean;
}

function SettingRow({ icon, label, sublabel, rightContent, onPress, danger }: RowProps) {
  return (
    <TouchableOpacity
      style={styles.row}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={styles.rowIcon}>{icon}</View>
      <View style={styles.rowBody}>
        <Text style={[styles.rowLabel, danger && { color: '#EF5350' }]}>{label}</Text>
        {sublabel ? <Text style={styles.rowSub}>{sublabel}</Text> : null}
      </View>
      {rightContent ? (
        <View style={styles.rowRight}>{rightContent}</View>
      ) : null}
    </TouchableOpacity>
  );
}

// ─── screen ─────────────────────────────────────────────────────────────────

export default function MoreScreen() {
  const {
    dailyGoal,
    weight,
    height,
    distanceUnit,
    setDailyGoal,
    setWeight,
    setDistanceUnit,
    resetAllData,
  } = useSettings();

  const [splashEnabled, setSplashEnabled] = useState(true);
  const [reminderOn, setReminderOn] = useState(false);

  const handleStepGoal = () => {
    Alert.prompt(
      'Step Goal',
      'Enter your daily step goal:',
      (text) => {
        const val = parseInt(text, 10);
        if (!isNaN(val) && val > 0) setDailyGoal(val);
      },
      'plain-text',
      dailyGoal.toString(),
      'numeric'
    );
  };

  const handleWeight = () => {
    Alert.prompt(
      'Weight',
      'Enter your weight (lbs):',
      (text) => {
        const val = parseFloat(text);
        if (!isNaN(val) && val > 0) setWeight(val);
      },
      'plain-text',
      (weight * 2.20462).toFixed(1),
      'numeric'
    );
  };

  const handleReset = () => {
    Alert.alert(
      'Delete all data',
      'This will remove all step history and reset settings. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            resetAllData();
            Alert.alert('Done', 'All data has been deleted.');
          },
        },
      ]
    );
  };

  const weightLbs = (weight * 2.20462).toFixed(1);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>More</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* ── Group 1: Backup & Core Settings ─────────────────────────────── */}
        <View style={styles.group}>
          <SettingRow
            icon={
              <View style={styles.googleIcon}>
                <Text style={{ fontSize: 16, fontWeight: '900' }}>
                  <Text style={{ color: '#4285F4' }}>G</Text>
                  <Text style={{ color: '#EA4335' }}>o</Text>
                  <Text style={{ color: '#FBBC05' }}>o</Text>
                  <Text style={{ color: '#4285F4' }}>g</Text>
                  <Text style={{ color: '#34A853' }}>l</Text>
                  <Text style={{ color: '#EA4335' }}>e</Text>
                </Text>
              </View>
            }
            label="Backup & Restore"
            rightContent={
              <MaterialCommunityIcons name="sync" size={20} color={COLORS.textSecondary} />
            }
            onPress={() => Alert.alert('Backup', 'Backup & Restore via Google Account')}
          />

          <Divider />

          <SettingRow
            icon={<MaterialCommunityIcons name="target" size={20} color={COLORS.textSecondary} />}
            label="Step Goal"
            rightContent={
              <View style={styles.valueRow}>
                <Text style={styles.valueText}>{dailyGoal.toLocaleString()}</Text>
                <MaterialCommunityIcons name="menu-down" size={20} color={COLORS.greenAccent} />
              </View>
            }
            onPress={handleStepGoal}
          />

          <Divider />

          <SettingRow
            icon={
              <MaterialCommunityIcons
                name="tune-variant"
                size={20}
                color={COLORS.textSecondary}
              />
            }
            label="Sensitivity"
            sublabel="High sensitivity means small movements will be counted as steps"
            rightContent={
              <View style={styles.valueRow}>
                <Text style={styles.valueText}>Medium</Text>
                <MaterialCommunityIcons name="menu-down" size={20} color={COLORS.greenAccent} />
              </View>
            }
            onPress={() => Alert.alert('Sensitivity', 'Adjust pedometer sensitivity')}
          />

          <Divider />

          <SettingRow
            icon={<MaterialCommunityIcons name="scale" size={20} color={COLORS.textSecondary} />}
            label="Weight"
            sublabel="Calories calculation needs it"
            rightContent={
              <View style={styles.valueRow}>
                <Text style={styles.valueText}>{weightLbs} lbs</Text>
                <MaterialCommunityIcons name="menu-down" size={20} color={COLORS.greenAccent} />
              </View>
            }
            onPress={handleWeight}
          />

          <Divider />

          <SettingRow
            icon={
              <MaterialCommunityIcons name="cog-outline" size={20} color={COLORS.textSecondary} />
            }
            label="More Settings"
            sublabel="Gender, Step length, Metric & Imperial Unit"
            onPress={() =>
              Alert.alert(
                'More Settings',
                'Configure gender, step length and measurement units'
              )
            }
          />
        </View>

        {/* ── Group 2: How-to & Customization ──────────────────────────────── */}
        <View style={styles.group}>
          <SettingRow
            icon={
              <MaterialCommunityIcons name="wrench-outline" size={20} color={COLORS.textSecondary} />
            }
            label='How to fix the "Stop Counting Steps" issue?'
            rightContent={null}
            onPress={() =>
              Alert.alert('Help', 'Visit our support page for troubleshooting tips.')
            }
          />

          <Divider />

          <SettingRow
            icon={
              <MaterialCommunityIcons
                name="image-multiple-outline"
                size={20}
                color={COLORS.textSecondary}
              />
            }
            label="Varied Splash Screen"
            sublabel="Display different splash screens"
            rightContent={
              <Switch
                value={splashEnabled}
                onValueChange={setSplashEnabled}
                trackColor={{ false: COLORS.progressTrack, true: COLORS.greenAccent }}
                thumbColor="#fff"
              />
            }
          />

          <Divider />

          <SettingRow
            icon={
              <MaterialCommunityIcons
                name="bell-outline"
                size={20}
                color={COLORS.textSecondary}
              />
            }
            label="Reminder"
            sublabel="Every day"
            rightContent={
              <View style={styles.valueRow}>
                <Text style={[styles.valueText, !reminderOn && { color: COLORS.textSecondary }]}>
                  {reminderOn ? 'On' : 'Off'}
                </Text>
                <MaterialCommunityIcons name="menu-down" size={20} color={COLORS.greenAccent} />
              </View>
            }
            onPress={() => setReminderOn((v) => !v)}
          />

          <Divider />

          <SettingRow
            icon={<MaterialCommunityIcons name="web" size={20} color={COLORS.textSecondary} />}
            label="Language options"
            rightContent={
              <View style={styles.valueRow}>
                <Text style={styles.valueText}>English</Text>
                <MaterialCommunityIcons name="menu-down" size={20} color={COLORS.greenAccent} />
              </View>
            }
            onPress={() => Alert.alert('Language', 'Select your preferred language')}
          />
        </View>

        {/* ── Group 3: Help & Social ─────────────────────────────────────── */}
        <View style={styles.group}>
          <SettingRow
            icon={
              <MaterialCommunityIcons
                name="help-circle-outline"
                size={20}
                color={COLORS.textSecondary}
              />
            }
            label="Instructions"
            rightContent={
              <View style={styles.redDot} />
            }
            onPress={() => Alert.alert('Instructions', 'View app usage guide')}
          />

          <Divider />

          <SettingRow
            icon={
              <MaterialCommunityIcons
                name="message-text-outline"
                size={20}
                color={COLORS.textSecondary}
              />
            }
            label="Feedback"
            onPress={() => Alert.alert('Feedback', 'Send us your feedback!')}
          />

          <Divider />

          <SettingRow
            icon={
              <MaterialCommunityIcons
                name="share-variant-outline"
                size={20}
                color={COLORS.textSecondary}
              />
            }
            label="Share with friends"
            onPress={() => Alert.alert('Share', 'Share this app with friends!')}
          />

          <Divider />

          <SettingRow
            icon={
              <MaterialCommunityIcons
                name="send-outline"
                size={20}
                color={COLORS.textSecondary}
              />
            }
            label="Request a new feature"
            onPress={() => Alert.alert('Feature Request', 'Send us your feature ideas!')}
          />

          <Divider />

          <SettingRow
            icon={
              <MaterialCommunityIcons
                name="block-helper"
                size={20}
                color={COLORS.textSecondary}
              />
            }
            label="Remove ads"
            onPress={() => Alert.alert('Remove Ads', 'Upgrade to premium to remove ads')}
          />

          <Divider />

          <SettingRow
            icon={
              <MaterialCommunityIcons
                name="eye-outline"
                size={20}
                color={COLORS.textSecondary}
              />
            }
            label="Privacy policy"
            onPress={() => Alert.alert('Privacy Policy', 'View our privacy policy')}
          />

          <Divider />

          <SettingRow
            icon={
              <MaterialCommunityIcons
                name="folder-remove-outline"
                size={20}
                color={COLORS.textSecondary}
              />
            }
            label="Delete all data"
            onPress={handleReset}
          />
        </View>

        {/* Version */}
        <Text style={styles.version}>Version 1.6.6157A</Text>

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

  // Groups
  group: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
    overflow: 'hidden',
  },

  // Row
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    minHeight: 52,
  },
  rowIcon: {
    width: 28,
    alignItems: 'center',
    marginRight: 12,
  },
  rowBody: {
    flex: 1,
    gap: 2,
  },
  rowLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  rowSub: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '500',
    lineHeight: 16,
  },
  rowRight: {
    marginLeft: 8,
  },

  // Right value
  valueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  valueText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.greenAccent,
  },

  // Divider
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginLeft: 56,
  },

  // Google icon placeholder
  googleIcon: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Red dot (notification)
  redDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF5350',
  },

  // Version
  version: {
    textAlign: 'center',
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
  },
});
