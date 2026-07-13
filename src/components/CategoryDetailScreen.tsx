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
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING } from '../constants/theme';

// ─── Data types ──────────────────────────────────────────────────────────────
export interface WorkoutItem {
  id: string;
  name: string;
  desc: string;
  icon: string;
  iconColor: string;
  bg: string;
}

export interface WorkoutSection {
  sectionTitle: string;
  items: WorkoutItem[];
}

export interface CategoryDetail {
  id: string;
  title: string;
  subtitle: string;
  accentColor: string;
  sections: WorkoutSection[];
}

// ─── Category data ────────────────────────────────────────────────────────────
export const CATEGORY_DETAILS: CategoryDetail[] = [
  {
    id: 'cat-1',
    title: 'Fast workout',
    subtitle: 'Not enough time? ⏱\n2-7 min workout. Do it anytime, anywhere.',
    accentColor: '#F6C444',
    sections: [
      {
        sectionTitle: '2 min',
        items: [
          { id: 'fw-1', name: 'Fat burning HIIT',       desc: 'Burn fat more effectively',                  icon: 'fire',         iconColor: '#FF764B', bg: '#2A1A14' },
          { id: 'fw-2', name: '2 min chest workout',    desc: 'Quick bigger chest building',                icon: 'dumbbell',     iconColor: '#29B6F6', bg: '#1A2635' },
          { id: 'fw-3', name: '2 min flat belly',       desc: 'Strengthen abs and improve endurance',       icon: 'human',        iconColor: '#26C36A', bg: '#142614' },
          { id: 'fw-4', name: '2 min arm workout',      desc: 'Get stronger arms and wider shoulders',      icon: 'arm-flex',     iconColor: '#F6C444', bg: '#2A2510' },
          { id: 'fw-5', name: '2 min leg workout',      desc: 'Awaken and strengthen your leg muscles quickly!', icon: 'run',   iconColor: '#EF5350', bg: '#2A1414' },
        ],
      },
      {
        sectionTitle: '7 min',
        items: [
          { id: 'fw-6', name: '7 min abs workout',      desc: 'Just 7 min a day for visible abs!',          icon: 'arm-flex-outline', iconColor: '#F6C444', bg: '#2A2510' },
          { id: 'fw-7', name: '7 min classic',          desc: 'Enhance your overall body',                  icon: 'weight-lifter', iconColor: '#29B6F6', bg: '#1A2635' },
          { id: 'fw-8', name: '7 min leg workout',      desc: 'Burn thigh fat in 7 min.',                   icon: 'run-fast',     iconColor: '#EF5350', bg: '#2A1414' },
        ],
      },
    ],
  },
  {
    id: 'cat-2',
    title: 'Stretch',
    subtitle: 'Various stretching courses designed by experts meet all your individual needs! 😊',
    accentColor: '#9C7EF0',
    sections: [
      {
        sectionTitle: 'Routine',
        items: [
          { id: 'st-1', name: 'Morning warm up',          desc: 'Wake up your body, prepare for the day',   icon: 'weather-sunny',  iconColor: '#F6C444', bg: '#2A2510' },
          { id: 'st-2', name: 'Sleepy time stretching',   desc: 'Get a high-quality sleep',                 icon: 'sleep',          iconColor: '#9C7EF0', bg: '#1E1A35' },
        ],
      },
      {
        sectionTitle: 'Full body',
        items: [
          { id: 'st-3', name: 'Full body stretching',     desc: 'Relax your body and improve range of motion.', icon: 'yoga',       iconColor: '#26C36A', bg: '#142614' },
        ],
      },
      {
        sectionTitle: 'Upper body',
        items: [
          { id: 'st-4', name: 'Shoulder tension relief',  desc: 'Relieve shoulder tension and ease shoulder pain.', icon: 'human-handsup', iconColor: '#29B6F6', bg: '#1A2635' },
          { id: 'st-5', name: 'Upper body stretching',    desc: 'Stretch your arm, shoulder, chest and back.', icon: 'arm-flex',   iconColor: '#9C7EF0', bg: '#1E1A35' },
        ],
      },
      {
        sectionTitle: 'Lower body',
        items: [
          { id: 'st-6', name: 'Lower body stretching 7 min',  desc: 'Help you relax and build flexibility.',  icon: 'run',         iconColor: '#F6C444', bg: '#2A2510' },
          { id: 'st-7', name: 'Lower body stretching 15 min', desc: 'Help you relax and build flexibility.',  icon: 'run-fast',    iconColor: '#FF764B', bg: '#2A1A14' },
        ],
      },
      {
        sectionTitle: 'Back',
        items: [
          { id: 'st-8', name: 'Back stretching 12 min',   desc: 'Relax back muscles and prevent back injuries', icon: 'human-male', iconColor: '#29B6F6', bg: '#1A2635' },
          { id: 'st-9', name: 'Back stretching 7 min',    desc: 'Relax back muscles and prevent back injuries', icon: 'human',      iconColor: '#26C36A', bg: '#142614' },
        ],
      },
    ],
  },
  {
    id: 'cat-3',
    title: 'Pain relief',
    subtitle: 'Simple stretching exercises reduce muscle stiffness and relieve pain in seconds!',
    accentColor: '#EF5350',
    sections: [
      {
        sectionTitle: '',
        items: [
          { id: 'pr-1', name: 'Neck & shoulder tension relief', desc: 'Loosen muscles and reduce pains',                      icon: 'human-handsup', iconColor: '#29B6F6', bg: '#1A2635' },
          { id: 'pr-2', name: 'Lower back pain relief',         desc: 'Simple stretches for immediate back pain relief.',     icon: 'human-male',    iconColor: '#EF5350', bg: '#2A1414' },
          { id: 'pr-3', name: 'Knee pain relief',               desc: 'Relieve pain and strengthen weak knees',               icon: 'run',           iconColor: '#26C36A', bg: '#142614' },
          { id: 'pr-4', name: 'Foam roller knee pain relief',   desc: 'Relieve pain and strengthen weak knees',               icon: 'dumbbell',      iconColor: '#F6C444', bg: '#2A2510' },
        ],
      },
    ],
  },
  {
    id: 'cat-4',
    title: 'Body focus',
    subtitle: 'Target specific muscle groups and sculpt your ideal physique! 💪',
    accentColor: '#F6C444',
    sections: [
      {
        sectionTitle: 'Abs',
        items: [
          { id: 'bf-1', name: 'ONLY 4 moves for abs',    desc: 'Quick and effective core training',          icon: 'arm-flex',     iconColor: '#F6C444', bg: '#2A2510' },
          { id: 'bf-2', name: '6 pack abs workout',      desc: 'Build visible and strong abs',               icon: 'arm-flex-outline', iconColor: '#FF764B', bg: '#2A1A14' },
        ],
      },
      {
        sectionTitle: 'Chest',
        items: [
          { id: 'bf-3', name: '2 min chest workout',     desc: 'Quick bigger chest building',                icon: 'dumbbell',     iconColor: '#29B6F6', bg: '#1A2635' },
          { id: 'bf-4', name: 'Chest & arm workout',     desc: 'Build an impressive upper body',             icon: 'weight-lifter', iconColor: '#9C7EF0', bg: '#1E1A35' },
        ],
      },
      {
        sectionTitle: 'Legs',
        items: [
          { id: 'bf-5', name: '2 min leg workout',       desc: 'Awaken and strengthen your leg muscles quickly!', icon: 'run',    iconColor: '#EF5350', bg: '#2A1414' },
          { id: 'bf-6', name: 'Leg & glute workout',     desc: 'Tone and strengthen your lower body',        icon: 'run-fast',     iconColor: '#26C36A', bg: '#142614' },
        ],
      },
    ],
  },
  {
    id: 'cat-5',
    title: 'Warm up',
    subtitle: 'Prepare your body before exercise and reduce injury risk! 🏃',
    accentColor: '#29B6F6',
    sections: [
      {
        sectionTitle: 'Before workout',
        items: [
          { id: 'wu-1', name: 'Pre-run warm up',          desc: 'Prepare your joints for running',           icon: 'run',          iconColor: '#FF764B', bg: '#2A1A14' },
          { id: 'wu-2', name: 'Morning warm up',          desc: 'Wake up your body, prepare for the day',    icon: 'weather-sunny', iconColor: '#F6C444', bg: '#2A2510' },
          { id: 'wu-3', name: 'Full body warm up',        desc: 'Activate every muscle group safely',        icon: 'human',        iconColor: '#29B6F6', bg: '#1A2635' },
        ],
      },
      {
        sectionTitle: 'After workout',
        items: [
          { id: 'wu-4', name: 'Cool down stretching',     desc: 'Ease soreness and improve recovery',        icon: 'yoga',         iconColor: '#26C36A', bg: '#142614' },
          { id: 'wu-5', name: 'Breathing & relaxation',   desc: 'Calm your heart rate and relax muscles',    icon: 'sleep',        iconColor: '#9C7EF0', bg: '#1E1A35' },
        ],
      },
    ],
  },
];

