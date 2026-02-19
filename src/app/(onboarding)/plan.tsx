/**
 * app/onboarding/plan.tsx  — Screen 12: Your Personalized Plan
 *
 * The closing argument. Uses every answer they gave to show a plan
 * that feels like it was hand-crafted for them specifically.
 *
 * Reads from onboardingStore:
 *   - age
 *   - focusStealer    (screen 3)
 *   - focusWindow     (screen 4)
 *   - protectTime     (screen 5)
 *   - dailyPhoneHours (screen 6)
 *
 * Sections (all stagger in):
 *   1. "We built this for you" headline using their actual answers
 *   2. Your Focus Profile — personalised stats card
 *   3. Your Session Schedule — computed block + break timing
 *   4. What you'll reclaim — years/days/hours saved projection
 *   5. Your 30-day trajectory — animated progress preview
 *   6. CTA → paywall
 *
 * NAVIGATION → /onboarding/paywall
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Animated, Dimensions, StatusBar, Easing, ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  useFonts, Nunito_800ExtraBold, Nunito_700Bold, Nunito_400Regular,
} from '@expo-google-fonts/nunito';
import { COLORS, FONTS } from '../../theme';
import { OnboardingProgress } from '../../components/OnboardingProgress';
import { useOnboardingStore } from '../../store/onboardingStore';

const { width: SW } = Dimensions.get('window');
const PAD = 28;

// ─────────────────────────────────────────────────────────────────────────────
// PLAN COMPUTATION
// Derives everything from their 4 answers
// ─────────────────────────────────────────────────────────────────────────────

interface PersonalisedPlan {
  // Session schedule
  blockMins:        number;   // focus block length
  breakMins:        number;   // break length (always 2)
  checkpointEvery:  number;   // minutes between checkpoints
  sessionsPerDay:   number;   // recommended sessions

  // Reclaim projection
  reclaimHoursDay:  number;
  reclaimDaysYear:  number;
  reclaimYearsLife: number;

  // Personalised copy
  greetingLine:     string;
  windowLabel:      string;
  stealerLabel:     string;
  goalLabel:        string;
  profileTags:      string[];

  // 30-day milestones
  milestones:       { day: number; label: string; icon: string }[];
}

function focusWindowToMins(window: string | null): number {
  if (!window) return 25;
  if (window.includes('Under 10')) return 15;
  if (window.includes('10 – 20')) return 20;
  if (window.includes('20 – 45')) return 30;
  if (window.includes('45 – 90')) return 45;
  return 25; // "it depends"
}

function buildPlan(
  age:             number,
  focusStealer:    string | null,
  focusWindow:     string | null,
  protectTime:     string | null,
  dailyPhoneHours: number,
): PersonalisedPlan {
  const blockMins       = focusWindowToMins(focusWindow);
  const breakMins       = 2;
  const checkpointEvery = Math.max(Math.floor(blockMins / 2), 10);
  const sessionsPerDay  = dailyPhoneHours >= 6 ? 4 : dailyPhoneHours >= 3 ? 3 : 2;

  // How much phone time Ember will reclaim (assume 40% reduction from structured sessions)
  const reclaimHoursDay  = Math.round(dailyPhoneHours * 0.40 * 10) / 10;
  const reclaimDaysYear  = Math.round(reclaimHoursDay * 365 / 24 * 10) / 10;
  const yearsLeft        = Math.max(80 - age, 0);
  const reclaimYearsLife = Math.round(reclaimHoursDay * 365 * yearsLeft / 8760 * 10) / 10;

  // Personalised copy
  const stealerMap: Record<string, string> = {
    'Social media':       'social media',
    'Messages & apps':    'messaging apps',
    'My own thoughts':    'mental wandering',
    'Notifications':      'notification spirals',
    'Video & streaming':  'video rabbit holes',
    'Browsing & news':    'browsing loops',
  };
  const goalMap: Record<string, string> = {
    'Deep work':         'deep work',
    'Studying':          'studying',
    'Creative projects': 'creative work',
    'Health & fitness':  'health habits',
    'Family & presence': 'presence with family',
    'Peace of mind':     'mental clarity',
  };
  const windowMap: Record<string, string> = {
    'Under 10 minutes': 'a 15-minute starter block',
    '10 – 20 minutes':  'a 20-minute focus block',
    '20 – 45 minutes':  'a 30-minute focus block',
    '45 – 90 minutes':  'a 45-minute deep work block',
    'It depends':       'a flexible 25-minute block',
  };

  const stealerLabel = stealerMap[focusStealer ?? ''] ?? 'distraction';
  const goalLabel    = goalMap[protectTime ?? '']     ?? 'your goals';
  const windowLabel  = windowMap[focusWindow ?? '']  ?? 'a 25-minute focus block';

  const greetingLine = `Based on your ${focusWindow?.includes('Under') ? 'shorter' : focusWindow?.includes('45') ? 'strong' : 'growing'} focus window, your weakness for ${stealerLabel}, and your goal of protecting time for ${goalLabel} — here's your plan.`;

  const profileTags = [
    focusWindow?.includes('Under 10') ? '🌱 Focus beginner' :
    focusWindow?.includes('45')       ? '⚡ Strong focuser' : '📈 Building focus',
    dailyPhoneHours >= 6 ? '🔴 High phone use' :
    dailyPhoneHours >= 3 ? '🟡 Moderate use'   : '🟢 Light use',
    age < 25 ? '🚀 Early builder' : age < 40 ? '💼 Peak performer' : '🧠 Deep thinker',
  ];

  const milestones = [
    { day: 1,  icon: '🌱', label: 'First focus session completed' },
    { day: 3,  icon: '🔥', label: '3-day streak — habit forming' },
    { day: 7,  icon: '⚡', label: `${blockMins}min blocks feeling natural` },
    { day: 14, icon: '💪', label: 'Noticeable focus improvement' },
    { day: 21, icon: '🧠', label: 'Deep work mode unlocked' },
    { day: 30, icon: '🏆', label: `${Math.round(reclaimHoursDay * 30)}h reclaimed from phone` },
  ];

  return {
    blockMins, breakMins, checkpointEvery, sessionsPerDay,
    reclaimHoursDay, reclaimDaysYear, reclaimYearsLife,
    greetingLine, windowLabel, stealerLabel, goalLabel,
    profileTags, milestones,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// ANIMATED NUMBER — counts up from 0
// ─────────────────────────────────────────────────────────────────────────────
function CountUp({
  target, duration = 800, suffix = '', decimals = 0, color,
}: {
  target: number; duration?: number; suffix?: string;
  decimals?: number; color?: string;
}) {
  const val = useRef(new Animated.Value(0)).current;
  const [display, setDisplay] = useState('0');

  useEffect(() => {
    val.addListener(({ value }) => {
      setDisplay(value.toFixed(decimals));
    });
    Animated.timing(val, {
      toValue: target, duration,
      easing: Easing.out(Easing.quad),
      useNativeDriver: false,
    }).start();
    return () => val.removeAllListeners();
  }, [target]);

  return (
    <Text style={{ color: color ?? COLORS.amber, fontFamily: FONTS.black }}>
      {display}{suffix}
    </Text>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SESSION SCHEDULE VISUALISER
// Shows the block → checkpoint → break rhythm
// ─────────────────────────────────────────────────────────────────────────────
function ScheduleVis({ plan, visible }: { plan: PersonalisedPlan; visible: boolean }) {
  const fillA = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) return;
    Animated.timing(fillA, {
      toValue: 1, duration: 900,
      easing: Easing.out(Easing.quad),
      useNativeDriver: false,
    }).start();
  }, [visible]);

  const totalMins  = plan.blockMins + plan.breakMins;
  const blockPct   = plan.blockMins / totalMins;
  const cpPct      = plan.checkpointEvery / plan.blockMins;

  return (
    <View style={sv.wrap}>
      {/* Timeline bar */}
      <View style={sv.timelineOuter}>
        {/* Focus block fill */}
        <Animated.View style={[sv.focusFill, {
          width: fillA.interpolate({
            inputRange:  [0, 1],
            outputRange: ['0%', `${blockPct * 100}%`],
          }),
        }]}>
          <LinearGradient
            colors={['#FF9030', '#FF6010']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>

        {/* Break fill */}
        <Animated.View style={[sv.breakFill, {
          width: fillA.interpolate({
            inputRange:  [0, 0.8, 1],
            outputRange: ['0%', '0%', `${(1 - blockPct) * 100}%`],
          }),
          left: `${blockPct * 100}%` as any,
        }]}>
          <LinearGradient
            colors={['#55DDAA', '#44BB88']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>

        {/* Checkpoint marker */}
        <Animated.View style={[sv.cpMarker, {
          left: `${cpPct * blockPct * 100}%` as any,
          opacity: fillA.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 0, 1] }),
        }]} />
      </View>

      {/* Labels */}
      <View style={sv.labelsRow}>
        <View style={sv.labelItem}>
          <View style={[sv.labelDot, { backgroundColor: COLORS.orange }]} />
          <Text style={sv.labelTxt}>Focus {plan.blockMins}m</Text>
        </View>
        <View style={sv.labelItem}>
          <View style={[sv.labelDot, { backgroundColor: COLORS.amber }]} />
          <Text style={sv.labelTxt}>Checkpoint ~{plan.checkpointEvery}m</Text>
        </View>
        <View style={sv.labelItem}>
          <View style={[sv.labelDot, { backgroundColor: '#55DDAA' }]} />
          <Text style={sv.labelTxt}>Reset {plan.breakMins}m</Text>
        </View>
      </View>

      {/* Daily rhythm */}
      <View style={sv.rhythmRow}>
        <Text style={sv.rhythmLabel}>Your day ({plan.sessionsPerDay} sessions):</Text>
        <View style={sv.rhythmBlocks}>
          {Array.from({ length: plan.sessionsPerDay }).map((_, i) => (
            <View key={i} style={sv.rhythmBlock}>
              <LinearGradient
                colors={['rgba(255,144,48,0.70)', 'rgba(255,94,14,0.50)']}
                style={StyleSheet.absoluteFill}
              />
              <Text style={sv.rhythmBlockTxt}>{plan.blockMins}m</Text>
              {i < plan.sessionsPerDay - 1 && (
                <View style={sv.rhythmBreak}>
                  <Text style={sv.rhythmBreakTxt}>2m</Text>
                </View>
              )}
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

const sv = StyleSheet.create({
  wrap: { gap: 14 },
  timelineOuter: {
    height: 20, borderRadius: 10, overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.06)',
    flexDirection: 'row', position: 'relative',
  },
  focusFill:  { position: 'absolute', left: 0, top: 0, bottom: 0, minWidth: 4 },
  breakFill:  { position: 'absolute', top: 0, bottom: 0, minWidth: 4 },
  cpMarker: {
    position: 'absolute', top: 0, bottom: 0, width: 2,
    backgroundColor: 'rgba(255,220,100,0.80)',
  },
  labelsRow:  { flexDirection: 'row', gap: 14, flexWrap: 'wrap' },
  labelItem:  { flexDirection: 'row', alignItems: 'center', gap: 5 },
  labelDot:   { width: 8, height: 8, borderRadius: 4 },
  labelTxt:   { fontFamily: FONTS.regular, fontSize: 11, color: 'rgba(255,244,230,0.50)' },

  rhythmLabel: { fontFamily: FONTS.bold, fontSize: 12, color: 'rgba(255,244,230,0.40)', marginBottom: 4 },
  rhythmRow:   { gap: 6 },
  rhythmBlocks:{ flexDirection: 'row', alignItems: 'center', gap: 0, flexWrap: 'wrap' },
  rhythmBlock: {
    height: 30, minWidth: 36, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
    marginRight: 2,
    paddingHorizontal: 6,
  },
  rhythmBlockTxt: { fontFamily: FONTS.bold, fontSize: 10, color: '#1A0602', zIndex: 1 },
  rhythmBreak:    {
    position: 'absolute', right: -14,
    width: 12, height: 12, borderRadius: 6,
    backgroundColor: '#55DDAA', alignItems: 'center', justifyContent: 'center',
  },
  rhythmBreakTxt: { fontFamily: FONTS.bold, fontSize: 6, color: '#0A2218' },
});

// ─────────────────────────────────────────────────────────────────────────────
// 30-DAY TRAJECTORY
// ─────────────────────────────────────────────────────────────────────────────
function TrajectoryChart({ milestones, visible }: {
  milestones: PersonalisedPlan['milestones'];
  visible: boolean;
}) {
  const lineA = useRef(new Animated.Value(0)).current;
  const dotAnims = useRef(milestones.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    if (!visible) return;
    Animated.timing(lineA, {
      toValue: 1, duration: 1200,
      easing: Easing.out(Easing.quad),
      useNativeDriver: false,
    }).start();
    milestones.forEach((_, i) => {
      Animated.sequence([
        Animated.delay(i * 180 + 300),
        Animated.spring(dotAnims[i], { toValue: 1, tension: 80, friction: 6, useNativeDriver: true }),
      ]).start();
    });
  }, [visible]);

  const CHART_W = SW - PAD * 2 - 48; // inside card padding
  const CHART_H = 60;

  return (
    <View style={tj.wrap}>
      {/* Curved line background */}
      <View style={[tj.lineTrack, { width: CHART_W, height: CHART_H }]}>
        <Animated.View style={[
          tj.lineFill,
          { width: lineA.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) },
        ]}>
          <LinearGradient
            colors={['#FF9030', COLORS.amber, '#55DDAA']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      </View>

      {/* Milestone dots + labels */}
      <View style={tj.milestonesRow}>
        {milestones.map((m, i) => {
          const isLast = i === milestones.length - 1;
          return (
            <Animated.View
              key={i}
              style={[tj.milestone, { opacity: dotAnims[i], transform: [{ scale: dotAnims[i] }] }]}
            >
              <View style={[tj.dot, isLast && tj.dotLast]}>
                <Text style={tj.dotIcon}>{m.icon}</Text>
              </View>
              <Text style={[tj.dayLabel, isLast && tj.dayLabelLast]}>Day {m.day}</Text>
              <Text style={[tj.milestoneLabel, isLast && tj.milestoneLabelLast]} numberOfLines={2}>
                {m.label}
              </Text>
            </Animated.View>
          );
        })}
      </View>
    </View>
  );
}

const tj = StyleSheet.create({
  wrap: { gap: 12 },
  lineTrack: {
    overflow: 'hidden', borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.06)',
    height: 6,
  },
  lineFill: { height: '100%', borderRadius: 3, overflow: 'hidden', minWidth: 4 },

  milestonesRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  milestone: { alignItems: 'center', flex: 1, gap: 4 },
  dot: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  dotLast: {
    backgroundColor: 'rgba(255,144,48,0.20)',
    borderColor: 'rgba(255,144,48,0.50)',
  },
  dotIcon:  { fontSize: 14 },
  dayLabel: { fontFamily: FONTS.bold, fontSize: 9, color: 'rgba(255,244,230,0.35)' },
  dayLabelLast: { color: COLORS.amber },
  milestoneLabel: {
    fontFamily: FONTS.regular, fontSize: 8,
    color: 'rgba(255,244,230,0.30)',
    textAlign: 'center', lineHeight: 12,
  },
  milestoneLabelLast: { color: 'rgba(255,200,80,0.65)', fontFamily: FONTS.bold },
});

