/**
 * Ember – TraceThePathGame.tsx
 *
 * WHERE THIS LIVES:
 *   app/(protected)/session/games/trace.tsx
 *
 * GAME MECHANICS:
 *   - A sine-wave path is drawn across the canvas
 *   - A glowing dot travels along the path automatically
 *   - Player holds finger on the canvas and tries to follow the dot
 *   - Every frame we measure distance from finger to dot
 *   - "On path" % = frames within tolerance / total tracking frames
 *   - Loop completes each time the dot reaches the end and resets
 *   - No win/lose — just flow. Runs for 90s then returns to session.
 *
 * IMPLEMENTATION:
 *   - Path defined as an array of {x,y} points sampled from a sine curve
 *   - Dot position animated via Animated.Value (0→1 = start→end of path)
 *   - Touch position tracked via PanResponder
 *   - Distance check runs every 100ms via interval
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  PanResponder,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  StatusBar,
} from 'react-native';
import Svg, {
  Circle,
  Defs,
  LinearGradient as SvgGrad,
  Path,
  Stop,
  G,
} from 'react-native-svg';
import {
  useFonts,
  Nunito_800ExtraBold,
  Nunito_700Bold,
  Nunito_400Regular,
} from '@expo-google-fonts/nunito';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  useSessionStore,
  selectTimeDisplay,
} from '../../../../store/sessionStore';
import { COLORS, FONTS } from '../../../../theme';

const { width: SW } = Dimensions.get('window');

// ─── Canvas dimensions ────────────────────────────────────────────────────────
const CANVAS_W = SW - 40;          // 20px padding each side
const CANVAS_H = Math.round(CANVAS_W * 0.75);

// ─── Path generation ──────────────────────────────────────────────────────────
// Sine wave path sampled into discrete points
const PATH_SAMPLES = 200;

interface Point { x: number; y: number; }

function buildPath(w: number, h: number): Point[] {
  const pts: Point[] = [];
  for (let i = 0; i <= PATH_SAMPLES; i++) {
    const t  = i / PATH_SAMPLES;
    const px = 24 + t * (w - 48);                           // left→right with padding
    const py = h / 2 + Math.sin(t * Math.PI * 3.2) * (h * 0.28);  // 1.6 full waves
    pts.push({ x: px, y: py });
  }
  return pts;
}

function pointsToSvgD(pts: Point[]): string {
  if (!pts.length) return '';
  let d = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
  for (let i = 1; i < pts.length; i++) {
    d += ` L ${pts[i].x.toFixed(1)} ${pts[i].y.toFixed(1)}`;
  }
  return d;
}

// ─── Game constants ───────────────────────────────────────────────────────────
const GAME_DURATION_SEC  = 60;
const DOT_TRAVEL_MS      = 3800;    // time for dot to traverse full path once
const ON_PATH_THRESHOLD  = 32;      // pixels — within this = "on path"
const CHECK_INTERVAL_MS  = 80;      // how often we check finger vs dot

// ─── Animated SVG dot wrapper ─────────────────────────────────────────────────
// We need to read the animated value each frame to position the SVG circle.
// We use a JS-driven approach: listen to animated value changes.
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export default function TraceThePathGame() {
  const insets      = useSafeAreaInsets();
  const sessionTime = useSessionStore(selectTimeDisplay);
  const completeCheckpoint = useSessionStore(s => s.completeCheckpoint);

  const [fontsLoaded] = useFonts({
    Nunito_800ExtraBold,
    Nunito_700Bold,
    Nunito_400Regular,
  });

  // ── Path ───────────────────────────────────────────────────────────────────
  const pathPoints = useMemo(() => buildPath(CANVAS_W, CANVAS_H), []);
  const svgPathD   = useMemo(() => pointsToSvgD(pathPoints), [pathPoints]);

  // ── Dot position along path (0 → 1) ───────────────────────────────────────
  const dotProgress   = useRef(new Animated.Value(0)).current;
  const dotProgressJS = useRef(0);  // JS-readable mirror

  useEffect(() => {
    const id = dotProgress.addListener(({ value }) => {
      dotProgressJS.current = value;
    });
    return () => dotProgress.removeListener(id);
  }, [dotProgress]);

  // ── Dot x/y (JS thread) ───────────────────────────────────────────────────
  const [dotXY, setDotXY] = useState<Point>({ x: pathPoints[0].x, y: pathPoints[0].y });

  // ── Finger position ────────────────────────────────────────────────────────
  const fingerPos     = useRef<Point | null>(null);
  const isTracking    = useRef(false);

  // ── Game stats ─────────────────────────────────────────────────────────────
  const [onPathPct, setOnPathPct] = useState(100);
  const [loops,     setLoops]     = useState(0);
  const [timeLeft,  setTimeLeft]  = useState(GAME_DURATION_SEC);
  const [tracing,   setTracing]   = useState(false);

  const framesTotal  = useRef(0);
  const framesOnPath = useRef(0);
  const loopsRef     = useRef(0);

  // ── Canvas layout offset (needed to translate touch coords) ───────────────
  const canvasOffset = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // ── Entry fade ─────────────────────────────────────────────────────────────
  const fadeIn = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(fadeIn, { toValue: 1, duration: 500, useNativeDriver: true }).start();
  }, [fadeIn]);

  // ── Dot travel loop ────────────────────────────────────────────────────────
  const animateDot = useCallback(() => {
    dotProgress.setValue(0);
    Animated.timing(dotProgress, {
      toValue:         1,
      duration:        DOT_TRAVEL_MS,
      easing:          Easing.inOut(Easing.sin),
      useNativeDriver: false,  // must be false — we read the value on JS thread
    }).start(({ finished }) => {
      if (finished) {
        loopsRef.current += 1;
        setLoops(loopsRef.current);
        animateDot();  // loop
      }
    });
  }, [dotProgress]);

  useEffect(() => {
    animateDot();
    return () => dotProgress.stopAnimation();
  }, [animateDot, dotProgress]);

  // ── Sync dot position to state for SVG rendering ──────────────────────────
  useEffect(() => {
    const id = setInterval(() => {
      const t   = dotProgressJS.current;
      const idx = Math.min(Math.floor(t * PATH_SAMPLES), PATH_SAMPLES);
      setDotXY(pathPoints[idx]);
    }, 16); // ~60fps
    return () => clearInterval(id);
  }, [pathPoints]);

  // ── On-path detection loop ─────────────────────────────────────────────────
  useEffect(() => {
    const id = setInterval(() => {
      if (!isTracking.current || !fingerPos.current) return;

      framesTotal.current += 1;

      // Current dot position
      const t   = dotProgressJS.current;
      const idx = Math.min(Math.floor(t * PATH_SAMPLES), PATH_SAMPLES);
      const dot = pathPoints[idx];

      // Distance from finger to dot
      const dx = fingerPos.current.x - dot.x;
      const dy = fingerPos.current.y - dot.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist <= ON_PATH_THRESHOLD) {
        framesOnPath.current += 1;
      }

      const pct = framesTotal.current === 0
        ? 100
        : Math.round((framesOnPath.current / framesTotal.current) * 100);
      setOnPathPct(pct);
    }, CHECK_INTERVAL_MS);

    return () => clearInterval(id);
  }, [pathPoints]);

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

  // ── PanResponder — tracks finger on the canvas ────────────────────────────
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder:        () => true,
      onMoveShouldSetPanResponder:         () => true,
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponderCapture:  () => true,

      onPanResponderGrant: (evt) => {
        const { pageX, pageY } = evt.nativeEvent;
        fingerPos.current = {
          x: pageX - canvasOffset.current.x,
          y: pageY - canvasOffset.current.y,
        };
        isTracking.current = true;
        setTracing(true);
      },

      onPanResponderMove: (evt) => {
        const { pageX, pageY } = evt.nativeEvent;
        fingerPos.current = {
          x: pageX - canvasOffset.current.x,
          y: pageY - canvasOffset.current.y,
        };
      },

      onPanResponderRelease: () => {
        isTracking.current = false;
        fingerPos.current  = null;
        setTracing(false);
      },

      onPanResponderTerminate: () => {
        isTracking.current = false;
        fingerPos.current  = null;
        setTracing(false);
      },
    })
  ).current;

  // ── Traced portion: points from start to current dot ──────────────────────
  const tracedD = useMemo(() => {
    const idx = Math.min(
      Math.floor(dotProgressJS.current * PATH_SAMPLES),
      PATH_SAMPLES
    );
    return pointsToSvgD(pathPoints.slice(0, idx + 1));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dotXY, pathPoints]);

  // ── Time display ───────────────────────────────────────────────────────────
  const timeMM = Math.floor(timeLeft / 60).toString();
  const timeSS = (timeLeft % 60).toString().padStart(2, '0');

  if (!fontsLoaded) return null;

  // Finger indicator position (clamped to canvas)
  const fx = fingerPos.current ? Math.max(0, Math.min(fingerPos.current.x, CANVAS_W)) : null;
  const fy = fingerPos.current ? Math.max(0, Math.min(fingerPos.current.y, CANVAS_H)) : null;

  // On-path color: green when high, orange when low
  const onPathColor = onPathPct >= 70 ? '#66DD99' : onPathPct >= 40 ? COLORS.amber : COLORS.orange;

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <View style={StyleSheet.absoluteFill}>
        <View style={{ flex: 1, backgroundColor: '#0A0603' }} />
      </View>
      {/* Soft purple bloom */}
      <View style={styles.bgBloom} />

      <Animated.View style={[styles.content, { opacity: fadeIn, paddingTop: insets.top + 24 }]}>

        {/* ── Top bar ── */}
        <View style={styles.topBar}>
          <View style={styles.topBarLeft}>
            <Text style={styles.topBarIcon}>✦</Text>
            <Text style={styles.topBarLabel}>TRACE THE PATH</Text>
          </View>
          <TouchableOpacity style={styles.endBtn} onPress={handleEnd} activeOpacity={0.75}>
            <Text style={styles.endBtnText}>End break ›</Text>
          </TouchableOpacity>
        </View>

        {/* ── Canvas ── */}
        <View
          style={styles.canvas}
          {...panResponder.panHandlers}
          onLayout={e => {
            e.target.measure((_x, _y, _w, _h, pageX, pageY) => {
              canvasOffset.current = { x: pageX, y: pageY };
            });
          }}
        >
          {/* Inner glow */}
          <View style={styles.canvasGlow} />

          <Svg width={CANVAS_W} height={CANVAS_H}>
            <Defs>
              {/* Traced path gradient: orange → purple */}
              <SvgGrad id="traceGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <Stop offset="0%"   stopColor="#FF6B1A" stopOpacity="1" />
                <Stop offset="50%"  stopColor="#FF8C00" stopOpacity="1" />
                <Stop offset="100%" stopColor="#9977DD" stopOpacity="1" />
              </SvgGrad>
              {/* Untraced path gradient: muted purple */}
              <SvgGrad id="untracedGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <Stop offset="0%"   stopColor="#6644AA" stopOpacity="0.6" />
                <Stop offset="100%" stopColor="#9977DD" stopOpacity="0.6" />
              </SvgGrad>
            </Defs>

            {/* Full faint background path */}
            <Path
              d={svgPathD}
              fill="none"
              stroke="url(#untracedGrad)"
              strokeWidth={4}
              strokeLinecap="round"
            />

            {/* Glowing traced portion */}
            {tracedD ? (
              <G>
                {/* Outer glow layer */}
                <Path
                  d={tracedD}
                  fill="none"
                  stroke="url(#traceGrad)"
                  strokeWidth={12}
                  strokeLinecap="round"
                  opacity={0.18}
                />
                {/* Core line */}
                <Path
                  d={tracedD}
                  fill="none"
                  stroke="url(#traceGrad)"
                  strokeWidth={4.5}
                  strokeLinecap="round"
                />
              </G>
            ) : null}

            {/* Moving dot — outer glow */}
            <Circle
              cx={dotXY.x}
              cy={dotXY.y}
              r={20}
              fill="rgba(187,153,255,0.18)"
            />
            {/* Moving dot — ring */}
            <Circle
              cx={dotXY.x}
              cy={dotXY.y}
              r={12}
              fill="none"
              stroke="rgba(187,153,255,0.80)"
              strokeWidth={2}
            />
            {/* Moving dot — core */}
            <Circle
              cx={dotXY.x}
              cy={dotXY.y}
              r={5}
              fill="#CC99FF"
            />

            {/* Finger indicator */}
            {tracing && fx !== null && fy !== null && (
              <G>
                <Circle cx={fx} cy={fy} r={20} fill="rgba(255,107,26,0.12)" />
                <Circle cx={fx} cy={fy} r={9}  fill="rgba(255,107,26,0.55)" />
                <Circle cx={fx} cy={fy} r={4}  fill="#FF6B1A" />
              </G>
            )}

            {/* Spark particles along traced path (every 20th point) */}
            {pathPoints
              .filter((_, i) => i % 22 === 0 && i / PATH_SAMPLES <= dotProgressJS.current)
              .map((pt, i) => (
                <Circle
                  key={i}
                  cx={pt.x + (Math.random() - 0.5) * 6}
                  cy={pt.y + (Math.random() - 0.5) * 6}
                  r={1.8}
                  fill={i % 2 === 0 ? '#FFAA33' : '#BB99FF'}
                  opacity={0.55}
                />
              ))
            }
          </Svg>
        </View>

        {/* ── Stat cards ── */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: onPathColor }]}>{onPathPct}%</Text>
            <Text style={styles.statLabel}>ON PATH</Text>
          </View>
          <View style={[styles.statCard, styles.statCardMid]}>
            <Text style={styles.statValue}>{timeMM}:{timeSS}</Text>
            <Text style={styles.statLabel}>TIME LEFT</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{loops}</Text>
            <Text style={styles.statLabel}>LOOPS</Text>
          </View>
        </View>

        {/* ── Instruction banner ── */}
        <View style={styles.banner}>
          <Text style={styles.bannerText}>
            {tracing
              ? 'Follow the glowing dot · stay close'
              : 'Keep your finger on the glowing path'}
          </Text>
          <Text style={styles.bannerSub}>No win or lose · just flow</Text>
        </View>

      </Animated.View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex:            1,
    backgroundColor: '#0A0603',
  },

  bgBloom: {
    position:        'absolute',
    top:             '20%',
    alignSelf:       'center',
    width:           SW * 0.9,
    height:          SW * 0.9,
    borderRadius:    SW * 0.45,
    backgroundColor: 'transparent',
    shadowColor:     '#7755CC',
    shadowOffset:    { width: 0, height: 0 },
    shadowOpacity:   0.35,
    shadowRadius:    120,
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
    marginBottom:   24,
  },
  topBarLeft:  { flexDirection: 'row', alignItems: 'center', gap: 8 },
  topBarIcon:  { fontSize: 14, color: '#BB99FF' },
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

  // Canvas
  canvas: {
    width:           CANVAS_W,
    height:          CANVAS_H,
    backgroundColor: 'rgba(255,255,255,0.025)',
    borderRadius:    20,
    borderWidth:     1,
    borderColor:     'rgba(255,255,255,0.07)',
    overflow:        'hidden',
    marginBottom:    20,
    position:        'relative',
  },
  canvasGlow: {
    position:        'absolute',
    top:             '30%',
    left:            '20%',
    width:           200,
    height:          120,
    backgroundColor: 'transparent',
    shadowColor:     '#7755CC',
    shadowOffset:    { width: 0, height: 0 },
    shadowOpacity:   0.20,
    shadowRadius:    60,
    elevation:       0,
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    gap:           10,
    marginBottom:  14,
  },
  statCard: {
    flex:              1,
    backgroundColor:   'rgba(255,255,255,0.04)',
    borderRadius:      16,
    borderWidth:       1,
    borderColor:       'rgba(255,255,255,0.08)',
    paddingVertical:   18,
    alignItems:        'center',
  },
  statCardMid: {
    borderColor: 'rgba(119,85,204,0.25)',
    backgroundColor: 'rgba(119,85,204,0.07)',
  },
  statValue: {
    fontFamily:    FONTS.black,
    fontSize:      28,
    color:         COLORS.cream,
    letterSpacing: -0.5,
    marginBottom:  4,
  },
  statLabel: {
    fontFamily:    FONTS.regular,
    fontSize:      10,
    color:         'rgba(255,244,230,0.35)',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },

  // Banner
  banner: {
    backgroundColor: 'rgba(119,85,204,0.10)',
    borderWidth:     1,
    borderColor:     'rgba(119,85,204,0.20)',
    borderRadius:    16,
    paddingVertical:   18,
    paddingHorizontal: 20,
    alignItems:      'center',
  },
  bannerText: {
    fontFamily:  FONTS.bold,
    fontSize:    14,
    color:       'rgba(187,153,255,0.80)',
    textAlign:   'center',
    marginBottom: 4,
  },
  bannerSub: {
    fontFamily: FONTS.regular,
    fontSize:   13,
    color:      'rgba(187,153,255,0.45)',
    textAlign:  'center',
  },
});
