/**
 * Ember – StartSessionModal.tsx
 *
 * Bottom sheet that slides up when "Begin Focus" is pressed.
 *
 * Fields:
 *   1. Goal text input  (what are you working on?)
 *   2. Duration picker  (25 / 45 / 60 / 90 min chips + custom slider)
 *
 * On confirm → calls sessionStore.startSession() → navigates to /session
 *
 * Usage in HomeScreen:
 *   const [showModal, setShowModal] = useState(false);
 *   <StartSessionModal visible={showModal} onClose={() => setShowModal(false)} />
 *   <TouchableOpacity onPress={() => setShowModal(true)}>Begin Focus</TouchableOpacity>
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useSessionStore } from '../store/sessionStore';
import { COLORS, FONTS } from '../theme';

const { height: SH, width: SW } = Dimensions.get('window');

// ─── Duration presets ─────────────────────────────────────────────────────────
const PRESETS = [
  { label: '30m', mins: 30 },
  { label: '60m', mins: 60 },
  { label: '90m', mins: 90 },
  { label: '120m', mins: 120 },
] as const;

// ─── Goal suggestions (shown as quick-tap chips) ──────────────────────────────
const SUGGESTIONS = [
  'deep work sprint',
  'finish chapter',
  'study session',
  'clear inbox',
  'writing block',
  'code review',
];

const GOAL_MIN = 3;
const GOAL_MAX = 60;

interface Props {
  visible:  boolean;
  onClose:  () => void;
}

export default function StartSessionModal({ visible, onClose }: Props) {
  const insets      = useSafeAreaInsets();
  const startSession = useSessionStore(s => s.startSession);

  // ── Form state ──────────────────────────────────────────────────────────────
  const [goal,         setGoal]         = useState('');
  const [durationMins, setDurationMins] = useState(25);
  const [goalError,    setGoalError]    = useState(false);

  // ── Animation ──────────────────────────────────────────────────────────────
  const slideY    = useRef(new Animated.Value(SH)).current;
  const backdropO = useRef(new Animated.Value(0)).current;
  const shakeX    = useRef(new Animated.Value(0)).current;
  const inputRef  = useRef<TextInput>(null);

  useEffect(() => {
    if (visible) {
      setGoal('');
      setDurationMins(30);
      setGoalError(false);

      Animated.parallel([
        Animated.spring(slideY, {
          toValue: 0, tension: 58, friction: 11, useNativeDriver: true,
        }),
        Animated.timing(backdropO, {
          toValue: 1, duration: 320, useNativeDriver: true,
        }),
      ]).start(() => {
        // Focus input after sheet has settled
        setTimeout(() => inputRef.current?.focus(), 100);
      });
    } else {
      Animated.parallel([
        Animated.timing(slideY, {
          toValue: SH, duration: 340,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(backdropO, {
          toValue: 0, duration: 280, useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, backdropO, slideY]);

  // ── Shake the goal input if empty on submit ────────────────────────────────
  const shakeInput = () => {
    setGoalError(true);
    Animated.sequence([
      Animated.timing(shakeX, { toValue:  10, duration: 55, useNativeDriver: true }),
      Animated.timing(shakeX, { toValue: -10, duration: 55, useNativeDriver: true }),
      Animated.timing(shakeX, { toValue:   8, duration: 55, useNativeDriver: true }),
      Animated.timing(shakeX, { toValue:  -8, duration: 55, useNativeDriver: true }),
      Animated.timing(shakeX, { toValue:   0, duration: 55, useNativeDriver: true }),
    ]).start();
  };

  // ── Confirm ────────────────────────────────────────────────────────────────
  const handleConfirm = () => {
    const trimmed = goal.trim();
    if (trimmed.length < GOAL_MIN) { shakeInput(); return; }
    if (trimmed.length > GOAL_MAX) { shakeInput(); return; }

    onClose();
    // Small delay so the sheet animates out before push
    setTimeout(() => {
      startSession(trimmed, durationMins * 60);
      router.push('/session');
    }, 240);
  };

  // ── Duration display ───────────────────────────────────────────────────────
  const hrs  = Math.floor(durationMins / 60);
  const mins = durationMins % 60;
  const durationLabel = hrs > 0
    ? `${hrs}h ${mins > 0 ? `${mins}m` : ''}`.trim()
    : `${mins} min`;

  return (
    <Modal
      visible={visible}
      transparent
      statusBarTranslucent
      animationType="none"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* ── Backdrop ── */}
        <Animated.View style={[styles.backdrop, { opacity: backdropO }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        </Animated.View>

        {/* ── Sheet ── */}
        <Animated.View style={[
          styles.sheet,
          { transform: [{ translateY: slideY }], paddingBottom: insets.bottom + 16 },
        ]}>
          {/* Handle */}
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>New Session</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={12}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* ── Goal input ── */}
          <Text style={styles.fieldLabel}>What are you working on?</Text>
          <Animated.View style={[
            styles.goalInputWrap,
            goalError && styles.goalInputWrapError,
            { transform: [{ translateX: shakeX }] },
          ]}>
            <TextInput
              ref={inputRef}
              style={styles.goalInput}
              placeholder="e.g. finish chapter 4"
              placeholderTextColor="rgba(255,170,80,0.28)"
              value={goal}
              onChangeText={t => { setGoal(t); setGoalError(false); }}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="default"
              maxLength={60}
            />
            {goal.length > 0 && (
              <TouchableOpacity onPress={() => setGoal('')} style={styles.clearBtn} hitSlop={8}>
                <Text style={styles.clearBtnText}>✕</Text>
              </TouchableOpacity>
            )}
          </Animated.View>
          {goalError && (
            <Text style={styles.errorText}>{goal.trim().length === 0 ? 'Enter a goal to keep you focused 🔥' : goal.trim().length < GOAL_MIN ? `At least ${GOAL_MIN} characters` : `Max ${GOAL_MAX} characters`}</Text>
          )}

          {/* ── Goal suggestions ── */}
          <View style={styles.suggestionsRow}>
            {SUGGESTIONS.map(s => (
              <TouchableOpacity
                key={s}
                style={[styles.suggestionChip, goal === s && styles.suggestionChipActive]}
                onPress={() => { setGoal(s); setGoalError(false); }}
                activeOpacity={0.7}
              >
                <Text style={[styles.suggestionText, goal === s && styles.suggestionTextActive]}>
                  {s}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* ── Duration ── */}
          <Text style={[styles.fieldLabel, { marginTop: 24 }]}>Duration</Text>

          {/* Preset chips */}
          <View style={styles.presetsRow}>
            {PRESETS.map(p => {
              const active = durationMins === p.mins;
              return (
                <TouchableOpacity
                  key={p.mins}
                  style={[styles.presetChip, active && styles.presetChipActive]}
                  onPress={() => setDurationMins(p.mins)}
                  activeOpacity={0.75}
                >
                  {active && (
                    <LinearGradient
                      colors={['#FF7830', '#EE4800']}
                      start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                      style={StyleSheet.absoluteFill}
                    />
                  )}
                  <Text style={[styles.presetText, active && styles.presetTextActive]}>
                    {p.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* ── Custom duration slider ── */}
          <DurationSlider value={durationMins} onChange={setDurationMins} />

          {/* ── Session preview pills ── */}
          <View style={styles.previewRow}>
            <View style={styles.previewPill}>
              <Text style={styles.previewEmoji}>⏱</Text>
              <Text style={styles.previewText}>{durationLabel}</Text>
            </View>
            <View style={styles.previewPill}>
              <Text style={styles.previewEmoji}>🏁</Text>
              <Text style={styles.previewText}>
                {Math.floor(durationMins / 25.01)} checkpoint{Math.floor(durationMins / 25.01) !== 1 ? 's' : ''}
              </Text>
            </View>
            <View style={styles.previewPill}>
              <Text style={styles.previewEmoji}>🔥</Text>
              <Text style={styles.previewText}>{goal.trim() || 'set a goal'}</Text>
            </View>
          </View>

          {/* ── CTA ── */}
          <TouchableOpacity
            style={styles.ctaWrap}
            activeOpacity={0.88}
            onPress={handleConfirm}
          >
            <LinearGradient
              colors={goal.trim() ? ['#FF7830', '#EE4800'] : ['#3A2015', '#3A2015']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={styles.ctaGradient}
            >
              <Text style={[styles.ctaText, !goal.trim() && styles.ctaTextDisabled]}>
                Start Focusing
              </Text>
              <Text style={styles.ctaArrow}>›</Text>
            </LinearGradient>
          </TouchableOpacity>

        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Custom duration slider ────────────────────────────────────────────────────
// A simple touch-drag slider — no external deps needed
interface SliderProps { value: number; onChange: (v: number) => void; }

function DurationSlider({ value, onChange }: SliderProps) {
  const TRACK_W  = SW - 56;   // matches sheet padding
  const MIN_MINS = 5;
  const MAX_MINS = 120;
  const pct      = (value - MIN_MINS) / (MAX_MINS - MIN_MINS);
  const thumbX   = pct * TRACK_W;

  const handleTouch = (pageX: number, trackLeft: number) => {
    const relX = Math.max(0, Math.min(pageX - trackLeft, TRACK_W));
    const raw  = Math.round((relX / TRACK_W) * (MAX_MINS - MIN_MINS) + MIN_MINS);
    // Snap to 5-minute increments
    const snapped = Math.round(raw / 5) * 5;
    onChange(Math.max(MIN_MINS, Math.min(MAX_MINS, snapped)));
  };

  const trackRef     = useRef<View>(null);
  const trackLeft    = useRef(0);

  return (
    <View style={sliderStyles.wrap}>
      {/* Track */}
      <View
        ref={trackRef}
        style={sliderStyles.track}
        onLayout={e => {
          trackRef.current?.measure((_x, _y, _w, _h, px) => { trackLeft.current = px; });
        }}
        onStartShouldSetResponder={() => true}
        onMoveShouldSetResponder={() => true}
        onResponderGrant={e => handleTouch(e.nativeEvent.pageX, trackLeft.current)}
        onResponderMove={e => handleTouch(e.nativeEvent.pageX, trackLeft.current)}
      >
        {/* Filled portion */}
        <LinearGradient
          colors={['#FF6B1A', '#FFD166']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          style={[sliderStyles.fill, { width: thumbX }]}
        />
        {/* Thumb */}
        <View style={[sliderStyles.thumb, { left: thumbX - 12 }]}>
          <View style={sliderStyles.thumbInner} />
        </View>
      </View>

      {/* Labels */}
      <View style={sliderStyles.labels}>
        <Text style={sliderStyles.labelText}>5m</Text>
        <Text style={[sliderStyles.labelText, sliderStyles.labelValue]}>{value}m</Text>
        <Text style={sliderStyles.labelText}>2h</Text>
      </View>
    </View>
  );
}

const sliderStyles = StyleSheet.create({
  wrap:        { marginTop: 16, marginBottom: 4 },
  track:       { height: 5, backgroundColor: 'rgba(255,255,255,0.09)', borderRadius: 3, position: 'relative', marginHorizontal: 0 },
  fill:        { height: '100%', borderRadius: 3, position: 'absolute', left: 0, top: 0 },
  thumb:       { position: 'absolute', top: -10, width: 24, height: 24, borderRadius: 12, backgroundColor: '#FF6B1A', alignItems: 'center', justifyContent: 'center', shadowColor: '#FF6B1A', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.6, shadowRadius: 8, elevation: 6 },
  thumbInner:  { width: 8, height: 8, borderRadius: 4, backgroundColor: '#fff' },
  labels:      { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  labelText:   { fontFamily: FONTS.regular, fontSize: 11, color: 'rgba(255,244,230,0.30)' },
  labelValue:  { fontFamily: FONTS.bold,    fontSize: 12, color: COLORS.orange },
});

// ─── Main styles ──────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  flex:    { flex: 1, justifyContent: 'flex-end' },

  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(6,3,1,0.78)',
  },

  sheet: {
    backgroundColor: '#1C1009',
    borderTopLeftRadius:  28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    borderBottomWidth: 0,
    // Top glow
    shadowColor:   '#FF6B1A',
    shadowOffset:  { width: 0, height: -8 },
    shadowOpacity: 0.18,
    shadowRadius:  24,
    elevation:     24,
  },

  handle: {
    width: 38, height: 4, borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignSelf: 'center', marginBottom: 20,
  },

  sheetHeader: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 24,
  },
  sheetTitle: { fontFamily: FONTS.black, fontSize: 22, color: COLORS.cream, letterSpacing: -0.5 },
  closeBtn:   { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.07)', alignItems: 'center', justifyContent: 'center' },
  closeBtnText: { fontFamily: FONTS.bold, fontSize: 13, color: 'rgba(255,244,230,0.50)' },

  // Goal input
  fieldLabel: { fontFamily: FONTS.bold, fontSize: 12, color: 'rgba(255,244,230,0.40)', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 10 },
  goalInputWrap: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 14, borderWidth: 1.5,
    borderColor: 'rgba(255,107,26,0.25)',
    backgroundColor: 'rgba(255,107,26,0.06)',
    paddingHorizontal: 16,
  },
  goalInputWrapError: { borderColor: 'rgba(232,69,69,0.55)', backgroundColor: 'rgba(232,69,69,0.06)' },
  goalInput: {
    flex: 1, fontFamily: FONTS.regular, fontSize: 16,
    color: 'rgba(255,230,180,0.85)', letterSpacing: 0.3,
    paddingVertical: 15,
  },
  clearBtn:      { padding: 4 },
  clearBtnText:  { fontFamily: FONTS.regular, fontSize: 13, color: 'rgba(255,244,230,0.30)' },
  errorText:     { fontFamily: FONTS.regular, fontSize: 12, color: '#E84545', marginTop: 6, marginLeft: 2 },

  // Suggestions
  suggestionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  suggestionChip: {
    paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: 20, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  suggestionChipActive: { borderColor: COLORS.orange, backgroundColor: 'rgba(255,107,26,0.14)' },
  suggestionText:       { fontFamily: FONTS.regular, fontSize: 12, color: 'rgba(255,244,230,0.45)' },
  suggestionTextActive: { color: COLORS.orange, fontFamily: FONTS.bold },

  // Duration presets
  presetsRow:    { flexDirection: 'row', gap: 10, marginBottom: 4 },
  presetChip:    {
    flex: 1, alignItems: 'center', paddingVertical: 13,
    borderRadius: 12, borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.10)',
    backgroundColor: 'rgba(255,255,255,0.04)',
    overflow: 'hidden',
  },
  presetChipActive: { borderColor: 'transparent' },
  presetText:       { fontFamily: FONTS.bold, fontSize: 15, color: 'rgba(255,244,230,0.45)', letterSpacing: 0.3 },
  presetTextActive: { color: '#fff' },

  // Preview row
  previewRow:  { flexDirection: 'row', gap: 8, marginTop: 20, marginBottom: 20, flexWrap: 'wrap' },
  previewPill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 20, paddingHorizontal: 12, paddingVertical: 7,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  previewEmoji: { fontSize: 13 },
  previewText:  { fontFamily: FONTS.regular, fontSize: 12, color: 'rgba(255,244,230,0.55)', maxWidth: 120 },

  // CTA
  ctaWrap:        { borderRadius: 18, overflow: 'hidden', shadowColor: '#FF4400', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.45, shadowRadius: 18, elevation: 12 },
  ctaGradient:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 18, gap: 8 },
  ctaText:        { fontFamily: FONTS.black, fontSize: 18, color: '#fff', letterSpacing: 0.3 },
  ctaTextDisabled:{ color: 'rgba(255,244,230,0.30)' },
  ctaArrow:       { fontFamily: FONTS.bold, fontSize: 22, color: 'rgba(255,255,255,0.65)' },
});