// ─── Props ────────────────────────────────────────────────────────────────────
interface Props {
  visible: boolean;
  categoryId: string | null;
  onClose: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function CategoryDetailScreen({ visible, categoryId, onClose }: Props) {
  const detail = CATEGORY_DETAILS.find((c) => c.id === categoryId);

  if (!detail) return null;

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
          <TouchableOpacity style={styles.navBtn} activeOpacity={0.7}>
            <MaterialCommunityIcons name="format-list-bulleted" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* ── Page header ── */}
        <View style={styles.pageHeader}>
          <Text style={styles.pageTitle}>{detail.title}</Text>
          <Text style={styles.pageSubtitle}>{detail.subtitle}</Text>
        </View>

        {/* ── Workout sections ── */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {detail.sections.map((section, sIdx) => (
            <View key={sIdx} style={styles.sectionBlock}>
              {/* Section label (e.g. "2 min", "Routine") */}
              {!!section.sectionTitle && (
                <Text style={styles.sectionLabel}>{section.sectionTitle}</Text>
              )}

              {/* Items card */}
              <View style={styles.itemsCard}>
                {section.items.map((item, iIdx) => (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.itemRow,
                      iIdx < section.items.length - 1 && styles.itemRowBorder,
                    ]}
                    activeOpacity={0.75}
                  >
                    {/* Thumbnail */}
                    <View style={[styles.thumb, { backgroundColor: item.bg }]}>
                      <MaterialCommunityIcons
                        name={item.icon as any}
                        size={30}
                        color={item.iconColor}
                      />
                    </View>

                    {/* Text */}
                    <View style={styles.itemText}>
                      <Text style={styles.itemName}>{item.name}</Text>
                      <Text style={styles.itemDesc} numberOfLines={2}>{item.desc}</Text>
                    </View>

                    {/* Arrow */}
                    <View style={styles.arrowCircle}>
                      <MaterialCommunityIcons name="arrow-right" size={18} color="#FFFFFF" />
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))}

          {/* ── Adjust the order ── */}
          <TouchableOpacity style={styles.adjustBtn} activeOpacity={0.8}>
            <MaterialCommunityIcons name="format-list-bulleted" size={18} color={COLORS.textSecondary} />
            <Text style={styles.adjustBtnText}>Adjust the order</Text>
          </TouchableOpacity>

          <View style={{ height: 32 }} />
        </ScrollView>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.four,
    paddingVertical: 12,
  },
  navBtn: {
    padding: 4,
  },

  // page header
  pageHeader: {
    paddingHorizontal: SPACING.four,
    paddingBottom: 20,
  },
  pageTitle: {
    fontSize: 30,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.2,
    marginBottom: 6,
  },
  pageSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '500',
    lineHeight: 20,
  },

  // scroll
  scrollContent: {
    paddingHorizontal: SPACING.four,
    paddingTop: 4,
  },

  // section
  sectionBlock: {
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 12,
  },

  // card containing items
  itemsCard: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },

  // single item row
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 14,
  },
  itemRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },

  // thumbnail
  thumb: {
    width: 64,
    height: 64,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },

  // text block
  itemText: {
    flex: 1,
    gap: 4,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    lineHeight: 21,
  },
  itemDesc: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500',
    lineHeight: 17,
  },

  // arrow circle button
  arrowCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },

  // adjust order
  adjustBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 30,
    paddingVertical: 14,
    marginTop: 8,
    backgroundColor: COLORS.cardBackground,
  },
  adjustBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
});
