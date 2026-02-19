/**
 * components/BreakStatusBar.tsx
 *
 * Shows two pills side by side during a checkpoint break:
 *   🔥 Session running  17:32   |   ⏱ Break left  01:24
 *
 * The break pill drains orange → red as time runs out.
 * Below 30s: break pill pulses red as urgency cue.
 *
 * USAGE — drop into any game screen or game-select:
 *   import { BreakStatusBar } from '../../../../components/BreakStatusBar';
 *   ...
 *   <BreakStatusBar />
 *
 * That's it. No props needed — reads everything from the store.
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  useSessionStore,
  selectTimeDisplay,
  CHECKPOINT_BREAK_SEC,
} from '../store/sessionStore';
import { COLORS, FONTS } from '../theme';

export function BreakStatusBar() {
  const sessionTime    = useSessionStore(selectTimeDisplay);
  const breakStartedAt = useSessionStore(s => s.breakStartedAt);

  // Live break remaining — ticks every second
  const [breakRem, setBreakRem] = useState(CHECKPOINT_BREAK_SEC);

  useEffect(() => {
    const tick = setInterval(() => {
      const bsa = useSessionStore.getState().breakStartedAt;
      if (!bsa) { setBreakRem(CHECKPOINT_BREAK_SEC); return; }
      const elapsed = Math.floor((Date.now() - bsa) / 1000);
      setBreakRem(Math.max(CHECKPOINT_BREAK_SEC - elapsed, 0));
    }, 500);
    return () => clearInterval(tick);
  }, []);

  // Sync immediately when breakStartedAt changes
  useEffect(() => {
    if (!breakStartedAt) { setBreakRem(CHECKPOINT_BREAK_SEC); return; }
    const elapsed = Math.floor((Date.now() - breakStartedAt) / 1000);
    setBreakRem(Math.max(CHECKPOINT_BREAK_SEC - elapsed, 0));
  }, [breakStartedAt]);

  // ── Pulse animation when < 30s left ──────────────────────────────────────
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pulseRef  = useRef<Animated.CompositeAnimation | null>(null);
  const isUrgent  = breakRem <= 30 && breakRem > 0;

  useEffect(() => {
    if (isUrgent) {
      pulseRef.current = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 0.55, duration: 500, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1.00, duration: 500, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        ])
      );
      pulseRef.current.start();
    } else {
      pulseRef.current?.stop();
      pulseAnim.setValue(1);
    }
    return () => pulseRef.current?.stop();
  }, [isUrgent, pulseAnim]);

  // ── Derived values ────────────────────────────────────────────────────────
  const mm = Math.floor(breakRem / 60).toString().padStart(2, '0');
  const ss = (breakRem % 60).toString().padStart(2, '0');
  const pct = breakRem / CHECKPOINT_BREAK_SEC;  // 1 → 0 as time drains

  // Color shifts orange → red as time runs out
  const breakColor = isUrgent
    ? '#FF4444'
    : breakRem <= 60
    ? '#FF8833'
    : COLORS.orange;

  const breakBg = isUrgent
    ? 'rgba(255,68,68,0.12)'
    : 'rgba(255,107,26,0.10)';

  const breakBorder = isUrgent
    ? 'rgba(255,68,68,0.28)'
    : 'rgba(255,107,26,0.22)';

  return (
    <View style={styles.row}>

      {/* ── Session pill ── */}
      <View style={styles.sessionPill}>
        <View style={styles.sessionDot} />
        <Text style={styles.sessionLabel}>Session</Text>
        <Text style={styles.sessionTime}>{sessionTime}</Text>
      </View>

      {/* ── Break pill ── */}
      <Animated.View style={[
        styles.breakPill,
        {
          backgroundColor: breakBg,
          borderColor:     breakBorder,
          opacity:         pulseAnim,
        },
      ]}>
        {/* Draining fill bar inside the pill */}
        <View style={styles.breakPillFill}>
          <View style={[
            styles.breakFillTrack,
            { borderColor: breakBorder },
          ]}>
            <View style={[
              styles.breakFillBar,
              {
                width:           `${Math.round(pct * 100)}%` as `${number}%`,
                backgroundColor: breakColor,
              },
            ]} />
          </View>
        </View>

        <View style={styles.breakContent}>
          <Text style={styles.breakIcon}>⏱</Text>
          <Text style={styles.breakLabel}>Break  </Text>
          <Text style={[styles.breakTime, { color: breakColor }]}>
            {mm}:{ss}
          </Text>
        </View>
      </Animated.View>

    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection:  'row',
    gap:            8,
    marginBottom:   18,
    alignItems:     'center',
  },

  // Session pill
  sessionPill: {
    flex:              1,
    flexDirection:     'row',
    alignItems:        'center',
    gap:               7,
    backgroundColor:   'rgba(255,255,255,0.05)',
    borderWidth:       1,
    borderColor:       'rgba(255,255,255,0.09)',
    borderRadius:      12,
    paddingHorizontal: 12,
    paddingVertical:    9,
  },
  sessionDot: {
    width:           6,
    height:          6,
    borderRadius:    3,
    backgroundColor: COLORS.orange,
  },
  sessionLabel: {
    fontFamily: FONTS.regular,
    fontSize:   12,
    color:      'rgba(255,244,230,0.40)',
    flex:       1,
  },
  sessionTime: {
    fontFamily:    FONTS.bold,
    fontSize:      13,
    color:         COLORS.cream,
    letterSpacing: 0.5,
  },

  // Break pill
  breakPill: {
    flex:              1,
    borderWidth:       1,
    borderRadius:      12,
    overflow:          'hidden',
    position:          'relative',
  },
  breakPillFill: {
    position:    'absolute',
    top:         0, left: 0, right: 0, bottom: 0,
    paddingHorizontal: 0,
  },
  breakFillTrack: {
    flex:              1,
    borderRadius:      12,
    overflow:          'hidden',
  },
  breakFillBar: {
    height:   '100%',
    opacity:  0.14,
    minWidth: 4,
  },
  breakContent: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               5,
    paddingHorizontal: 12,
    paddingVertical:    9,
    position:          'relative',
    zIndex:            1,
  },
  breakIcon:  {
    fontSize: 11,
  },
  breakLabel: {
    fontFamily: FONTS.regular,
    fontSize:   12,
    color:      'rgba(255,244,230,0.40)',
    flex:       1,
  },
  breakTime: {
    fontFamily:    FONTS.bold,
    fontSize:      13,
    letterSpacing: 0.5,
  },
});
