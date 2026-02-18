/**
 * Ember – SnakeGame.tsx
 *
 * WHERE THIS LIVES:
 *   app/(protected)/session/games/snake.tsx
 *
 * MECHANICS:
 *   - Classic snake on a grid
 *   - Swipe to change direction
 *   - Wraps around edges (no death from walls)
 *   - Self-collision = brief flash, snake resets to length 3 (no game over)
 *   - Food spawns randomly, eating grows snake by 2
 *   - Score = food eaten
 *   - Runs for 90s then auto-ends
 *   - Smooth: snake cells animate with slight scale pulse
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  PanResponder,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
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
import { useSessionStore, selectTimeDisplay } from '../../../../store/sessionStore';
import { COLORS, FONTS } from '../../../../theme';

const { width: SW } = Dimensions.get('window');

// ─── Grid constants ────────────────────────────────────────────────────────────
const COLS        = 18;
const ROWS        = 22;
const ARENA_W     = SW - 40;
const ARENA_H     = Math.round(ARENA_W * (ROWS / COLS));
const CELL_W      = ARENA_W  / COLS;
const CELL_H      = ARENA_H  / ROWS;
const GAME_MS     = 130;       // ms per tick (speed)
const GAME_SEC    = 90;

type Dir  = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
type Cell = { col: number; row: number };

function cellEq(a: Cell, b: Cell) { return a.col === b.col && a.row === b.row; }

function randomFood(snake: Cell[]): Cell {
  let c: Cell;
  do {
    c = { col: Math.floor(Math.random() * COLS), row: Math.floor(Math.random() * ROWS) };
  } while (snake.some(s => cellEq(s, c)));
  return c;
}

const INIT_SNAKE: Cell[] = [
  { col: 9, row: 11 },
  { col: 8, row: 11 },
  { col: 7, row: 11 },
];

export default function SnakeGame() {
  const insets      = useSafeAreaInsets();
  const sessionTime = useSessionStore(selectTimeDisplay);
  const completeCheckpoint = useSessionStore(s => s.completeCheckpoint);

  const [fontsLoaded] = useFonts({ Nunito_800ExtraBold, Nunito_700Bold, Nunito_400Regular });

  // ── Game state (all in refs for perf — only render-needed state in useState) ──
  const snakeRef  = useRef<Cell[]>([...INIT_SNAKE]);
  const dirRef    = useRef<Dir>('RIGHT');
  const nextDir   = useRef<Dir>('RIGHT');   // buffered next direction
  const foodRef   = useRef<Cell>(randomFood(INIT_SNAKE));
  const growRef   = useRef(0);              // pending cells to add

  const [renderSnake, setRenderSnake] = useState<Cell[]>([...INIT_SNAKE]);
  const [renderFood,  setRenderFood]  = useState<Cell>(foodRef.current);
  const [score,       setScore]       = useState(0);
  const [timeLeft,    setTimeLeft]    = useState(GAME_SEC);
  const [flashing,    setFlashing]    = useState(false); // collision flash

  const scoreRef = useRef(0);

  // ── Entry fade ─────────────────────────────────────────────────────────────
  const fadeIn    = useRef(new Animated.Value(0)).current;
  const flashAnim = useRef(new Animated.Value(0)).current;
  const scoreAnim = useRef(new Animated.Value(1)).current;
  const foodPulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(fadeIn, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    // Food pulse
    Animated.loop(Animated.sequence([
      Animated.timing(foodPulse, { toValue: 1.30, duration: 600, useNativeDriver: true }),
      Animated.timing(foodPulse, { toValue: 1.00, duration: 600, useNativeDriver: true }),
    ])).start();
  }, [fadeIn, foodPulse]);

  // ── Collision flash ────────────────────────────────────────────────────────
  const triggerFlash = useCallback(() => {
    setFlashing(true);
    Animated.sequence([
      Animated.timing(flashAnim, { toValue: 1, duration: 80,  useNativeDriver: true }),
      Animated.timing(flashAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => setFlashing(false));
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  }, [flashAnim]);

  // ── Score bump ─────────────────────────────────────────────────────────────
  const bumpScore = useCallback(() => {
    Animated.sequence([
      Animated.spring(scoreAnim, { toValue: 1.25, tension: 300, friction: 5, useNativeDriver: true }),
      Animated.spring(scoreAnim, { toValue: 1.00, tension: 200, friction: 6, useNativeDriver: true }),
    ]).start();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [scoreAnim]);

  // ── Game tick ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const tick = setInterval(() => {
      const snake = snakeRef.current;
      const dir   = nextDir.current;
      dirRef.current = dir;

      const head  = snake[0];
      let nCol = head.col;
      let nRow = head.row;

      if (dir === 'UP')    nRow -= 1;
      if (dir === 'DOWN')  nRow += 1;
      if (dir === 'LEFT')  nCol -= 1;
      if (dir === 'RIGHT') nCol += 1;

      // Wrap around edges
      nCol = (nCol + COLS) % COLS;
      nRow = (nRow + ROWS) % ROWS;

      const newHead = { col: nCol, row: nRow };

      // Self-collision check (skip the tail tip — it's about to move)
      const body = snake.slice(0, -1);
      if (body.some(c => cellEq(c, newHead))) {
        // Reset snake, no game over
        snakeRef.current = [...INIT_SNAKE];
        nextDir.current  = 'RIGHT';
        dirRef.current   = 'RIGHT';
        growRef.current  = 0;
        triggerFlash();
        setRenderSnake([...INIT_SNAKE]);
        return;
      }

      // Build new snake
      let newSnake = [newHead, ...snake];

      // Check food
      if (cellEq(newHead, foodRef.current)) {
        growRef.current += 2;
        scoreRef.current += 1;
        setScore(scoreRef.current);
        bumpScore();
        const newFood = randomFood(newSnake);
        foodRef.current = newFood;
        setRenderFood(newFood);
      }

      // Remove tail unless growing
      if (growRef.current > 0) {
        growRef.current -= 1;
      } else {
        newSnake = newSnake.slice(0, -1);
      }

      snakeRef.current = newSnake;
      setRenderSnake([...newSnake]);
    }, GAME_MS);

    return () => clearInterval(tick);
  }, [bumpScore, triggerFlash]);

  // ── Game timer ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const tick = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { clearInterval(tick); handleEnd(); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(tick);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleEnd = useCallback(async () => {
    await completeCheckpoint();
    router.replace('/session');
  }, [completeCheckpoint]);

  // ── Swipe detection ────────────────────────────────────────────────────────
  const swipeStart = useRef<{ x: number; y: number } | null>(null);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder:  () => true,
      onPanResponderGrant: (e) => {
        swipeStart.current = { x: e.nativeEvent.pageX, y: e.nativeEvent.pageY };
      },
      onPanResponderRelease: (e) => {
        if (!swipeStart.current) return;
        const dx = e.nativeEvent.pageX - swipeStart.current.x;
        const dy = e.nativeEvent.pageY - swipeStart.current.y;
        swipeStart.current = null;

        if (Math.abs(dx) < 10 && Math.abs(dy) < 10) return; // tap, ignore

        const cur = dirRef.current;
        if (Math.abs(dx) > Math.abs(dy)) {
          // Horizontal swipe
          if (dx > 0 && cur !== 'LEFT')  nextDir.current = 'RIGHT';
          if (dx < 0 && cur !== 'RIGHT') nextDir.current = 'LEFT';
        } else {
          // Vertical swipe
          if (dy > 0 && cur !== 'UP')   nextDir.current = 'DOWN';
          if (dy < 0 && cur !== 'DOWN') nextDir.current = 'UP';
        }
      },
    })
  ).current;

  const timeMM = Math.floor(timeLeft / 60).toString();
  const timeSS = (timeLeft % 60).toString().padStart(2, '0');
  const flashBg = flashAnim.interpolate({ inputRange: [0,1], outputRange: ['rgba(255,107,26,0)', 'rgba(255,107,26,0.18)'] });

  if (!fontsLoaded) return null;

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: '#0A0603' }]} />
      <View style={styles.bgBloom} />

      <Animated.View style={[styles.content, { opacity: fadeIn, paddingTop: insets.top + 20 }]}>

        {/* ── Top bar ── */}
        <View style={styles.topBar}>
          <View style={styles.topBarLeft}>
            <Text style={styles.topBarIcon}>🐍</Text>
            <Text style={styles.topBarLabel}>SNAKE</Text>
          </View>
          <TouchableOpacity style={styles.endBtn} onPress={handleEnd} activeOpacity={0.75}>
            <Text style={styles.endBtnText}>End break ›</Text>
          </TouchableOpacity>
        </View>

        {/* ── Score + time row ── */}
        <View style={styles.statsRow}>
          <View>
            <Text style={styles.statSubLabel}>SCORE</Text>
            <Animated.Text style={[styles.scoreVal, { transform: [{ scale: scoreAnim }] }]}>
              {score}
            </Animated.Text>
          </View>
          <View style={styles.sessionPill}>
            <View style={styles.sessionDot} />
            <Text style={styles.sessionTime}>{sessionTime}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.statSubLabel}>TIME</Text>
            <Text style={styles.timeVal}>{timeMM}:{timeSS}</Text>
          </View>
        </View>

        {/* ── Arena ── */}
        <View
          style={styles.arena}
          {...panResponder.panHandlers}
        >
          {/* Flash overlay */}
          <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: flashBg, zIndex: 10, borderRadius: 18 }]} pointerEvents="none" />

          {/* Grid dots (subtle) */}
          {Array.from({ length: COLS * ROWS }).map((_, i) => {
            const col = i % COLS;
            const row = Math.floor(i / COLS);
            return (
              <View
                key={i}
                style={{
                  position:        'absolute',
                  left:            col * CELL_W + CELL_W / 2 - 1,
                  top:             row * CELL_H + CELL_H / 2 - 1,
                  width:           2,
                  height:          2,
                  borderRadius:    1,
                  backgroundColor: 'rgba(255,255,255,0.04)',
                }}
              />
            );
          })}

          {/* Food */}
          <Animated.View style={[
            styles.food,
            {
              left:      renderFood.col * CELL_W + 2,
              top:       renderFood.row * CELL_H + 2,
              width:     CELL_W - 4,
              height:    CELL_H - 4,
              transform: [{ scale: foodPulse }],
            },
          ]} />

          {/* Snake segments */}
          {renderSnake.map((cell, i) => {
            const isHead = i === 0;
            const pct    = 1 - (i / renderSnake.length) * 0.55;   // head brightest

            return (
              <View
                key={`${cell.col}-${cell.row}-${i}`}
                style={[
                  styles.snakeCell,
                  {
                    left:            cell.col * CELL_W + 1,
                    top:             cell.row * CELL_H + 1,
                    width:           CELL_W - 2,
                    height:          CELL_H - 2,
                    borderRadius:    isHead ? 6 : 4,
                    backgroundColor: isHead
                      ? '#FF8833'
                      : `rgba(255,${Math.round(107 + pct * 60)},${Math.round(26 + pct * 10)},${pct.toFixed(2)})`,
                    shadowColor:     isHead ? '#FF6B1A' : 'transparent',
                    shadowOpacity:   isHead ? 0.80 : 0,
                    shadowRadius:    isHead ? 8    : 0,
                  },
                ]}
              >
                {isHead && (
                  <>
                    {/* Eyes */}
                    <View style={[styles.eye, styles.eyeLeft,  dirRef.current === 'UP'   || dirRef.current === 'DOWN' ? styles.eyeVertL : {}]} />
                    <View style={[styles.eye, styles.eyeRight, dirRef.current === 'UP'   || dirRef.current === 'DOWN' ? styles.eyeVertR : {}]} />
                  </>
                )}
              </View>
            );
          })}
        </View>

        {/* ── Swipe hint ── */}
        <View style={styles.hint}>
          <Text style={styles.hintText}>Swipe to steer · wraps around edges · no game over</Text>
        </View>

      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0A0603' },

  bgBloom: {
    position: 'absolute', top: '10%', alignSelf: 'center',
    width: SW * 0.9, height: SW * 0.9, borderRadius: SW * 0.45,
    backgroundColor: 'transparent',
    shadowColor: '#FF6B1A', shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.20, shadowRadius: 120, elevation: 0,
  },

  content: { flex: 1, paddingHorizontal: 20 },

  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  topBarLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  topBarIcon: { fontSize: 16 },
  topBarLabel: { fontFamily: FONTS.regular, fontSize: 11, letterSpacing: 3, color: 'rgba(255,244,230,0.38)', textTransform: 'uppercase' },
  endBtn: { backgroundColor: 'rgba(255,255,255,0.07)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8 },
  endBtnText: { fontFamily: FONTS.bold, fontSize: 13, color: 'rgba(255,244,230,0.60)' },

  statsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  statSubLabel: { fontFamily: FONTS.regular, fontSize: 10, letterSpacing: 2, color: 'rgba(255,244,230,0.30)', textTransform: 'uppercase', marginBottom: 2 },
  scoreVal: { fontFamily: FONTS.black, fontSize: 38, color: COLORS.cream, letterSpacing: -1 },
  timeVal:  { fontFamily: FONTS.black, fontSize: 28, color: COLORS.orange, letterSpacing: 0 },

  sessionPill: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,107,26,0.10)', borderWidth: 1, borderColor: 'rgba(255,107,26,0.20)', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  sessionDot:  { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.orange },
  sessionTime: { fontFamily: FONTS.bold, fontSize: 13, color: COLORS.orange },

  arena: {
    width: ARENA_W, height: ARENA_H,
    backgroundColor: 'rgba(255,255,255,0.025)',
    borderRadius: 18, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
    overflow: 'hidden', marginBottom: 14, position: 'relative',
  },

  // Food
  food: {
    position: 'absolute', borderRadius: 99,
    backgroundColor: '#FFD166',
    shadowColor: '#FFD166', shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.90, shadowRadius: 10, elevation: 6,
  },

  // Snake
  snakeCell: { position: 'absolute' },
  eye: {
    position: 'absolute', width: 3, height: 3, borderRadius: 1.5,
    backgroundColor: '#1A0603',
  },
  eyeLeft:  { top: '25%', left: '22%' },
  eyeRight: { top: '25%', right: '22%' },
  eyeVertL: { top: '22%', left: '30%' },
  eyeVertR: { top: '22%', right: '30%' },

  // Hint
  hint: {
    backgroundColor: 'rgba(255,107,26,0.07)', borderWidth: 1,
    borderColor: 'rgba(255,107,26,0.15)', borderRadius: 14,
    paddingVertical: 12, paddingHorizontal: 18, alignItems: 'center',
  },
  hintText: { fontFamily: FONTS.regular, fontSize: 13, color: 'rgba(255,244,230,0.40)', textAlign: 'center' },
});
