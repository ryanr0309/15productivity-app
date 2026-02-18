/**
 * Ember – StackBlocksGame.tsx
 *
 * WHERE THIS LIVES:
 *   app/(protected)/session/games/stack.tsx
 *
 * GAME MECHANICS:
 *   - A block slides left↔right at increasing speed each drop
 *   - Tap "TAP TO DROP" to drop it onto the stack
 *   - The overlap with the block below becomes the new block width
 *   - The overhanging portion is cut off (shown briefly then falls away)
 *   - Perfect drop (within 6px) = bonus, no trimming
 *   - If block misses entirely → game over, return to session
 *   - 5 successful drops = game complete → return to session
 *   - Accuracy = average(overlap% per drop)
 *
 * VISUAL:
 *   - Stack grows upward from the bottom of the arena
 *   - Each block is a slightly different green shade
 *   - Moving block glows brighter than placed blocks
 *   - Block widths shrink as accuracy drops — fun visual feedback
 *   - "Trim" animation: cut piece slides off and fades
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  StatusBar,
} from 'react-native';
import {
  useFonts,
  Nunito_800ExtraBold,
  Nunito_700Bold,
  Nunito_400Regular,
} from '@expo-google-fonts/nunito';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useSessionStore } from '../../../../store/sessionStore';
import { FONTS } from '../../../../theme';

const { width: SW } = Dimensions.get('window');

// ─── Layout constants ─────────────────────────────────────────────────────────
const ARENA_H        = Math.round(SW * 0.78);
const ARENA_W        = SW - 40;
const BLOCK_H        = 24;
const BLOCK_GAP      = 3;          // vertical gap between blocks
const INITIAL_W      = Math.round(ARENA_W * 0.55);
const PERFECT_THRESH = 8;          // px overlap tolerance for "perfect"
const TOTAL_DROPS    = 10;
const BASE_SPEED_MS  = 1600;       // ms for one full traversal at drop 1
const SPEED_STEP_MS  = 140;        // gets faster each drop

// Block greens — gets brighter toward the top of the stack
const BLOCK_COLORS = [
  { fill: '#1A3A22', shadow: '#2A6644' },
  { fill: '#1E4228', shadow: '#33774E' },
  { fill: '#224A2E', shadow: '#3A8858' },
  { fill: '#275434', shadow: '#44AA66' },
  { fill: '#2D5E3A', shadow: '#55BB77' },
  { fill: '#339944', shadow: '#66DD88' },
];

// ─── Types ────────────────────────────────────────────────────────────────────
interface PlacedBlock {
  id:     number;
  x:      number;   // left edge in arena coords
  width:  number;
  colorIdx: number;
  // Per-block animation for placement bounce
  scaleY: Animated.Value;
  opacity: Animated.Value;
}

interface TrimPiece {
  id:     number;
  x:      number;
  width:  number;
  side:   'left' | 'right';
  anim:   Animated.Value;  // 0→1: falls and fades
}

export default function StackBlocksGame() {
  const insets = useSafeAreaInsets();
  const completeCheckpoint = useSessionStore(s => s.completeCheckpoint);

  const [fontsLoaded] = useFonts({
    Nunito_800ExtraBold,
    Nunito_700Bold,
    Nunito_400Regular,
  });

  // ── Game state ─────────────────────────────────────────────────────────────
  const [dropsDone,   setDropsDone]   = useState(0);
  const [placed,      setPlaced]      = useState<PlacedBlock[]>([]);
  const [trimPieces,  setTrimPieces]  = useState<TrimPiece[]>([]);
  const [accuracy,    setAccuracy]    = useState(100);
  const [gameOver,    setGameOver]    = useState(false);
  const [gameWon,     setGameWon]     = useState(false);
  const [lastPerfect, setLastPerfect] = useState(false);

  // Moving block state
  const [movingW,    setMovingW]    = useState(INITIAL_W);
  const movingX      = useRef(new Animated.Value(0)).current;   // left edge
  const movingXJS    = useRef(0);
  const movingWRef   = useRef(INITIAL_W);
  const dirRef       = useRef<1 | -1>(1);   // current travel direction
  const speedRef     = useRef(BASE_SPEED_MS);
  const animRef      = useRef<Animated.CompositeAnimation | null>(null);
  const isDropping   = useRef(false);

  // Accuracy tracking
  const totalOverlapPct = useRef(0);
  const dropsRef        = useRef(0);

  // ── Entry fade ─────────────────────────────────────────────────────────────
  const fadeIn = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(fadeIn, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, [fadeIn]);

  // ── Sync movingX to JS thread ──────────────────────────────────────────────
  useEffect(() => {
    const id = movingX.addListener(({ value }) => { movingXJS.current = value; });
    return () => movingX.removeListener(id);
  }, [movingX]);

  // ── Initialise: place foundation block ────────────────────────────────────
  useEffect(() => {
    const foundationX = (ARENA_W - INITIAL_W) / 2;
    const foundation: PlacedBlock = {
      id:       0,
      x:        foundationX,
      width:    INITIAL_W,
      colorIdx: 0,
      scaleY:   new Animated.Value(1),
      opacity:  new Animated.Value(1),
    };
    setPlaced([foundation]);
  }, []);

  // ── Start moving block ─────────────────────────────────────────────────────
  const startMoving = useCallback((blockWidth: number, speedMs: number) => {
    isDropping.current = false;
    movingWRef.current = blockWidth;
    setMovingW(blockWidth);

    // Start from left edge, travel right then bounce
    movingX.setValue(0);
    dirRef.current = 1;

    const bounce = () => {
      const maxX = ARENA_W - movingWRef.current;
      const toX  = dirRef.current === 1 ? maxX : 0;

      animRef.current = Animated.timing(movingX, {
        toValue:         toX,
        duration:        speedMs,
        easing:          Easing.linear,
        useNativeDriver: false,
      });

      animRef.current.start(({ finished }) => {
        if (!finished || isDropping.current) return;
        dirRef.current = dirRef.current === 1 ? -1 : 1;
        bounce();
      });
    };

    bounce();
  }, [movingX]);

  // Start moving when placed blocks are set
  useEffect(() => {
    if (placed.length === 0 || gameOver || gameWon) return;
    const currentW = placed.length > 0 ? placed[placed.length - 1].width : INITIAL_W;
    const speed    = Math.max(BASE_SPEED_MS - dropsDone * SPEED_STEP_MS, 700);
    speedRef.current = speed;
    startMoving(Math.min(currentW, INITIAL_W), speed);  // moving block ≤ top of stack
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [placed.length, gameOver, gameWon]);

  // ── Handle drop ────────────────────────────────────────────────────────────
  const handleDrop = useCallback(() => {
    if (isDropping.current || gameOver || gameWon || placed.length === 0) return;
    isDropping.current = true;

    // Stop moving animation
    animRef.current?.stop();

    const topBlock  = placed[placed.length - 1];
    const curX      = movingXJS.current;
    const curW      = movingWRef.current;

    // Calculate overlap
    const overlapLeft  = Math.max(curX, topBlock.x);
    const overlapRight = Math.min(curX + curW, topBlock.x + topBlock.width);
    const overlapW     = overlapRight - overlapLeft;

    // Missed entirely
    if (overlapW <= 0) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setGameOver(true);
      setTimeout(() => handleEnd(), 800);
      return;
    }

    const isPerfect = Math.abs(overlapW - curW) <= PERFECT_THRESH
                   && Math.abs(overlapW - topBlock.width) <= PERFECT_THRESH;

    const newWidth  = isPerfect ? Math.min(curW, topBlock.width) : overlapW;
    const newX      = isPerfect ? topBlock.x + (topBlock.width - newWidth) / 2 : overlapLeft;

    // Accuracy
    const pct = Math.round((newWidth / curW) * 100);
    totalOverlapPct.current += pct;
    dropsRef.current         += 1;
    const avgAcc = Math.round(totalOverlapPct.current / dropsRef.current);
    setAccuracy(avgAcc);

    // Haptic
    if (isPerfect) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setLastPerfect(true);
      setTimeout(() => setLastPerfect(false), 800);
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setLastPerfect(false);
    }

    // Create trim pieces
    const newTrims: TrimPiece[] = [];
    if (!isPerfect) {
      // Left trim
      if (curX < overlapLeft) {
        newTrims.push({ id: Date.now(), x: curX, width: overlapLeft - curX, side: 'left',  anim: new Animated.Value(0) });
      }
      // Right trim
      if (curX + curW > overlapRight) {
        newTrims.push({ id: Date.now() + 1, x: overlapRight, width: (curX + curW) - overlapRight, side: 'right', anim: new Animated.Value(0) });
      }
    }

    // Animate trim pieces falling
    if (newTrims.length > 0) {
      setTrimPieces(prev => [...prev, ...newTrims]);
      newTrims.forEach(t => {
        Animated.timing(t.anim, { toValue: 1, duration: 500, easing: Easing.in(Easing.quad), useNativeDriver: true }).start(() => {
          setTrimPieces(prev => prev.filter(p => p.id !== t.id));
        });
      });
    }

    // Place new block
    const newBlock: PlacedBlock = {
      id:       Date.now() + 2,
      x:        newX,
      width:    newWidth,
      colorIdx: Math.min(placed.length, BLOCK_COLORS.length - 1),
      scaleY:   new Animated.Value(0.5),
      opacity:  new Animated.Value(1),
    };

    // Placement bounce
    Animated.spring(newBlock.scaleY, { toValue: 1, tension: 280, friction: 6, useNativeDriver: true }).start();

    const newDrops = dropsDone + 1;
    setDropsDone(newDrops);
    setPlaced(prev => [...prev, newBlock]);

    if (newDrops >= TOTAL_DROPS) {
      setGameWon(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setTimeout(() => handleEnd(), 1200);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [placed, dropsDone, gameOver, gameWon]);

  const handleEnd = useCallback(async () => {
    await completeCheckpoint();
    router.replace('/session');
  }, [completeCheckpoint]);

  // ── Derive block positions in arena (stack grows upward) ──────────────────
  // Bottom of arena = bottom of stack. Each block sits on top of the previous.
  const stackBottomY = ARENA_H - 20; // y of bottom of bottom block (from arena top)

  if (!fontsLoaded) return null;

  const accuracyColor = accuracy >= 80 ? '#66DD99' : accuracy >= 50 ? '#FFAA33' : '#FF6B1A';

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: '#080E06' }]} />
      <View style={styles.bgBloom} />

      <Animated.View style={[styles.content, { opacity: fadeIn, paddingTop: insets.top + 20 }]}>

        {/* ── Top bar ── */}
        <View style={styles.topBar}>
          <View style={styles.topBarLeft}>
            <Text style={styles.topBarIcon}>📦</Text>
            <Text style={styles.topBarLabel}>STACK THE BLOCKS</Text>
          </View>
          <TouchableOpacity style={styles.endBtn} onPress={handleEnd} activeOpacity={0.75}>
            <Text style={styles.endBtnText}>End break ›</Text>
          </TouchableOpacity>
        </View>

        {/* ── Score row ── */}
        <View style={styles.scoreRow}>
          <View>
            <Text style={styles.scoreValue}>{dropsDone}</Text>
            <Text style={styles.scoreLabel}>/ {TOTAL_DROPS} drops</Text>
          </View>
          <View style={styles.accuracyWrap}>
            <Text style={styles.accuracyLabel}>ACCURACY</Text>
            <Text style={[styles.accuracyValue, { color: accuracyColor }]}>{accuracy}%</Text>
          </View>
        </View>

        {/* ── Arena ── */}
        <View style={styles.arena}>
          {/* Inner green glow */}
          <View style={styles.arenaGlow} />

          {/* Placed blocks — rendered bottom-up */}
          {placed.map((block, i) => {
            const blockY = stackBottomY - i * (BLOCK_H + BLOCK_GAP) - BLOCK_H;
            const color  = BLOCK_COLORS[block.colorIdx];
            return (
              <Animated.View
                key={block.id}
                style={[
                  styles.block,
                  {
                    left:    block.x,
                    top:     blockY,
                    width:   block.width,
                    height:  BLOCK_H,
                    backgroundColor: color.fill,
                    shadowColor:     color.shadow,
                    transform:       [{ scaleY: block.scaleY }],
                    opacity:         block.opacity,
                  },
                ]}
              >
                {/* Top highlight edge */}
                <View style={[styles.blockHighlight, { backgroundColor: color.shadow }]} />
              </Animated.View>
            );
          })}

          {/* Trim pieces falling */}
          {trimPieces.map(t => {
            const topIdx  = placed.length - 1;
            const blockY  = stackBottomY - topIdx * (BLOCK_H + BLOCK_GAP) - BLOCK_H;
            const fallY   = t.anim.interpolate({ inputRange: [0, 1], outputRange: [0,  80] });
            const opacity = t.anim.interpolate({ inputRange: [0, 0.4, 1], outputRange: [0.8, 0.5, 0] });
            const rotate  = t.anim.interpolate({
              inputRange:  [0, 1],
              outputRange: [t.side === 'left' ? '0deg' : '0deg', t.side === 'left' ? '-25deg' : '25deg'],
            });
            return (
              <Animated.View
                key={t.id}
                style={[
                  styles.block,
                  styles.trimBlock,
                  {
                    left:            t.x,
                    top:             blockY,
                    width:           t.width,
                    height:          BLOCK_H,
                    backgroundColor: BLOCK_COLORS[Math.min(placed.length - 1, BLOCK_COLORS.length - 1)].fill,
                    opacity,
                    transform:       [{ translateY: fallY }, { rotate }],
                  },
                ]}
              />
            );
          })}

          {/* Moving block */}
          {!gameOver && !gameWon && (
            <Animated.View style={[
              styles.block,
              styles.movingBlock,
              {
                left:   movingX,
                top:    stackBottomY - placed.length * (BLOCK_H + BLOCK_GAP) - BLOCK_H,
                width:  movingW,
                height: BLOCK_H,
              },
            ]}>
              <View style={styles.movingHighlight} />
            </Animated.View>
          )}

          {/* Perfect flash label */}
          {lastPerfect && (
            <View style={styles.perfectBadge}>
              <Text style={styles.perfectText}>PERFECT ✦</Text>
            </View>
          )}

          {/* Game over label */}
          {gameOver && (
            <View style={styles.gameOverWrap}>
              <Text style={styles.gameOverText}>Missed!</Text>
            </View>
          )}

          {/* Game won label */}
          {gameWon && (
            <View style={styles.gameWonWrap}>
              <Text style={styles.gameWonText}>🎯 Done!</Text>
            </View>
          )}
        </View>

        {/* ── Drop button ── */}
        <TouchableOpacity
          style={[styles.dropBtn, (gameOver || gameWon) && styles.dropBtnDisabled]}
          onPress={handleDrop}
          activeOpacity={0.85}
          disabled={gameOver || gameWon}
        >
          <Text style={[styles.dropBtnText, (gameOver || gameWon) && styles.dropBtnTextDisabled]}>
            {gameWon ? 'COMPLETE! 🎯' : gameOver ? 'MISSED...' : 'TAP TO DROP'}
          </Text>
        </TouchableOpacity>

        {/* ── Hint ── */}
        <View style={styles.hint}>
          <Text style={styles.hintText}>
            Perfect timing = full block · {TOTAL_DROPS} drops then done 🎯
          </Text>
        </View>

      </Animated.View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#080E06' },

  bgBloom: {
    position:        'absolute',
    bottom:          '20%',
    alignSelf:       'center',
    width:           SW * 0.8,
    height:          SW * 0.8,
    borderRadius:    SW * 0.4,
    backgroundColor: 'transparent',
    shadowColor:     '#44AA66',
    shadowOffset:    { width: 0, height: 0 },
    shadowOpacity:   0.28,
    shadowRadius:    110,
    elevation:       0,
  },

  content: {
    flex:              1,
    paddingHorizontal: 20,
  },

  // Top bar
  topBar: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
    marginBottom:   20,
  },
  topBarLeft:  { flexDirection: 'row', alignItems: 'center', gap: 8 },
  topBarIcon:  { fontSize: 14 },
  topBarLabel: {
    fontFamily:    FONTS.regular,
    fontSize:      11,
    letterSpacing: 3,
    color:         'rgba(255,244,230,0.38)',
    textTransform: 'uppercase',
  },
  endBtn: {
    backgroundColor:   'rgba(255,255,255,0.07)',
    borderWidth:       1,
    borderColor:       'rgba(255,255,255,0.12)',
    borderRadius:      20,
    paddingHorizontal: 16,
    paddingVertical:    8,
  },
  endBtnText: {
    fontFamily: FONTS.bold,
    fontSize:   13,
    color:      'rgba(255,244,230,0.60)',
  },

  // Score row
  scoreRow: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'flex-end',
    marginBottom:   16,
  },
  scoreValue: {
    fontFamily:    FONTS.black,
    fontSize:      56,
    color:         '#E8F4E8',
    letterSpacing: -2,
    lineHeight:    58,
  },
  scoreLabel: {
    fontFamily: FONTS.regular,
    fontSize:   14,
    color:      'rgba(200,240,200,0.40)',
    marginTop:  -4,
  },
  accuracyWrap:  { alignItems: 'flex-end' },
  accuracyLabel: {
    fontFamily:    FONTS.regular,
    fontSize:      11,
    letterSpacing: 2,
    color:         'rgba(200,240,200,0.35)',
    textTransform: 'uppercase',
    marginBottom:  4,
  },
  accuracyValue: {
    fontFamily:    FONTS.black,
    fontSize:      28,
    letterSpacing: -0.5,
  },

  // Arena
  arena: {
    width:           ARENA_W,
    height:          ARENA_H,
    backgroundColor: 'rgba(255,255,255,0.025)',
    borderRadius:    18,
    borderWidth:     1,
    borderColor:     'rgba(100,200,120,0.10)',
    overflow:        'hidden',
    marginBottom:    16,
    position:        'relative',
  },
  arenaGlow: {
    position:        'absolute',
    bottom:          0,
    left:            '15%',
    width:           '70%',
    height:          180,
    backgroundColor: 'transparent',
    shadowColor:     '#44AA66',
    shadowOffset:    { width: 0, height: 0 },
    shadowOpacity:   0.35,
    shadowRadius:    60,
    elevation:       0,
  },

  // Blocks
  block: {
    position:     'absolute',
    borderRadius: 5,
    overflow:     'hidden',
    shadowColor:  '#44AA66',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.40,
    shadowRadius:  8,
    elevation:     4,
  },
  blockHighlight: {
    position: 'absolute',
    top:      0,
    left:     0,
    right:    0,
    height:   3,
    opacity:  0.50,
    borderTopLeftRadius:  5,
    borderTopRightRadius: 5,
  },
  trimBlock: {
    zIndex:        10,
    shadowOpacity: 0,
    elevation:     0,
  },

  // Moving block
  movingBlock: {
    backgroundColor: '#3DBE5C',
    shadowColor:     '#66FF88',
    shadowOpacity:   0.70,
    shadowRadius:    14,
    elevation:       10,
    zIndex:          5,
  },
  movingHighlight: {
    position:            'absolute',
    top:                 0,
    left:                0,
    right:               0,
    height:              4,
    backgroundColor:     '#88FFAA',
    opacity:             0.60,
    borderTopLeftRadius:  5,
    borderTopRightRadius: 5,
  },

  // Perfect badge
  perfectBadge: {
    position:          'absolute',
    top:               '35%',
    alignSelf:         'center',
    left:              0, right: 0,
    alignItems:        'center',
  },
  perfectText: {
    fontFamily:       FONTS.black,
    fontSize:         18,
    color:            '#88FFAA',
    letterSpacing:    2,
    textShadowColor:  'rgba(100,255,150,0.60)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },

  // Game over / won
  gameOverWrap: {
    position:       'absolute',
    inset:          0,
    alignItems:     'center',
    justifyContent: 'center',
  },
  gameOverText: {
    fontFamily: FONTS.black,
    fontSize:   32,
    color:      '#FF6655',
    letterSpacing: 1,
  },
  gameWonWrap: {
    position:       'absolute',
    inset:          0,
    alignItems:     'center',
    justifyContent: 'center',
  },
  gameWonText: {
    fontFamily: FONTS.black,
    fontSize:   32,
    color:      '#88FFAA',
    letterSpacing: 1,
  },

  // Drop button
  dropBtn: {
    backgroundColor: '#3DBE5C',
    borderRadius:    18,
    paddingVertical: 22,
    alignItems:      'center',
    marginBottom:    14,
    shadowColor:     '#44DD77',
    shadowOffset:    { width: 0, height: 8 },
    shadowOpacity:   0.45,
    shadowRadius:    18,
    elevation:       12,
  },
  dropBtnDisabled: {
    backgroundColor: 'rgba(61,190,92,0.25)',
    shadowOpacity:   0,
    elevation:       0,
  },
  dropBtnText: {
    fontFamily:    FONTS.black,
    fontSize:      20,
    color:         '#072010',
    letterSpacing: 2,
  },
  dropBtnTextDisabled: {
    color: 'rgba(200,240,200,0.35)',
  },

  // Hint
  hint: {
    backgroundColor: 'rgba(68,170,102,0.08)',
    borderWidth:     1,
    borderColor:     'rgba(68,170,102,0.18)',
    borderRadius:    14,
    paddingVertical:   12,
    paddingHorizontal: 18,
    alignItems:      'center',
    marginBottom:    8,
  },
  hintText: {
    fontFamily: FONTS.regular,
    fontSize:   13,
    color:      'rgba(140,220,160,0.65)',
    textAlign:  'center',
  },
});