// ─────────────────────────────────────────────────────────────────────────────
// MAIN SCREEN
// ─────────────────────────────────────────────────────────────────────────────
export default function PlanScreen() {
  const insets = useSafeAreaInsets();
  const [fontsLoaded] = useFonts({
    Nunito_800ExtraBold, Nunito_700Bold, Nunito_400Regular,
  });

  // Pull answers from store
  const age             = useOnboardingStore(s => (s as any).age             as number) ?? 25;
  const focusStealer    = useOnboardingStore(s => (s as any).focusStealer    as string | null);
  const focusWindow     = useOnboardingStore(s => (s as any).focusWindow     as string | null);
  const protectTime     = useOnboardingStore(s => (s as any).protectTime     as string | null);
  const dailyPhoneHours = useOnboardingStore(s => (s as any).dailyPhoneHours as number) ?? 4;

  const plan = buildPlan(age, focusStealer, focusWindow, protectTime, dailyPhoneHours);

  // ── Sections reveal ────────────────────────────────────────────────────────
  const [showProfile,  setShowProfile]  = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);
  const [showReclaim,  setShowReclaim]  = useState(false);
  const [showTraj,     setShowTraj]     = useState(false);
  const [showCTA,      setShowCTA]      = useState(false);

  // Anims
  const headerA   = useRef(new Animated.Value(0)).current;
  const headerY   = useRef(new Animated.Value(20)).current;
  const typingA   = useRef(new Animated.Value(0)).current; // greeting "types in"
  const profileA  = useRef(new Animated.Value(0)).current;
  const profileY  = useRef(new Animated.Value(18)).current;
  const scheduleA = useRef(new Animated.Value(0)).current;
  const scheduleY = useRef(new Animated.Value(18)).current;
  const reclaimA  = useRef(new Animated.Value(0)).current;
  const reclaimY  = useRef(new Animated.Value(18)).current;
  const trajA     = useRef(new Animated.Value(0)).current;
  const ctaA      = useRef(new Animated.Value(0)).current;
  const ctaY      = useRef(new Animated.Value(14)).current;

  // "Building your plan…" loading dots
  const [buildingDone, setBuildingDone] = useState(false);
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  const fadeIn = (a: Animated.Value, y: Animated.Value | null, delay: number, cb?: () => void) => {
    const anims: Animated.CompositeAnimation[] = [
      Animated.timing(a, { toValue: 1, duration: 450, easing: Easing.out(Easing.quad), useNativeDriver: true }),
    ];
    if (y) anims.push(
      Animated.timing(y, { toValue: 0, duration: 450, easing: Easing.out(Easing.quad), useNativeDriver: true })
    );
    Animated.sequence([
      Animated.delay(delay),
      Animated.parallel(anims),
    ]).start(cb ? ({ finished }) => { if (finished) cb(); } : undefined);
  };

  useEffect(() => {
    // Loading dots
    const dotLoop = Animated.loop(Animated.stagger(220, [
      Animated.sequence([
        Animated.timing(dot1, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(dot1, { toValue: 0.2, duration: 300, useNativeDriver: true }),
      ]),
      Animated.sequence([
        Animated.timing(dot2, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(dot2, { toValue: 0.2, duration: 300, useNativeDriver: true }),
      ]),
      Animated.sequence([
        Animated.timing(dot3, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(dot3, { toValue: 0.2, duration: 300, useNativeDriver: true }),
      ]),
    ]));
    dotLoop.start();

    // 1. Header + "building" state
    fadeIn(headerA, headerY, 300);

    // 2. "Building complete" → reveal plan
    setTimeout(() => {
      dotLoop.stop();
      setBuildingDone(true);
      fadeIn(typingA, null, 0);
    }, 1800);

    // 3. Profile card
    setTimeout(() => {
      setShowProfile(true);
      fadeIn(profileA, profileY, 0);
    }, 2400);

    // 4. Schedule
    setTimeout(() => {
      setShowSchedule(true);
      fadeIn(scheduleA, scheduleY, 0);
    }, 3100);

    // 5. Reclaim stats
    setTimeout(() => {
      setShowReclaim(true);
      fadeIn(reclaimA, reclaimY, 0);
    }, 3900);

    // 6. Trajectory
    setTimeout(() => {
      setShowTraj(true);
      Animated.timing(trajA, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    }, 4600);

    // 7. CTA
    setTimeout(() => {
      setShowCTA(true);
      fadeIn(ctaA, ctaY, 0);
    }, 5200);
  }, []);

  if (!fontsLoaded) return null;

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <LinearGradient
        colors={['#060302', '#0E0705', '#160A04']}
        start={{ x: 0.4, y: 0 }} end={{ x: 0.6, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      {/* Ambient glow — warm, earned */}
      <View style={styles.ambientGlow} pointerEvents="none" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, {
          paddingTop:    insets.top + 14,
          paddingBottom: insets.bottom + 48,
        }]}
        showsVerticalScrollIndicator={false}
        scrollEnabled={showCTA}
      >
        {/* Top bar */}
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <OnboardingProgress step={12} />
          </View>
          <View style={{ width: 36 }} />
        </View>

        {/* ═══ HEADER ═══ */}
        <Animated.View style={[styles.header, { opacity: headerA, transform: [{ translateY: headerY }] }]}>
          <Text style={styles.eyebrow}>YOUR PERSONALIZED PLAN</Text>

          {!buildingDone ? (
            <View style={styles.buildingRow}>
              <Text style={styles.buildingTxt}>Building your plan</Text>
              <View style={styles.dotsRow}>
                {[dot1, dot2, dot3].map((d, i) => (
                  <Animated.View key={i} style={[styles.loadDot, { opacity: d }]} />
                ))}
              </View>
            </View>
          ) : (
            <Animated.View style={{ opacity: typingA }}>
              <Text style={styles.headline}>
                Your plan is{' '}
                <Text style={styles.headlineAccent}>ready.</Text>
              </Text>
              <Text style={styles.greetingLine}>{plan.greetingLine}</Text>
            </Animated.View>
          )}
        </Animated.View>

        {/* ═══ FOCUS PROFILE ═══ */}
        {showProfile && (
          <Animated.View style={[styles.card, { opacity: profileA, transform: [{ translateY: profileY }] }]}>
            <LinearGradient
              colors={['rgba(255,144,48,0.08)', 'transparent']}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            />
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Your Focus Profile</Text>
              <View style={styles.verifiedBadge}>
                <Text style={styles.verifiedTxt}>✓ Personalised</Text>
              </View>
            </View>

            {/* Profile tags */}
            <View style={styles.tagsRow}>
              {plan.profileTags.map((tag, i) => (
                <View key={i} style={styles.tag}>
                  <Text style={styles.tagTxt}>{tag}</Text>
                </View>
              ))}
            </View>

            {/* Key insight from their answers */}
            <View style={styles.insightRow}>
              <View style={[styles.insightItem, { borderColor: 'rgba(255,144,48,0.25)' }]}>
                <Text style={styles.insightLabel}>Primary focus killer</Text>
                <Text style={styles.insightValue}>{plan.stealerLabel}</Text>
              </View>
              <View style={[styles.insightItem, { borderColor: 'rgba(85,221,170,0.25)' }]}>
                <Text style={styles.insightLabel}>Protecting time for</Text>
                <Text style={styles.insightValue}>{plan.goalLabel}</Text>
              </View>
            </View>

            {/* Personalised session note */}
            <View style={styles.noteWrap}>
              <Text style={styles.noteTxt}>
                💡 We're starting you on{' '}
                <Text style={styles.noteAccent}>{plan.windowLabel}</Text>
                {' '}— matched to your natural rhythm. You can always adjust.
              </Text>
            </View>
          </Animated.View>
        )}

        {/* ═══ SESSION SCHEDULE ═══ */}
        {showSchedule && (
          <Animated.View style={[styles.card, { opacity: scheduleA, transform: [{ translateY: scheduleY }] }]}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Your Session Schedule</Text>
            </View>
            <ScheduleVis plan={plan} visible={showSchedule} />
          </Animated.View>
        )}

        {/* ═══ WHAT YOU'LL RECLAIM ═══ */}
        {showReclaim && (
          <Animated.View style={[styles.card, { opacity: reclaimA, transform: [{ translateY: reclaimY }] }]}>
            <LinearGradient
              colors={['rgba(85,221,170,0.06)', 'transparent']}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            />
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>What You'll Reclaim</Text>
              <Text style={styles.cardSubtitle}>with consistent Ember use</Text>
            </View>

            <View style={styles.reclaimGrid}>
              <View style={styles.reclaimItem}>
                <Text style={styles.reclaimNum}>
                  <CountUp target={plan.reclaimHoursDay} decimals={1} suffix="h" color="#55DDAA" duration={1000} />
                </Text>
                <Text style={styles.reclaimLabel}>back{'\n'}every day</Text>
              </View>
              <View style={styles.reclaimDivider} />
              <View style={styles.reclaimItem}>
                <Text style={styles.reclaimNum}>
                  <CountUp target={plan.reclaimDaysYear} decimals={1} suffix="d" color={COLORS.amber} duration={1100} />
                </Text>
                <Text style={styles.reclaimLabel}>back{'\n'}every year</Text>
              </View>
              <View style={styles.reclaimDivider} />
              <View style={styles.reclaimItem}>
                <Text style={styles.reclaimNum}>
                  <CountUp target={plan.reclaimYearsLife} decimals={1} suffix="y" color={COLORS.orange} duration={1200} />
                </Text>
                <Text style={styles.reclaimLabel}>back{'\n'}in your lifetime</Text>
              </View>
            </View>

            {/* Progress bar showing reclaim vs wasted */}
            <View style={styles.reclaimBarWrap}>
              <View style={styles.reclaimBarTrack}>
                <Animated.View style={[styles.reclaimBarFill, { width: `${Math.min((plan.reclaimHoursDay / dailyPhoneHours) * 100, 100)}%` }]}>
                  <LinearGradient
                    colors={['#55DDAA', '#44BB88']}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                    style={StyleSheet.absoluteFill}
                  />
                </Animated.View>
              </View>
              <Text style={styles.reclaimBarLabel}>
                {Math.round((plan.reclaimHoursDay / dailyPhoneHours) * 100)}% of your phone time converted to real life
              </Text>
            </View>
          </Animated.View>
        )}

        {/* ═══ 30-DAY TRAJECTORY ═══ */}
        {showTraj && (
          <Animated.View style={[styles.card, { opacity: trajA }]}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Your 30-Day Journey</Text>
            </View>
            <TrajectoryChart milestones={plan.milestones} visible={showTraj} />
          </Animated.View>
        )}

        {/* ═══ FINAL PUSH ═══ */}
        {showCTA && (
          <Animated.View style={[styles.finalPush, { opacity: ctaA }]}>
            <LinearGradient
              colors={['rgba(255,144,48,0.12)', 'rgba(255,94,14,0.07)']}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            />
            <Text style={styles.finalIcon}>🔥</Text>
            <Text style={styles.finalHeadline}>
              The only difference between{'\n'}people who focus and people who don't?
            </Text>
            <Text style={styles.finalBody}>
              A system. You now have the science, the plan, and the schedule.{' '}
              <Text style={styles.finalAccent}>
                The only thing left is to start.
              </Text>
            </Text>
          </Animated.View>
        )}

        {/* ═══ CTA ═══ */}
        {showCTA && (
          <Animated.View style={[styles.ctaWrap, { opacity: ctaA, transform: [{ translateY: ctaY }] }]}>
            <TouchableOpacity
              style={styles.ctaBtn}
              onPress={() => router.push('/(onboarding)/commitment')}
              activeOpacity={0.88}
            >
              <LinearGradient
                colors={['#FF9030', '#FF5E0E']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={styles.ctaGrad}
              >
                <Text style={styles.ctaTxt}>Start my plan — free trial</Text>
                <Text style={styles.ctaArrow}>→</Text>
              </LinearGradient>
            </TouchableOpacity>
            <View style={styles.ctaTrustRow}>
              <Text style={styles.ctaTrustItem}>✓ 7 days free</Text>
              <View style={styles.ctaTrustDot} />
              <Text style={styles.ctaTrustItem}>✓ Cancel anytime</Text>
              <View style={styles.ctaTrustDot} />
              <Text style={styles.ctaTrustItem}>✓ No commitment</Text>
            </View>
          </Animated.View>
        )}

      </ScrollView>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root:  { flex: 1, backgroundColor: '#060302' },
  scroll: { flex: 1 },
  content: { paddingHorizontal: PAD, gap: 20 },

  ambientGlow: {
    position: 'absolute',
    top: '20%', left: '-30%', right: '-30%', bottom: '-10%',
    shadowColor:   '#FF7700',
    shadowOffset:  { width: 0, height: 0 },
    shadowOpacity: 0.12,
    shadowRadius:  100,
  },

  topBar: {
    flexDirection: 'row', alignItems: 'center',
    paddingBottom: 16, gap: 12,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center', justifyContent: 'center',
  },
  backArrow: { fontFamily: FONTS.bold, fontSize: 18, color: COLORS.cream, lineHeight: 20 },

  header: { gap: 12 },
  eyebrow: {
    fontFamily: FONTS.bold, fontSize: 11, letterSpacing: 3,
    color: 'rgba(255,150,50,0.55)', textTransform: 'uppercase',
  },

  // Loading state
  buildingRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 },
  buildingTxt: {
    fontFamily: FONTS.black, fontSize: 30,
    color: 'rgba(255,244,230,0.40)', letterSpacing: -0.5,
  },
  dotsRow:  { flexDirection: 'row', gap: 5, alignItems: 'center' },
  loadDot:  { width: 7, height: 7, borderRadius: 3.5, backgroundColor: COLORS.orange },

  // Revealed headline
  headline: {
    fontFamily: FONTS.black, fontSize: 34,
    color: COLORS.cream, letterSpacing: -0.6, lineHeight: 42,
  },
  headlineAccent: { color: COLORS.amber },
  greetingLine: {
    fontFamily: FONTS.regular, fontSize: 14,
    color: 'rgba(255,244,230,0.48)', lineHeight: 22, marginTop: 6,
  },

  // Shared card
  card: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 24, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 20, gap: 16, overflow: 'hidden',
  },
  cardHeader:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardTitle:    { fontFamily: FONTS.black, fontSize: 16, color: COLORS.cream },
  cardSubtitle: { fontFamily: FONTS.regular, fontSize: 11, color: 'rgba(255,244,230,0.35)' },

  verifiedBadge: {
    backgroundColor: 'rgba(85,221,170,0.14)',
    borderRadius: 20, borderWidth: 1, borderColor: 'rgba(85,221,170,0.28)',
    paddingHorizontal: 10, paddingVertical: 4,
  },
  verifiedTxt: { fontFamily: FONTS.bold, fontSize: 10, color: '#55DDAA' },

  // Profile
  tagsRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  tag: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)',
    paddingHorizontal: 12, paddingVertical: 6,
  },
  tagTxt: { fontFamily: FONTS.bold, fontSize: 12, color: 'rgba(255,244,230,0.75)' },

  insightRow: { flexDirection: 'row', gap: 10 },
  insightItem: {
    flex: 1, borderRadius: 14, borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.03)',
    padding: 12, gap: 4,
  },
  insightLabel: { fontFamily: FONTS.regular, fontSize: 10, color: 'rgba(255,244,230,0.35)', textTransform: 'uppercase', letterSpacing: 0.8 },
  insightValue: { fontFamily: FONTS.bold, fontSize: 13, color: COLORS.cream, lineHeight: 18 },

  noteWrap: {
    backgroundColor: 'rgba(255,144,48,0.08)',
    borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: 'rgba(255,144,48,0.18)',
  },
  noteTxt:   { fontFamily: FONTS.regular, fontSize: 13, color: 'rgba(255,244,230,0.60)', lineHeight: 20 },
  noteAccent:{ fontFamily: FONTS.bold, color: COLORS.amber },

  // Reclaim
  reclaimGrid: { flexDirection: 'row', alignItems: 'center' },
  reclaimItem: { flex: 1, alignItems: 'center', gap: 5 },
  reclaimNum:  { fontFamily: FONTS.black, fontSize: 28, letterSpacing: -1 },
  reclaimLabel:{ fontFamily: FONTS.regular, fontSize: 11, color: 'rgba(255,244,230,0.38)', textAlign: 'center', lineHeight: 16 },
  reclaimDivider: { width: 1, height: 50, backgroundColor: 'rgba(255,255,255,0.08)' },
  reclaimBarWrap: { gap: 8 },
  reclaimBarTrack: {
    height: 7, borderRadius: 4, overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.07)',
  },
  reclaimBarFill:  { height: '100%', borderRadius: 4, overflow: 'hidden', minWidth: 4 },
  reclaimBarLabel: { fontFamily: FONTS.regular, fontSize: 11, color: 'rgba(255,244,230,0.38)' },

  // Final push
  finalPush: {
    borderRadius: 24, borderWidth: 1.5,
    borderColor: 'rgba(255,144,48,0.28)',
    padding: 24, gap: 12, overflow: 'hidden',
    alignItems: 'center',
  },
  finalIcon:     { fontSize: 40 },
  finalHeadline: {
    fontFamily: FONTS.black, fontSize: 20,
    color: COLORS.cream, textAlign: 'center',
    lineHeight: 28, letterSpacing: -0.3,
  },
  finalBody: {
    fontFamily: FONTS.regular, fontSize: 15,
    color: 'rgba(255,244,230,0.55)',
    textAlign: 'center', lineHeight: 24,
  },
  finalAccent: { fontFamily: FONTS.bold, color: COLORS.amber },

  // CTA
  ctaWrap: { gap: 14, paddingBottom: 8 },
  ctaBtn: {
    borderRadius: 22, overflow: 'hidden',
    shadowColor: '#FF6600', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.50, shadowRadius: 20, elevation: 10,
  },
  ctaGrad: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 21, paddingHorizontal: 28, gap: 10,
  },
  ctaTxt:   { fontFamily: FONTS.black, fontSize: 18, color: '#1A0602', letterSpacing: 0.2 },
  ctaArrow: { fontFamily: FONTS.black, fontSize: 20, color: '#1A0602' },
  ctaTrustRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  ctaTrustItem:{ fontFamily: FONTS.bold, fontSize: 12, color: 'rgba(255,244,230,0.45)' },
  ctaTrustDot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: 'rgba(255,244,230,0.20)' },
});
