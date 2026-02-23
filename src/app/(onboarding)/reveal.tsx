/**
 * app/onboarding/reveal.tsx  — Screen 10: Introducing Ember
 *
 * Interactive feature tour. Each tap reveals the next feature
 * with a live mini-demo of the actual UI. Users see exactly
 * what they're buying before the paywall.
 *
 * Steps:
 *   0. Intro        — ember name reveal + feature grid
 *   1. Blocking     — live blocked app grid, tap to shake
 *   2. Session      — interactive goal + duration picker
 *   3. Timer        — animated live focus timer
 *   4. Checkpoint   — game menu with selectable cards
 *   5. Exit guard   — interactive type-your-goal demo
 *   6. Insights     — animated bar chart + stats
 *
 * NAVIGATION → /onboarding/plan
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Animated, Dimensions, StatusBar, Easing,
  ScrollView, TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  useFonts, Nunito_800ExtraBold, Nunito_700Bold, Nunito_400Regular,
} from '@expo-google-fonts/nunito';
import { COLORS, FONTS } from '../../theme';
import { OnboardingProgress } from '../../components/OnboardingProgress';

const { width: SW, height: SH } = Dimensions.get('window');
const PAD   = 24;
const DEMO_W = SW - PAD * 2;

// ─────────────────────────────────────────────────────────────────────────────
// STEPS
// ─────────────────────────────────────────────────────────────────────────────
const STEPS = [
  { id: 'intro',      cta: 'See how it works →' },
  { id: 'blocking',   cta: 'Next: Start a session →' },
  { id: 'session',    cta: 'Next: Focus timer →' },
  { id: 'timer',      cta: 'Next: Checkpoints →' },
  { id: 'checkpoint', cta: 'Next: The exit guard →' },
  { id: 'exitguard',  cta: 'Next: Your insights →' },
  { id: 'insights',   cta: 'Build my plan →' },
];

const STEP_META = [
  { eyebrow: 'INTRODUCING',       title: 'ember',             isBig: true,  body: "The focus system that works with your brain, not against it. Here's exactly how." },
  { eyebrow: '01 — APP BLOCKING', title: 'Lock out every distraction.',     body: "During a session, every distracting app goes dark. Instagram, TikTok, YouTube — all blocked. Tap one to see what happens." },
  { eyebrow: '02 — SESSION START',title: 'You pick the goal and duration.', body: "Choose what you're working on and how long. Ember builds your block around it — checkpoints timed to your rhythm." },
  { eyebrow: '03 — FOCUS TIMER',  title: 'One screen. One goal. Eyes down.',body: "A live timer. A progress bar telling you exactly when your next break fires. Nothing else." },
  { eyebrow: '04 — CHECKPOINTS',  title: 'Choose your 5-minute reset.',     body: "When a checkpoint fires, you pick a game. Not Netflix. Not scrolling. A mini-game that actually restores your focus." },
  { eyebrow: '05 — EXIT GUARD',   title: 'You have to mean it to leave.',   body: "Want to quit? Type your goal to confirm you're done. The friction is intentional — it makes you think twice." },
  { eyebrow: '06 — INSIGHTS',     title: 'Watch your focus compound.',      body: "Every session builds your picture. Best focus windows, streak momentum, weekly hours — you can see yourself improving." },
];

// ─────────────────────────────────────────────────────────────────────────────
// SHARED PHONE FRAME
// ─────────────────────────────────────────────────────────────────────────────
function PhoneFrame({ children }: { children: React.ReactNode }) {
  return (
    <View style={fr.outer}>
      <LinearGradient colors={['#1C1410', '#120E08']} style={StyleSheet.absoluteFill} />
      <View style={fr.notch} />
      <View style={fr.statusBar}>
        <Text style={fr.time}>9:41</Text>
        <Text style={fr.icons}>● ▲ ■</Text>
      </View>
      {children}
    </View>
  );
}
const fr = StyleSheet.create({
  outer: {
    width: DEMO_W, borderRadius: 28,
    backgroundColor: '#120E08',
    borderWidth: 2, borderColor: '#2A2018',
    overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.50, shadowRadius: 24,
  },
  notch: {
    alignSelf: 'center', marginTop: 10,
    width: 72, height: 18, borderRadius: 9,
    backgroundColor: '#0A0804',
  },
  statusBar: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingHorizontal: 18, paddingTop: 4, paddingBottom: 6,
  },
  time:  { fontFamily: FONTS.bold, fontSize: 11, color: 'rgba(255,244,230,0.35)' },
  icons: { fontFamily: FONTS.regular, fontSize: 8, color: 'rgba(255,244,230,0.25)' },
});

// ─────────────────────────────────────────────────────────────────────────────
// DEMO 1 — APP BLOCKING
// ─────────────────────────────────────────────────────────────────────────────
const BLOCKED_APPS = [
  { name: 'Instagram', icon: '📸' },
  { name: 'TikTok',    icon: '🎵' },
  { name: 'Twitter',   icon: '🐦' },
  { name: 'YouTube',   icon: '▶️'  },
  { name: 'Reddit',    icon: '🤖' },
  { name: 'Messages',  icon: '💬' },
];

function BlockingDemo() {
  const lockAnims    = useRef(BLOCKED_APPS.map(() => new Animated.Value(0))).current;
  const overlayAnims = useRef(BLOCKED_APPS.map(() => new Animated.Value(0))).current;
  const shakeAnims   = useRef(BLOCKED_APPS.map(() => new Animated.Value(0))).current;
  const [tapped, setTapped] = useState<number | null>(null);

  useEffect(() => {
    BLOCKED_APPS.forEach((_, i) => {
      Animated.sequence([
        Animated.delay(180 + i * 110),
        Animated.parallel([
          Animated.spring(lockAnims[i], { toValue: 1, tension: 80, friction: 6, useNativeDriver: true }),
          Animated.timing(overlayAnims[i], { toValue: 1, duration: 280, useNativeDriver: true }),
        ]),
      ]).start();
    });
  }, []);

  const tap = (i: number) => {
    setTapped(i);
    Animated.sequence([
      Animated.timing(shakeAnims[i], { toValue:  5, duration: 55, useNativeDriver: true }),
      Animated.timing(shakeAnims[i], { toValue: -5, duration: 55, useNativeDriver: true }),
      Animated.timing(shakeAnims[i], { toValue:  3, duration: 55, useNativeDriver: true }),
      Animated.timing(shakeAnims[i], { toValue:  0, duration: 55, useNativeDriver: true }),
    ]).start(() => setTapped(null));
  };

  return (
    <PhoneFrame>
      <View style={bl.header}>
        <Text style={bl.ember}>🔥 ember</Text>
        <View style={bl.chip}>
          <View style={bl.chipDot} />
          <Text style={bl.chipTxt}>FOCUS ACTIVE</Text>
        </View>
      </View>
      <Text style={bl.hint}>Tap an app to try 👆</Text>
      <View style={bl.grid}>
        {BLOCKED_APPS.map((app, i) => (
          <TouchableOpacity key={i} style={bl.appWrap} onPress={() => tap(i)} activeOpacity={0.9}>
            <Animated.View style={[bl.icon, {
              transform: [{ translateX: shakeAnims[i].interpolate({ inputRange: [-5,0,5], outputRange: [-5,0,5] }) }],
            }]}>
              <Text style={bl.emoji}>{app.icon}</Text>
              <Animated.View style={[bl.overlay, { opacity: overlayAnims[i] }]} />
              <Animated.View style={[bl.lock, { opacity: lockAnims[i], transform: [{ scale: lockAnims[i] }] }]}>
                <Text style={{ fontSize: 10 }}>🔒</Text>
              </Animated.View>
            </Animated.View>
            <Text style={bl.name}>{app.name}</Text>
            {tapped === i && (
              <View style={bl.blockedPop}><Text style={bl.blockedPopTxt}>Blocked</Text></View>
            )}
          </TouchableOpacity>
        ))}
      </View>
      <View style={bl.footer}>
        <Text style={bl.footerTxt}>Session ends in 24 min</Text>
      </View>
    </PhoneFrame>
  );
}
const bl = StyleSheet.create({
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 18, paddingBottom: 8,
  },
  ember:   { fontFamily: FONTS.black, fontSize: 16, color: COLORS.cream },
  chip:    {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(255,144,48,0.15)',
    borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5,
    borderWidth: 1, borderColor: 'rgba(255,144,48,0.30)',
  },
  chipDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.orange },
  chipTxt: { fontFamily: FONTS.bold, fontSize: 9, color: COLORS.orange, letterSpacing: 1 },
  hint:    { fontFamily: FONTS.regular, fontSize: 10, color: 'rgba(255,244,230,0.35)', paddingHorizontal: 18, marginBottom: 10 },
  grid:    { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 14, gap: 8, justifyContent: 'center' },
  appWrap: { alignItems: 'center', gap: 5, width: (DEMO_W - 28 - 32) / 3, position: 'relative' },
  icon:    {
    width: 54, height: 54, borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    overflow: 'visible',
  },
  emoji:  { fontSize: 26 },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 13,
  },
  lock: {
    position: 'absolute', bottom: -5, right: -5,
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: '#1A1410',
    alignItems: 'center', justifyContent: 'center',
  },
  name:       { fontFamily: FONTS.regular, fontSize: 9, color: 'rgba(255,244,230,0.35)' },
  blockedPop: {
    position: 'absolute', top: -24,
    backgroundColor: '#FF3322', borderRadius: 7,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  blockedPopTxt: { fontFamily: FONTS.bold, fontSize: 9, color: '#fff' },
  footer:    { margin: 14, padding: 10, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)', alignItems: 'center' },
  footerTxt: { fontFamily: FONTS.regular, fontSize: 11, color: 'rgba(255,244,230,0.40)' },
});

// ─────────────────────────────────────────────────────────────────────────────
// DEMO 2 — SESSION START
// ─────────────────────────────────────────────────────────────────────────────
const DURATIONS = [15, 25, 30, 45, 60];
const GOALS     = ['Deep work', 'Studying', 'Writing', 'Design'];

function SessionDemo() {
  const [dur,  setDur]  = useState(25);
  const [goal, setGoal] = useState('Deep work');
  const btnS = useRef(new Animated.Value(1)).current;

  const pick = (d: number) => {
    setDur(d);
    Animated.sequence([
      Animated.timing(btnS, { toValue: 0.94, duration: 70, useNativeDriver: true }),
      Animated.timing(btnS, { toValue: 1,    duration: 70, useNativeDriver: true }),
    ]).start();
  };

  return (
    <PhoneFrame>
      <View style={ss.inner}>
        <Text style={ss.title}>New Session</Text>
        <Text style={ss.label}>WHAT ARE YOU WORKING ON?</Text>
        <View style={ss.goalsRow}>
          {GOALS.map(g => (
            <TouchableOpacity key={g} style={[ss.goalChip, goal === g && ss.goalChipOn]} onPress={() => setGoal(g)} activeOpacity={0.8}>
              {goal === g && <LinearGradient colors={['rgba(255,144,48,0.20)','rgba(255,94,14,0.10)']} style={StyleSheet.absoluteFill} />}
              <Text style={[ss.goalTxt, goal === g && ss.goalTxtOn]}>{g}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={[ss.label, { marginTop: 12 }]}>HOW LONG?</Text>
        <View style={ss.durRow}>
          {DURATIONS.map(d => (
            <TouchableOpacity key={d} style={[ss.durBtn, dur === d && ss.durBtnOn]} onPress={() => pick(d)} activeOpacity={0.8}>
              {dur === d && <LinearGradient colors={['#FF9030','#FF5E0E']} style={StyleSheet.absoluteFill} />}
              <Text style={[ss.durN, dur === d && ss.durNOn]}>{d}</Text>
              <Text style={[ss.durM, dur === d && ss.durMOn]}>min</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={ss.summary}>
          <LinearGradient colors={['rgba(255,144,48,0.10)','rgba(255,94,14,0.05)']} style={StyleSheet.absoluteFill} />
          <Text style={ss.summaryTxt}>
            {dur}-min session · <Text style={ss.summaryAccent}>{goal}</Text>
            {'\n'}checkpoint every {Math.floor(dur / 2)}m
          </Text>
        </View>
        <Animated.View style={{ transform: [{ scale: btnS }] }}>
          <TouchableOpacity style={ss.startBtn} activeOpacity={0.9}>
            <LinearGradient colors={['#FF9030','#FF5E0E']} style={ss.startGrad}>
              <Text style={ss.startTxt}>Start Session 🔥</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </PhoneFrame>
  );
}
const ss = StyleSheet.create({
  inner:     { paddingHorizontal: 18, paddingBottom: 16 },
  title:     { fontFamily: FONTS.black, fontSize: 20, color: COLORS.cream, letterSpacing: -0.3, marginBottom: 14 },
  label:     { fontFamily: FONTS.bold, fontSize: 8, letterSpacing: 2, color: 'rgba(255,244,230,0.35)', marginBottom: 8, textTransform: 'uppercase' },
  goalsRow:  { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 0 },
  goalChip:  { borderRadius: 20, paddingHorizontal: 12, paddingVertical: 7, borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)', backgroundColor: 'rgba(255,255,255,0.04)', overflow: 'hidden' },
  goalChipOn:{ borderColor: 'rgba(255,144,48,0.45)' },
  goalTxt:   { fontFamily: FONTS.bold, fontSize: 11, color: 'rgba(255,244,230,0.45)' },
  goalTxtOn: { color: COLORS.cream },
  durRow:    { flexDirection: 'row', gap: 6, marginBottom: 12 },
  durBtn:    { flex: 1, borderRadius: 12, paddingVertical: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)', backgroundColor: 'rgba(255,255,255,0.04)', alignItems: 'center', overflow: 'hidden' },
  durBtnOn:  { borderColor: 'transparent' },
  durN:      { fontFamily: FONTS.black, fontSize: 13, color: 'rgba(255,244,230,0.45)' },
  durNOn:    { color: '#1A0602' },
  durM:      { fontFamily: FONTS.regular, fontSize: 8, color: 'rgba(255,244,230,0.30)' },
  durMOn:    { color: 'rgba(26,6,2,0.70)' },
  summary:   { borderRadius: 14, padding: 12, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,144,48,0.20)', marginBottom: 12 },
  summaryTxt:    { fontFamily: FONTS.regular, fontSize: 12, color: 'rgba(255,244,230,0.50)', lineHeight: 19 },
  summaryAccent: { fontFamily: FONTS.bold, color: COLORS.amber },
  startBtn:  { borderRadius: 18, overflow: 'hidden' },
  startGrad: { paddingVertical: 15, alignItems: 'center' },
  startTxt:  { fontFamily: FONTS.black, fontSize: 15, color: '#1A0602' },
});

// ─────────────────────────────────────────────────────────────────────────────
// DEMO 3 — FOCUS TIMER
// ─────────────────────────────────────────────────────────────────────────────
function TimerDemo() {
  const progress = useRef(new Animated.Value(0.72)).current;
  const pulse    = useRef(new Animated.Value(1)).current;
  const cpFill   = useRef(new Animated.Value(0.58)).current;

  useEffect(() => {
    Animated.timing(progress, { toValue: 0.45, duration: 9000, easing: Easing.linear, useNativeDriver: false }).start();
    Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 1.06, duration: 900, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 1.00, duration: 900, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ])).start();
    Animated.timing(cpFill, { toValue: 0.80, duration: 8000, easing: Easing.linear, useNativeDriver: false }).start();
  }, []);

  return (
    <PhoneFrame>
      <View style={tt.inner}>
        <View style={tt.goalPill}>
          <Text style={tt.goalTxt}>✍️  Deep work</Text>
        </View>
        <Animated.View style={[tt.ring, { transform: [{ scale: pulse }] }]}>
          <LinearGradient colors={['#1E1408','#120E04']} style={[StyleSheet.absoluteFill, { borderRadius: 65 }]} />
          <Animated.View style={[tt.ringBorder, {
            borderColor: progress.interpolate({ inputRange:[0,0.4,1], outputRange:['#FF3322','#FF9030','#FFCC33'] }),
          }]} />
          <View style={tt.center}>
            <Text style={tt.timeText}>18:34</Text>
            <Text style={tt.timeSub}>remaining</Text>
          </View>
        </Animated.View>
        <Text style={tt.sessionLbl}>25-minute focus block</Text>
        <View style={tt.cpWrap}>
          <View style={tt.cpRow}>
            <Text style={tt.cpLabel}>NEXT BREAK</Text>
            <Text style={tt.cpEta}>in 4m 20s</Text>
          </View>
          <View style={tt.cpTrack}>
            <Animated.View style={[tt.cpFill, { width: cpFill.interpolate({ inputRange:[0,1], outputRange:['0%','100%'] }) }]}>
              <LinearGradient colors={['#FF9030','#FFCC33']} start={{ x:0,y:0 }} end={{ x:1,y:0 }} style={StyleSheet.absoluteFill} />
            </Animated.View>
          </View>
        </View>
        <View style={tt.stats}>
          {[{ n:'🔥 4', l:'streak' }, { n:'3/5', l:'today' }, { n:'2h 10m', l:'focused' }].map((s,i) => (
            <View key={i} style={tt.stat}>
              <Text style={tt.statN}>{s.n}</Text>
              <Text style={tt.statL}>{s.l}</Text>
            </View>
          ))}
        </View>
      </View>
    </PhoneFrame>
  );
}
const tt = StyleSheet.create({
  inner:      { paddingHorizontal: 18, paddingBottom: 16, alignItems: 'center', gap: 12 },
  goalPill:   { backgroundColor: 'rgba(255,144,48,0.12)', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6, borderWidth: 1, borderColor: 'rgba(255,144,48,0.25)' },
  goalTxt:    { fontFamily: FONTS.bold, fontSize: 12, color: COLORS.amber },
  ring:       { width: 130, height: 130, borderRadius: 65, alignItems: 'center', justifyContent: 'center' },
  ringBorder: { ...StyleSheet.absoluteFillObject, borderWidth: 5, borderRadius: 65 },
  center:     { alignItems: 'center' },
  timeText:   { fontFamily: FONTS.black, fontSize: 28, color: COLORS.cream, letterSpacing: -1 },
  timeSub:    { fontFamily: FONTS.regular, fontSize: 9, color: 'rgba(255,244,230,0.35)', letterSpacing: 0.5 },
  sessionLbl: { fontFamily: FONTS.regular, fontSize: 11, color: 'rgba(255,244,230,0.35)' },
  cpWrap:     { width: '100%', gap: 6 },
  cpRow:      { flexDirection: 'row', justifyContent: 'space-between' },
  cpLabel:    { fontFamily: FONTS.bold, fontSize: 8, letterSpacing: 1.5, color: 'rgba(255,244,230,0.30)' },
  cpEta:      { fontFamily: FONTS.regular, fontSize: 9, color: COLORS.amber },
  cpTrack:    { height: 6, borderRadius: 3, overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.07)' },
  cpFill:     { height: '100%', borderRadius: 3, overflow: 'hidden', minWidth: 4 },
  stats:      { flexDirection: 'row', gap: 8, width: '100%' },
  stat:       { flex: 1, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: 8, alignItems: 'center', gap: 2, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)' },
  statN:      { fontFamily: FONTS.black, fontSize: 12, color: COLORS.amber },
  statL:      { fontFamily: FONTS.regular, fontSize: 8, color: 'rgba(255,244,230,0.30)' },
});

// ─────────────────────────────────────────────────────────────────────────────
// DEMO 4 — CHECKPOINT / GAME MENU
// ─────────────────────────────────────────────────────────────────────────────
const GAMES = [
  { icon: '🎯', name: 'Target Tap',   desc: 'Reflex',  col: '#FF6030' },
  { icon: '🧩', name: 'Pattern Lock', desc: 'Memory',  col: '#8866FF' },
  { icon: '⚡', name: 'Speed Sort',   desc: 'Speed',   col: '#FFCC33' },
  { icon: '🌊', name: 'Flow State',   desc: 'Calm',    col: '#44BBFF' },
];

function CheckpointDemo() {
  const modalA = useRef(new Animated.Value(0)).current;
  const modalY = useRef(new Animated.Value(40)).current;
  const chipA  = useRef(GAMES.map(() => new Animated.Value(0))).current;
  const [sel,  setSel]  = useState<number | null>(null);

  useEffect(() => {
    Animated.sequence([
      Animated.delay(250),
      Animated.parallel([
        Animated.timing(modalA, { toValue: 1, duration: 380, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(modalY, { toValue: 0, duration: 380, easing: Easing.out(Easing.back(1.1)), useNativeDriver: true }),
      ]),
    ]).start();
    GAMES.forEach((_, i) =>
      Animated.sequence([
        Animated.delay(480 + i * 90),
        Animated.spring(chipA[i], { toValue: 1, tension: 80, friction: 7, useNativeDriver: true }),
      ]).start()
    );
  }, []);

  return (
    <PhoneFrame>
      <View style={cp.inner}>
        <View style={cp.behind}>
          <Text style={cp.behindGoal}>✍️  Deep work</Text>
          <Text style={cp.behindTime}>12:18</Text>
        </View>
        <Animated.View style={[cp.modal, { opacity: modalA, transform: [{ translateY: modalY }] }]}>
          <LinearGradient colors={['#1E1810','#160E08']} style={StyleSheet.absoluteFill} />
          <View style={cp.modalHead}>
            <Text style={cp.cpIcon}>⏰</Text>
            <View>
              <Text style={cp.cpTitle}>Checkpoint!</Text>
              <Text style={cp.cpSub}>Pick a 5-minute reset game</Text>
            </View>
          </View>
          <View style={cp.grid}>
            {GAMES.map((g, i) => (
              <Animated.View key={i} style={{ opacity: chipA[i], transform: [{ scale: chipA[i] }] }}>
                <TouchableOpacity style={[cp.card, sel === i && cp.cardSel]} onPress={() => setSel(i)} activeOpacity={0.85}>
                  {sel === i && <LinearGradient colors={[g.col+'22', g.col+'11']} style={StyleSheet.absoluteFill} />}
                  <Text style={cp.gameIcon}>{g.icon}</Text>
                  <Text style={cp.gameName}>{g.name}</Text>
                  <Text style={cp.gameDesc}>{g.desc}</Text>
                  {sel === i && (
                    <View style={[cp.check, { backgroundColor: g.col }]}>
                      <Text style={cp.checkTxt}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </Animated.View>
            ))}
          </View>
          <TouchableOpacity style={[cp.playBtn, sel === null && { opacity: 0.5 }]} activeOpacity={sel !== null ? 0.85 : 1}>
            <LinearGradient
              colors={sel !== null ? ['#FF9030','#FF5E0E'] : ['rgba(255,255,255,0.06)','rgba(255,255,255,0.04)']}
              style={cp.playGrad}
            >
              <Text style={[cp.playTxt, sel === null && { color: 'rgba(255,244,230,0.30)' }]}>
                {sel !== null ? `Play ${GAMES[sel].name}` : 'Choose a game above'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </PhoneFrame>
  );
}
const cp = StyleSheet.create({
  inner:     { paddingBottom: 16 },
  behind:    { alignItems: 'center', paddingVertical: 8, opacity: 0.25 },
  behindGoal:{ fontFamily: FONTS.bold, fontSize: 12, color: COLORS.amber },
  behindTime:{ fontFamily: FONTS.black, fontSize: 30, color: COLORS.cream, letterSpacing: -1 },
  modal:     { marginHorizontal: 12, borderRadius: 22, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)', padding: 16, gap: 12 },
  modalHead: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  cpIcon:    { fontSize: 26 },
  cpTitle:   { fontFamily: FONTS.black, fontSize: 15, color: COLORS.cream },
  cpSub:     { fontFamily: FONTS.regular, fontSize: 11, color: 'rgba(255,244,230,0.40)' },
  grid:      { flexDirection: 'row', gap: 8 },
  card:      { flex: 1, borderRadius: 14, padding: 10, alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.09)', overflow: 'hidden', position: 'relative' },
  cardSel:   { borderColor: 'rgba(255,144,48,0.50)' },
  gameIcon:  { fontSize: 20 },
  gameName:  { fontFamily: FONTS.bold, fontSize: 9, color: COLORS.cream, textAlign: 'center' },
  gameDesc:  { fontFamily: FONTS.regular, fontSize: 8, color: 'rgba(255,244,230,0.35)', textAlign: 'center' },
  check:     { position: 'absolute', top: 5, right: 5, width: 14, height: 14, borderRadius: 7, alignItems: 'center', justifyContent: 'center' },
  checkTxt:  { fontSize: 8, color: '#fff', fontFamily: FONTS.bold },
  playBtn:   { borderRadius: 14, overflow: 'hidden' },
  playGrad:  { paddingVertical: 12, alignItems: 'center' },
  playTxt:   { fontFamily: FONTS.bold, fontSize: 13, color: '#1A0602' },
});

// ─────────────────────────────────────────────────────────────────────────────
// DEMO 5 — EXIT GUARD
// ─────────────────────────────────────────────────────────────────────────────
function ExitGuardDemo() {
  const GOAL    = 'Deep work';
  const [typed, setTyped] = useState('');
  const matched = typed.toLowerCase() === GOAL.toLowerCase();
  const partial = GOAL.toLowerCase().startsWith(typed.toLowerCase()) && typed.length > 0;

  const alertA  = useRef(new Animated.Value(0)).current;
  const alertY  = useRef(new Animated.Value(16)).current;
  const shakeA  = useRef(new Animated.Value(0)).current;
  const successA = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(200),
      Animated.parallel([
        Animated.timing(alertA, { toValue: 1, duration: 380, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(alertY, { toValue: 0, duration: 380, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      ]),
    ]).start();
  }, []);

  const prevTyped = useRef('');
  useEffect(() => {
    if (matched) {
      Animated.spring(successA, { toValue: 1, tension: 70, friction: 6, useNativeDriver: true }).start();
    } else if (typed.length > 0 && !partial && typed !== prevTyped.current) {
      Animated.sequence([
        Animated.timing(shakeA, { toValue:  6, duration: 55, useNativeDriver: true }),
        Animated.timing(shakeA, { toValue: -6, duration: 55, useNativeDriver: true }),
        Animated.timing(shakeA, { toValue:  3, duration: 55, useNativeDriver: true }),
        Animated.timing(shakeA, { toValue:  0, duration: 55, useNativeDriver: true }),
      ]).start();
    }
    prevTyped.current = typed;
  }, [typed]);

  return (
    <PhoneFrame>
      <View style={eg.inner}>
        <View style={eg.timerRow}>
          <Text style={eg.goal}>✍️ Deep work</Text>
          <Text style={eg.time}>18:34</Text>
        </View>
        <Animated.View style={[eg.alert, {
          opacity: alertA,
          transform: [{ translateY: alertY }, { translateX: shakeA }],
          borderColor: matched ? 'rgba(85,221,170,0.50)' : 'rgba(255,80,50,0.35)',
        }]}>
          <LinearGradient
            colors={matched ? ['rgba(85,221,170,0.12)','rgba(85,221,170,0.06)'] : ['rgba(255,80,50,0.10)','rgba(255,80,50,0.05)']}
            style={StyleSheet.absoluteFill}
          />
          <Text style={eg.icon}>{matched ? '✅' : '🚪'}</Text>
          <Text style={eg.alertTitle}>{matched ? 'Session ended early.' : 'Leaving already?'}</Text>
          <Text style={eg.alertSub}>
            {matched ? 'Got it. Session ended.' : `Type your goal to confirm you're done:`}
          </Text>
          {!matched && (
            <>
              <View style={eg.hintPill}>
                <Text style={eg.hintTxt}>"{GOAL}"</Text>
              </View>
              <Animated.View style={[eg.inputWrap, {
                borderColor: matched ? 'rgba(85,221,170,0.60)' : partial ? 'rgba(255,170,50,0.50)' : 'rgba(255,255,255,0.12)',
              }]}>
                <TextInput
                  style={eg.input}
                  value={typed}
                  onChangeText={setTyped}
                  placeholder="Type your goal…"
                  placeholderTextColor="rgba(255,244,230,0.20)"
                  autoCorrect={false}
                  autoCapitalize="none"
                />
                {partial && !matched && <Text style={{ fontSize: 12, color: COLORS.amber }}>✓</Text>}
              </Animated.View>
              <Text style={eg.hint}>The friction is intentional.</Text>
            </>
          )}
          {matched && (
            <Animated.View style={[eg.successRow, { opacity: successA, transform: [{ scale: successA }] }]}>
              <Text style={eg.successTxt}>Session ended ✓</Text>
            </Animated.View>
          )}
        </Animated.View>
      </View>
    </PhoneFrame>
  );
}
const eg = StyleSheet.create({
  inner:    { paddingHorizontal: 16, paddingBottom: 16, gap: 10 },
  timerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)', opacity: 0.45 },
  goal:     { fontFamily: FONTS.bold, fontSize: 12, color: COLORS.amber },
  time:     { fontFamily: FONTS.black, fontSize: 18, color: COLORS.cream, letterSpacing: -0.5 },
  alert:    { borderRadius: 20, padding: 16, gap: 8, overflow: 'hidden', borderWidth: 1.5 },
  icon:     { fontSize: 22 },
  alertTitle:{ fontFamily: FONTS.black, fontSize: 15, color: COLORS.cream },
  alertSub: { fontFamily: FONTS.regular, fontSize: 12, color: 'rgba(255,244,230,0.50)', lineHeight: 17 },
  hintPill: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6, alignSelf: 'flex-start' },
  hintTxt:  { fontFamily: FONTS.bold, fontSize: 13, color: COLORS.amber },
  inputWrap:{ flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.04)', paddingHorizontal: 12 },
  input:    { flex: 1, paddingVertical: 10, fontFamily: FONTS.bold, fontSize: 13, color: COLORS.cream },
  hint:     { fontFamily: FONTS.regular, fontSize: 9, color: 'rgba(255,244,230,0.22)', fontStyle: 'italic' },
  successRow:{ backgroundColor: 'rgba(85,221,170,0.15)', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8, alignSelf: 'center' },
  successTxt:{ fontFamily: FONTS.bold, fontSize: 13, color: '#55DDAA' },
});

// ─────────────────────────────────────────────────────────────────────────────
// DEMO 6 — INSIGHTS
// ─────────────────────────────────────────────────────────────────────────────
const WEEK = [
  { d: 'M', h: 2.5 }, { d: 'T', h: 1.8 }, { d: 'W', h: 3.2 },
  { d: 'T', h: 0.8 }, { d: 'F', h: 2.9 }, { d: 'S', h: 1.5 }, { d: 'S', h: 3.8 },
];
const MAX_H = Math.max(...WEEK.map(d => d.h));

function InsightsDemo() {
  const barA  = useRef(WEEK.map(() => new Animated.Value(0))).current;
  const statsA = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    WEEK.forEach((_, i) =>
      Animated.sequence([
        Animated.delay(180 + i * 80),
        Animated.spring(barA[i], { toValue: 1, tension: 80, friction: 7, useNativeDriver: false }),
      ]).start()
    );
    Animated.sequence([
      Animated.delay(800),
      Animated.timing(statsA, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <PhoneFrame>
      <View style={ins.inner}>
        <View style={ins.tabs}>
          {['Session','Insights','Games'].map((t, i) => (
            <View key={i} style={[ins.tab, i === 1 && ins.tabActive]}>
              <Text style={[ins.tabTxt, i === 1 && ins.tabTxtActive]}>{t}</Text>
              {i === 1 && <View style={ins.tabLine} />}
            </View>
          ))}
        </View>
        <Animated.View style={[ins.statRow, { opacity: statsA }]}>
          {[{ n:'16.5h', l:'this week' }, { n:'🔥 5', l:'day streak' }, { n:'+22%', l:'vs last week' }].map((s,i) => (
            <React.Fragment key={i}>
              {i > 0 && <View style={ins.div} />}
              <View style={ins.statItem}>
                <Text style={ins.statN}>{s.n}</Text>
                <Text style={ins.statL}>{s.l}</Text>
              </View>
            </React.Fragment>
          ))}
        </Animated.View>
        <View style={ins.chart}>
          <Text style={ins.chartLabel}>FOCUS HOURS — THIS WEEK</Text>
          <View style={ins.bars}>
            {WEEK.map((d, i) => (
              <View key={i} style={ins.barCol}>
                <View style={ins.barTrack}>
                  <Animated.View style={[ins.barFill, {
                    height: barA[i].interpolate({ inputRange:[0,1], outputRange:['0%', `${(d.h / MAX_H) * 100}%`] }),
                    backgroundColor: i === 6 ? COLORS.orange : i === 2 ? COLORS.amber : 'rgba(255,144,48,0.45)',
                  }]} />
                </View>
                <Text style={ins.barDay}>{d.d}</Text>
              </View>
            ))}
          </View>
        </View>
        <Animated.View style={[ins.insightCard, { opacity: statsA }]}>
          <Text style={{ fontSize: 16 }}>🧠</Text>
          <View>
            <Text style={ins.insightTxt}>Best focus: <Text style={{ color: COLORS.amber, fontFamily: FONTS.bold }}>9–11am</Text></Text>
            <Text style={ins.insightSub}>Schedule your hardest work here</Text>
          </View>
        </Animated.View>
      </View>
    </PhoneFrame>
  );
}
const ins = StyleSheet.create({
  inner:       { paddingBottom: 14, gap: 10 },
  tabs:        { flexDirection: 'row', paddingHorizontal: 18 },
  tab:         { flex: 1, alignItems: 'center', paddingVertical: 8, position: 'relative' },
  tabActive:   {},
  tabTxt:      { fontFamily: FONTS.bold, fontSize: 11, color: 'rgba(255,244,230,0.25)' },
  tabTxtActive:{ color: COLORS.amber },
  tabLine:     { position: 'absolute', bottom: 0, left: '20%', right: '20%', height: 2, backgroundColor: COLORS.amber, borderRadius: 1 },
  statRow:     { flexDirection: 'row', paddingHorizontal: 18 },
  statItem:    { flex: 1, alignItems: 'center', gap: 2 },
  statN:       { fontFamily: FONTS.black, fontSize: 15, color: COLORS.cream, letterSpacing: -0.5 },
  statL:       { fontFamily: FONTS.regular, fontSize: 9, color: 'rgba(255,244,230,0.35)' },
  div:         { width: 1, backgroundColor: 'rgba(255,255,255,0.08)', marginVertical: 4 },
  chart:       { paddingHorizontal: 18, gap: 6 },
  chartLabel:  { fontFamily: FONTS.bold, fontSize: 7, letterSpacing: 1.5, color: 'rgba(255,244,230,0.25)' },
  bars:        { flexDirection: 'row', gap: 4, alignItems: 'flex-end', height: 56 },
  barCol:      { flex: 1, alignItems: 'center', gap: 4 },
  barTrack:    { flex: 1, width: '100%', justifyContent: 'flex-end', borderRadius: 4, overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.05)' },
  barFill:     { width: '100%', borderRadius: 4, minHeight: 2 },
  barDay:      { fontFamily: FONTS.bold, fontSize: 8, color: 'rgba(255,244,230,0.28)' },
  insightCard: { marginHorizontal: 18, flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)' },
  insightTxt:  { fontFamily: FONTS.bold, fontSize: 12, color: COLORS.cream },
  insightSub:  { fontFamily: FONTS.regular, fontSize: 10, color: 'rgba(255,244,230,0.35)', marginTop: 2 },
});

// ─────────────────────────────────────────────────────────────────────────────
// MAIN SCREEN
// ─────────────────────────────────────────────────────────────────────────────
export default function RevealScreen() {
  const insets = useSafeAreaInsets();
  const [fontsLoaded] = useFonts({ Nunito_800ExtraBold, Nunito_700Bold, Nunito_400Regular });

  const [step, setStep] = useState(0);
  const isIntro = step === 0;

  const contentA = useRef(new Animated.Value(0)).current;
  const contentY = useRef(new Animated.Value(14)).current;
  const demoA    = useRef(new Animated.Value(0)).current;
  const demoY    = useRef(new Animated.Value(20)).current;
  const ctaA     = useRef(new Animated.Value(0)).current;
  const ctaS     = useRef(new Animated.Value(0.95)).current;
  const dotAnims = useRef(STEPS.map(() => new Animated.Value(0))).current;

  // Intro only
  const flameS   = useRef(new Animated.Value(0.5)).current;
  const flameA   = useRef(new Animated.Value(0)).current;
  const glowS    = useRef(new Animated.Value(0.8)).current;
  const glowA    = useRef(new Animated.Value(0)).current;
  const PARTICLE_COUNT = 12;
  const parts = useRef(Array.from({ length: PARTICLE_COUNT }, () => ({
    a: new Animated.Value(0), x: new Animated.Value(0), y: new Animated.Value(0),
  }))).current;

  const runEntrance = useCallback((s: number) => {
    contentA.setValue(0); contentY.setValue(14);
    demoA.setValue(0);    demoY.setValue(20);
    ctaA.setValue(0);     ctaS.setValue(0.95);

    Animated.parallel([
      Animated.timing(contentA, { toValue: 1, duration: 360, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.timing(contentY, { toValue: 0, duration: 360, easing: Easing.out(Easing.quad), useNativeDriver: true }),
    ]).start();
    Animated.sequence([
      Animated.delay(160),
      Animated.parallel([
        Animated.timing(demoA, { toValue: 1, duration: 400, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(demoY, { toValue: 0, duration: 400, easing: Easing.out(Easing.back(1.05)), useNativeDriver: true }),
      ]),
    ]).start();
    Animated.sequence([
      Animated.delay(480),
      Animated.parallel([
        Animated.timing(ctaA, { toValue: 1, duration: 280, useNativeDriver: true }),
        Animated.spring(ctaS,  { toValue: 1, tension: 70, friction: 7, useNativeDriver: true }),
      ]),
    ]).start();
    Animated.spring(dotAnims[s], { toValue: 1, tension: 80, friction: 6, useNativeDriver: false }).start();
  }, []);

  const burstParticles = useCallback(() => {
    const ANGLES = Array.from({ length: PARTICLE_COUNT }, (_, i) => (i / PARTICLE_COUNT) * Math.PI * 2);
    parts.forEach((p, i) => {
      p.a.setValue(1); p.x.setValue(0); p.y.setValue(0);
      const r = 50 + Math.random() * 65;
      Animated.parallel([
        Animated.timing(p.x, { toValue: Math.cos(ANGLES[i]) * r, duration: 680 + Math.random() * 180, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(p.y, { toValue: Math.sin(ANGLES[i]) * r, duration: 680 + Math.random() * 180, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.sequence([
          Animated.timing(p.a, { toValue: 0.9, duration: 180, useNativeDriver: true }),
          Animated.timing(p.a, { toValue: 0,   duration: 480, useNativeDriver: true }),
        ]),
      ]).start();
    });
  }, []);

  useEffect(() => {
    // Flame intro
    Animated.sequence([
      Animated.delay(280),
      Animated.parallel([
        Animated.spring(flameS, { toValue: 1, tension: 50, friction: 6, useNativeDriver: true }),
        Animated.timing(flameA, { toValue: 1, duration: 380, useNativeDriver: true }),
        Animated.timing(glowA,  { toValue: 1, duration: 550, useNativeDriver: true }),
        Animated.spring(glowS,  { toValue: 1, tension: 30, friction: 8, useNativeDriver: true }),
      ]),
    ]).start();
    setTimeout(burstParticles, 480);
    Animated.loop(Animated.sequence([
      Animated.timing(glowS, { toValue: 1.18, duration: 2200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(glowS, { toValue: 1.00, duration: 2200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ])).start();
    runEntrance(0);
  }, []);

  const advance = () => {
    if (step === STEPS.length - 1) { router.push('/(onboarding)/plan'); return; }
    const next = step + 1;
    setStep(next);
    runEntrance(next);
  };

  const back = () => {
    if (step === 0) return;
    const prev = step - 1;
    setStep(prev);
    runEntrance(prev);
  };

  if (!fontsLoaded) return null;

  const meta  = STEP_META[step];
  const GSIZ  = SW * 1.2;

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <LinearGradient colors={['#000000','#050200','#0A0400']} start={{ x:0.5,y:0 }} end={{ x:0.5,y:1 }} style={StyleSheet.absoluteFill} />

      {/* Intro glow */}
      {isIntro && (
        <Animated.View pointerEvents="none" style={[styles.glow, {
          width: GSIZ, height: GSIZ, borderRadius: GSIZ / 2,
          marginLeft: -(GSIZ / 2), opacity: glowA, transform: [{ scale: glowS }],
        }]} />
      )}

      {/* Intro particles */}
      {isIntro && (
        <View style={styles.particleRoot} pointerEvents="none">
          {parts.map((p, i) => (
            <Animated.View key={i} style={[styles.particle, {
              width: 3 + (i % 3), height: 3 + (i % 3), borderRadius: 3,
              backgroundColor: i % 2 === 0 ? COLORS.orange : COLORS.amber,
              opacity: p.a, transform: [{ translateX: p.x }, { translateY: p.y }],
            }]} />
          ))}
        </View>
      )}

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 14, paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        scrollEnabled={false}
      >
        {/* Top bar */}
        <View style={[styles.topBar, { marginBottom: 16}]}>
          {step > 0
            ? <TouchableOpacity style={styles.backBtn} onPress={back} activeOpacity={0.7}><Text style={styles.backArrow}>←</Text></TouchableOpacity>
            : <View style={{ width: 36 }} />
          }
          <View style={{ flex: 1 }}><OnboardingProgress step={10} /></View>
          <View style={{ width: 36 }} />
        </View>

        {/* Step dots */}
        

        {/* Text */}
        <Animated.View style={[styles.textBlock, { opacity: contentA, transform: [{ translateY: contentY }] }]}>
          {!isIntro ? (<Text style={styles.eyebrow}>{meta.eyebrow}</Text>) : <></>}
          {isIntro ? (
            <>
                        <Text style={styles.eyebrowIntro}>{meta.eyebrow}</Text>
            <View style={styles.introRow}>
              <Animated.Text style={[styles.flame, { opacity: flameA, transform: [{ scale: flameS }] }]}>🔥</Animated.Text>
              <Animated.Text style={[styles.wordmark, { opacity: flameA, transform: [{ scale: flameS }] }]}>ember</Animated.Text>
            </View>
            </>
          ) : (
            <Text style={styles.title}>{meta.title}</Text>
          )}
          <Text style={styles.body}>{meta.body}</Text>
        </Animated.View>

        {/* Demo */}
        <Animated.View style={[styles.demoWrap, { opacity: demoA, transform: [{ translateY: demoY }] }]}>
          {step === 0 && (
            <View style={styles.featureGrid}>
              {[
                { icon:'🔒', label:'App blocking' },
                { icon:'⏱', label:'Focus timer'  },
                { icon:'🎮', label:'Reset games'  },
                { icon:'🚪', label:'Exit guard'   },
                { icon:'📊', label:'Insights'     },
                { icon:'🔥', label:'Streaks'      },
              ].map((f, i) => (
                <View key={i} style={styles.featureChip}>
                  <Text style={styles.featureIcon}>{f.icon}</Text>
                  <Text style={styles.featureLabel}>{f.label}</Text>
                </View>
              ))}
            </View>
          )}
          {step === 1 && <BlockingDemo />}
          {step === 2 && <SessionDemo />}
          {step === 3 && <TimerDemo />}
          {step === 4 && <CheckpointDemo />}
          {step === 5 && <ExitGuardDemo />}
          {step === 6 && <InsightsDemo />}
        </Animated.View>


        {/* CTA */}
        <Animated.View style={[styles.ctaWrap, { opacity: ctaA, transform: [{ scale: ctaS }] }]}>
          <TouchableOpacity style={styles.ctaBtn} onPress={advance} activeOpacity={0.88}>
            <LinearGradient colors={['#FF9030','#FF5E0E']} start={{ x:0,y:0 }} end={{ x:1,y:0 }} style={styles.ctaGrad}>
              <Text style={styles.ctaTxt}>{STEPS[step].cta}</Text>
            </LinearGradient>
          </TouchableOpacity>
          {step < STEPS.length - 1 && (
            <Text style={styles.stepCount}>{step + 1} of {STEPS.length}</Text>
          )}
        </Animated.View>
        <View style={styles.dotsRow}>
          {STEPS.map((_, i) => (
            <Animated.View key={i} style={[styles.dot, {
              width: dotAnims[i].interpolate({ inputRange:[0,1], outputRange:[6,18] }),
              backgroundColor: i <= step ? COLORS.orange : 'rgba(255,255,255,0.12)',
              opacity: dotAnims[i].interpolate({ inputRange:[0,1], outputRange:[0.35,1] }),
            }]} />
          ))}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root:  { flex: 1, backgroundColor: '#000' },
  scroll:{ flex: 1 },
  scrollContent: { paddingHorizontal: PAD, gap: 16 },

  glow: {
    position: 'absolute', top: SH * 0.04, left: '50%',
    backgroundColor: 'transparent',
    shadowColor: '#FF6600', shadowOffset: { width:0,height:0 },
    shadowOpacity: 1, shadowRadius: 100, zIndex: 0,
  },
  particleRoot: { position: 'absolute', top: SH * 0.20, left: '50%', zIndex: 1 },
  particle: { position: 'absolute', marginLeft: -2, marginTop: -2 },

  topBar: { flexDirection: 'row', alignItems: 'center', gap: 12, zIndex: 2 },
  backBtn:{ width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.06)', alignItems: 'center', justifyContent: 'center' },
  backArrow:{ fontFamily: FONTS.bold, fontSize: 18, color: COLORS.cream, lineHeight: 20 },

  dotsRow: { flexDirection: 'row', gap: 5, justifyContent: 'center' },
  dot:     { height: 6, borderRadius: 3 },

  textBlock: { gap: 7, zIndex: 2 },
  eyebrow:   { fontFamily: FONTS.bold, fontSize: 10, letterSpacing: 3, color: 'rgba(255,150,50,0.55)', textTransform: 'uppercase' },
  eyebrowIntro:   { fontFamily: FONTS.bold, fontSize: 10, letterSpacing: 3, color: 'rgba(255,150,50,0.55)', textTransform: 'uppercase', marginTop: 96 },
  introRow:  { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 0 },
  flame:     { fontSize: 42 },
  wordmark:  {
    fontFamily: FONTS.black, fontSize: 56, color: COLORS.cream,
    letterSpacing: -2, lineHeight: 62,
    textShadowColor: '#FF8800', textShadowOffset: { width:0,height:0 }, textShadowRadius: 20,
  },
  title:     { fontFamily: FONTS.black, fontSize: 24, color: COLORS.cream, lineHeight: 31, letterSpacing: -0.4 },
  body:      { fontFamily: FONTS.regular, fontSize: 14, color: 'rgba(255,244,230,0.50)', lineHeight: 22 },

  demoWrap:  { zIndex: 2 },

  featureGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  featureChip: { width: (DEMO_W - 16) / 3, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 16, padding: 12, alignItems: 'center', gap: 6, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  featureIcon:  { fontSize: 22 },
  featureLabel: { fontFamily: FONTS.bold, fontSize: 10, color: 'rgba(255,244,230,0.55)', textAlign: 'center' },

  ctaWrap: { gap: 8, zIndex: 2 },
  ctaBtn:  { borderRadius: 22, overflow: 'hidden', shadowColor: '#FF6600', shadowOffset: { width:0,height:6 }, shadowOpacity: 0.45, shadowRadius: 16, elevation: 8 },
  ctaGrad: { paddingVertical: 19, alignItems: 'center', justifyContent: 'center' },
  ctaTxt:  { fontFamily: FONTS.black, fontSize: 17, color: '#1A0602', letterSpacing: 0.1 },
  stepCount: { fontFamily: FONTS.regular, fontSize: 11, color: 'rgba(255,244,230,0.25)', textAlign: 'center' },
});
