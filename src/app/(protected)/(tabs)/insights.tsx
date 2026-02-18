/**
 * Ember – InsightsScreen.tsx  (Insights / Achievement)
 *
 * Sections (matching reference):
 *   1. Header + date navigator (Today ‹ ›)
 *   2. Focus Summary card  – big time hero + sub-stats + motivational banner
 *   3. Goal Performance card – hourly bar chart + legend
 *   4. Focus Streak card – day-of-week circles
 *   5. Pattern of Your Focus – heatmap grid + legend + motivational note
 *   6. Focus / Total / Sessions tab chart
 *
 * All in Ember's dark warm design system (COLORS, FONTS, RADII from theme.ts)
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  StatusBar,
  Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, {
  Defs,
  LinearGradient as SvgGrad,
  Stop,
  Rect,
  Line,
  Text as SvgText,
} from 'react-native-svg';
import {
  useFonts,
  Nunito_800ExtraBold,
  Nunito_700Bold,
  Nunito_400Regular,
} from '@expo-google-fonts/nunito';
import {COLORS, FONTS, RADII, NavigationProp} from '../../../theme'
const { width: SW } = Dimensions.get('window');
const H_PAD  = 16;
const CARD_W = SW - H_PAD * 2;

// ─── Types ────────────────────────────────────────────────────────────────────
interface InsightsScreenProps { navigation?: NavigationProp; }
type ChartTab = 'Focus' | 'Total' | 'Sessions';

// ─── Mock data ────────────────────────────────────────────────────────────────
// Hourly bars for today  (hour label → focus minutes in that hour)
const HOURLY_DATA: { label: string; mins: number; isNow: boolean }[] = [
  { label: '12 PM', mins: 18, isNow: true  },
  { label: '1 PM',  mins: 28, isNow: false },
  { label: '2 PM',  mins: 22, isNow: false },
  { label: '3 PM',  mins: 35, isNow: false },
  { label: '4 PM',  mins: 16, isNow: false },
];

// Week day streak (T = today)
const STREAK_DAYS = [
  { label: 'T', done: true  },
  { label: 'W', done: false },
  { label: 'T', done: false },
  { label: 'F', done: false },
  { label: 'S', done: false },
  { label: 'S', done: false },
  { label: 'M', done: false },
];

// Heatmap: rows = days of week (S M T W T F S), cols = weeks (Dec → Feb)
// 0 = no focus, 1-4 = light→deep
function buildHeatmap(): number[][] {
  const rows = 7;
  const cols = 14; // ~3 months compressed
  return Array.from({ length: rows }, (_, r) =>
    Array.from({ length: cols }, (_, c) => {
      // Only last col row 2 (Tuesday) has activity
      if (r === 2 && c === cols - 1) return 3;
      return 0;
    })
  );
}
const HEATMAP = buildHeatmap();
const HEATMAP_MONTH_LABELS = [
  { label: 'Dec', col: 0 },
  { label: 'Jan', col: 5 },
  { label: 'Feb', col: 11 },
];
const HEATMAP_ROW_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

// Weekly bar chart for Focus/Total/Sessions tabs
const WEEK_BARS: { day: string; date: number; mins: number }[] = [
  { day: 'Sun', date: 15, mins: 0  },
  { day: 'Mon', date: 16, mins: 0  },
  { day: 'Tue', date: 17, mins: 91 },
  { day: 'Wed', date: 18, mins: 0  },
  { day: 'Thu', date: 19, mins: 0  },
  { day: 'Fri', date: 20, mins: 0  },
  { day: 'Sat', date: 21, mins: 0  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function heatColor(level: number): string {
  // Ember-tinted heat scale: dark → orange→gold
  const map: Record<number, string> = {
    0: '#1E1812',
    1: '#5C2A0A',
    2: '#A04818',
    3: '#FF6B1A',
    4: '#FFD166',
  };
  return map[level] ?? map[0];
}

// ─── Animated bar (scales up from bottom) ────────────────────────────────────
interface AnimBarProps {
  heightPct: number;   // 0-1
  maxH:      number;
  width:     number;
  color:     string;
  delay:     number;
  isNow?:    boolean;
}
function AnimBar({ heightPct, maxH, width, color, delay, isNow }: AnimBarProps) {
  const scaleY = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(scaleY, {
      toValue:  1,
      duration: 550,
      delay,
      easing:   Easing.out(Easing.back(1.1)),
      useNativeDriver: true,
    }).start();
  }, [scaleY, delay]);

  const barH = Math.max(heightPct * maxH, 3);

  return (
    <View style={{ height: maxH, width, alignItems: 'center', justifyContent: 'flex-end' }}>
      <Animated.View style={{
        width, height: barH, borderRadius: 5, overflow: 'hidden',
        transform: [{ scaleY }],
        transformOrigin: 'bottom' as unknown as undefined,
      }}>
        <LinearGradient
          colors={isNow ? [COLORS.red, '#FF8060'] : [COLORS.amber, COLORS.orange]}
          start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
          style={{ flex: 1 }}
        />
      </Animated.View>
    </View>
  );
}

// ─── Section card wrapper ─────────────────────────────────────────────────────
function Card({ children, style }: { children: React.ReactNode; style?: object }) {
  return (
    <View style={[cardStyle.card, style]}>
      {children}
    </View>
  );
}
const cardStyle = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADII.xxl,
    padding: 20,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
});

// ─── "More ▶" pill ────────────────────────────────────────────────────────────
function MoreBtn({ onPress }: { onPress?: () => void }) {
  return (
    <TouchableOpacity style={moreStyle.btn} activeOpacity={0.7} onPress={onPress}>
      <Text style={moreStyle.txt}>more ▶</Text>
    </TouchableOpacity>
  );
}
const moreStyle = StyleSheet.create({
  btn: {
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
    borderRadius: RADII.pill, paddingHorizontal: 14, paddingVertical: 6,
  },
  txt: { fontFamily: FONTS.bold, fontSize: 12, color: COLORS.cream },
});

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function InsightsScreen({ navigation }: InsightsScreenProps) {
  const [fontsLoaded] = useFonts({ Nunito_800ExtraBold, Nunito_700Bold, Nunito_400Regular });
  const [chartTab, setChartTab] = useState<ChartTab>('Focus');
  const [chartKey, setChartKey] = useState(0);

  // Staggered fade-in per section
  const fadeAnims = useRef(Array.from({ length: 7 }, () => new Animated.Value(0))).current;
  const slideAnims = useRef(Array.from({ length: 7 }, () => new Animated.Value(18))).current;

  useEffect(() => {
    const anims = fadeAnims.map((fa, i) =>
      Animated.parallel([
        Animated.timing(fa, { toValue: 1, duration: 400, delay: i * 100, useNativeDriver: true }),
        Animated.timing(slideAnims[i], { toValue: 0, duration: 400, delay: i * 100, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      ])
    );
    Animated.parallel(anims).start();
  }, [fadeAnims, slideAnims]);

  const section = (i: number, children: React.ReactNode) => (
    <Animated.View style={{ opacity: fadeAnims[i], transform: [{ translateY: slideAnims[i] }] }}>
      {children}
    </Animated.View>
  );

  if (!fontsLoaded) return null;

  // Hourly chart dimensions
  const hourBarMaxH = 110;
  const hourBarW    = Math.floor((CARD_W - 40 - 4 * 8) / HOURLY_DATA.length);
  const hourMaxMins = Math.max(...HOURLY_DATA.map(d => d.mins), 1);

  // Heatmap dimensions
  const HM_COLS     = HEATMAP[0].length;
  const HM_ROWS     = HEATMAP.length;
  const HM_CELL     = Math.floor((CARD_W - 40 - 24) / HM_COLS);
  const HM_GAP      = 3;

  // Weekly chart dimensions
  const wkBarMaxH = 140;
  const wkBarW    = Math.floor((CARD_W - 40 - 6 * 10) / 7);
  const wkMaxMins = Math.max(...WEEK_BARS.map(d => d.mins), 1);
  const wkYLabels = ['2m', '1m 30s', '1m', '30s', '0s'];

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#0C0A0E', '#120E0A', '#1A1410']} style={StyleSheet.absoluteFill} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ─────────────────────────────────────────────────────────────────────
            HEADER
        ───────────────────────────────────────────────────────────────────── */}
        {section(0,
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Insights</Text>
            {/* Date navigator */}
            <View style={styles.dateNav}>
              <TouchableOpacity style={styles.navBtn} activeOpacity={0.7}>
                <Text style={styles.navArrow}>‹</Text>
              </TouchableOpacity>
              <View style={styles.datePill}>
                <Text style={styles.dateText}>Today  ⌃</Text>
              </View>
              <TouchableOpacity style={[styles.navBtn, styles.navBtnDisabled]} activeOpacity={0.4}>
                <Text style={[styles.navArrow, { color: COLORS.faint }]}>›</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ─────────────────────────────────────────────────────────────────────
            1. FOCUS SUMMARY
        ───────────────────────────────────────────────────────────────────── */}
        {section(1,
          <Card>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Focus Summary</Text>
              <View style={styles.cardHeaderRight}>
                <TouchableOpacity style={styles.timelinePill} activeOpacity={0.7}>
                  <Text style={styles.timelineTxt}>Timeline</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.shareIcon} activeOpacity={0.7}>
                  <Text style={{ fontSize: 16, color: COLORS.muted }}>↑</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Big hero time */}
            <Text style={styles.heroTime}>8h 15m</Text>
            <Text style={styles.heroLabel}>Focused</Text>

            {/* Sub-stats */}
            <View style={styles.subStats}>
              <Text style={styles.subStat}><Text style={styles.subStatVal}>12 </Text>Sessions</Text>
              <View style={styles.subStatDot} />
              <Text style={styles.subStat}><Text style={styles.subStatVal}>8h 42m </Text>Total</Text>
              <View style={styles.subStatDot} />
              <Text style={styles.subStat}><Text style={styles.subStatVal}>27m </Text>Break</Text>
            </View>

            {/* Motivational banner */}
            <View style={styles.motiveBanner}>
              <Text style={styles.motiveEmoji}>🚀</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.motiveTitle}>Good Flow in Progress</Text>
                <Text style={styles.motiveSub}>You're making today count with deep focus.</Text>
              </View>
            </View>
          </Card>
        )}

        {/* ─────────────────────────────────────────────────────────────────────
            2. GOAL PERFORMANCE
        ───────────────────────────────────────────────────────────────────── */}
        {section(2,
          <Card>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Goal Performance</Text>
              <MoreBtn />
            </View>

            {/* Status line */}
            <View style={styles.goalStatus}>
              <View style={styles.goalIconCircle}>
                <Text style={{ fontSize: 22 }}>💤</Text>
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.goalStatusText}>
                  <Text style={{ color: COLORS.orange, fontFamily: FONTS.bold }}>68% </Text>
                  done. Almost there, finish strong!
                </Text>
                <Text style={styles.goalStatusSub}>Focused for <Text style={{ fontFamily: FONTS.bold, color: COLORS.cream }}>8h 15m</Text></Text>
              </View>
            </View>

            {/* Hourly bar chart */}
            <View style={styles.hourlyChart}>
              {/* Y-axis goal line */}
              <View style={styles.goalLine} />
              <Text style={styles.goalLineLabel}>10h goal</Text>

              {/* Bars row */}
              <View style={[styles.barsRow, { height: hourBarMaxH }]}>
                {HOURLY_DATA.map((d, i) => (
                  <AnimBar
                    key={i}
                    heightPct={d.mins / hourMaxMins}
                    maxH={hourBarMaxH}
                    width={hourBarW}
                    color={d.isNow ? COLORS.red : COLORS.amber}
                    delay={i * 80}
                    isNow={d.isNow}
                  />
                ))}
              </View>

              {/* X labels */}
              <View style={[styles.barsRow, { marginTop: 6 }]}>
                {HOURLY_DATA.map((d, i) => (
                  <Text key={i} style={[styles.barXLabel, { width: hourBarW }]}>{d.label}</Text>
                ))}
              </View>

              {/* Legend */}
              <View style={styles.legendRow}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: COLORS.red }]} />
                  <Text style={styles.legendText}>Added this hour</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: COLORS.amber }]} />
                  <Text style={styles.legendText}>Already logged</Text>
                </View>
              </View>
            </View>
          </Card>
        )}

        {/* ─────────────────────────────────────────────────────────────────────
            3. FOCUS STREAK
        ───────────────────────────────────────────────────────────────────── */}
        {section(3,
          <Card>
            <View style={styles.cardHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={{ fontSize: 22 }}>🔥</Text>
                <Text style={styles.cardTitle}>7 Focus streak</Text>
              </View>
              <MoreBtn />
            </View>

            <View style={styles.streakRow}>
              {STREAK_DAYS.map((d, i) => (
                <View key={i} style={styles.streakDayCol}>
                  <View style={[
                    styles.streakCircle,
                    d.done && styles.streakCircleDone,
                  ]}>
                    {d.done
                      ? <Text style={styles.streakCheck}>✓</Text>
                      : null
                    }
                  </View>
                  <Text style={[styles.streakLabel, d.done && { color: COLORS.orange }]}>{d.label}</Text>
                </View>
              ))}
            </View>
          </Card>
        )}

        {/* ─────────────────────────────────────────────────────────────────────
            4. PATTERN OF YOUR FOCUS (heatmap)
        ───────────────────────────────────────────────────────────────────── */}
        {section(4,
          <Card>
            <Text style={styles.cardTitle}>The Pattern of Your Focus</Text>

            {/* Mini stats */}
            <View style={styles.patternStats}>
              <View style={styles.patternStat}>
                <Text style={styles.patternStatVal}>12</Text>
                <Text style={styles.patternStatLbl}>Sessions</Text>
              </View>
              <View style={styles.patternStatDivider} />
              <View style={styles.patternStat}>
                <Text style={styles.patternStatVal}>8h 15m</Text>
                <Text style={styles.patternStatLbl}>Focused</Text>
              </View>
            </View>

            {/* Month labels */}
            <View style={styles.heatmapWrap}>
              <View style={{ width: 16 }} />{/* row-label gutter */}
              <View style={{ flex: 1 }}>
                <View style={styles.heatMonthRow}>
                  {HEATMAP_MONTH_LABELS.map(m => (
                    <Text key={m.label} style={[styles.heatMonthLabel, { left: m.col * (HM_CELL + HM_GAP) }]}>
                      {m.label}
                    </Text>
                  ))}
                </View>

                {/* Grid */}
                {HEATMAP.map((row, ri) => (
                  <View key={ri} style={[styles.heatRow, { marginBottom: HM_GAP }]}>
                    {row.map((level, ci) => (
                      <View
                        key={ci}
                        style={{
                          width: HM_CELL, height: HM_CELL,
                          borderRadius: 3,
                          backgroundColor: heatColor(level),
                          marginRight: ci < row.length - 1 ? HM_GAP : 0,
                          borderWidth: level === 0 ? 1 : 0,
                          borderColor: 'rgba(255,255,255,0.04)',
                        }}
                      />
                    ))}
                  </View>
                ))}
              </View>

              {/* Row labels (day of week) — overlaid on left */}
              <View style={[StyleSheet.absoluteFillObject, { flexDirection: 'column', paddingTop: 18, gap: HM_GAP }]}>
                {HEATMAP_ROW_LABELS.map((lbl, i) => (
                  <View key={i} style={{ height: HM_CELL, justifyContent: 'center' }}>
                    <Text style={styles.heatRowLabel}>{lbl}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Legend */}
            <View style={styles.heatLegend}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#1E1812', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }]} />
                <Text style={styles.legendText}>No focus</Text>
              </View>
              <Text style={styles.legendText}>Light</Text>
              {[1, 2, 3, 4].map(l => (
                <View key={l} style={[styles.heatLegendCell, { backgroundColor: heatColor(l) }]} />
              ))}
              <Text style={styles.legendText}>Deep</Text>
            </View>

            {/* Motivational note */}
            <View style={styles.motiveBanner}>
              <Text style={styles.motiveEmoji}>🌱</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.motiveTitle}>You've made a start.</Text>
                <Text style={styles.motiveSub}>Continue today to shape your pattern.</Text>
              </View>
            </View>
          </Card>
        )}

        {/* ─────────────────────────────────────────────────────────────────────
            5. FOCUS / TOTAL / SESSIONS chart
        ───────────────────────────────────────────────────────────────────── */}
        {section(5,
          <Card style={{ paddingBottom: 24 }}>
            {/* Tab switcher */}
            <View style={styles.tabRow}>
              {(['Focus', 'Total', 'Sessions'] as ChartTab[]).map(t => (
                <TouchableOpacity key={t} style={styles.tabBtn} activeOpacity={0.7}
                  onPress={() => { setChartTab(t); setChartKey(k => k + 1); }}>
                  <Text style={[styles.tabText, chartTab === t && styles.tabTextActive]}>{t}</Text>
                  {chartTab === t && <View style={styles.tabUnderline} />}
                </TouchableOpacity>
              ))}
            </View>

            {/* Chart sub-header */}
            <View style={styles.chartSubHeader}>
              <Text style={styles.chartSubLabel}>
                CHART ({chartTab === 'Sessions' ? 'SESSIONS' : 'FOCUS TIME'})
              </Text>
              <TouchableOpacity style={styles.tagsBtn} activeOpacity={0.7}>
                <Text style={styles.tagsBtnText}>🏷 Tags</Text>
              </TouchableOpacity>
            </View>

            {/* Y-axis + bars */}
            <View style={styles.weekChartWrap}>
              {/* Y labels */}
              <View style={styles.yAxis}>
                {wkYLabels.map(l => (
                  <Text key={l} style={styles.yLabel}>{l}</Text>
                ))}
              </View>

              {/* Grid + bars */}
              <View style={{ flex: 1 }}>
                {/* Horizontal grid lines */}
                <Svg width="100%" height={wkBarMaxH} style={{ position: 'absolute', top: 0 }}>
                  {[0, 0.25, 0.5, 0.75, 1].map(t => (
                    <Line key={t} x1="0" y1={wkBarMaxH * (1 - t)} x2="100%" y2={wkBarMaxH * (1 - t)}
                      stroke="rgba(255,255,255,0.06)" strokeWidth={1} />
                  ))}
                </Svg>

                {/* Bars */}
                <View style={[styles.weekBarsRow, { height: wkBarMaxH }]}>
                  {WEEK_BARS.map((d, i) => (
                    <AnimBar
                      key={`${chartKey}-${i}`}
                      heightPct={d.mins / wkMaxMins}
                      maxH={wkBarMaxH}
                      width={wkBarW}
                      color={d.date === 17 ? COLORS.red : COLORS.amber}
                      delay={i * 60}
                      isNow={d.date === 17}
                    />
                  ))}
                </View>

                {/* X labels */}
                <View style={[styles.weekBarsRow, { marginTop: 8 }]}>
                  {WEEK_BARS.map((d, i) => (
                    <View key={i} style={{ width: wkBarW, alignItems: 'center' }}>
                      <Text style={[styles.weekDayLabel, d.date === 17 && { color: COLORS.cream, fontFamily: FONTS.bold }]}>
                        {d.day}
                      </Text>
                      <Text style={[styles.weekDateLabel, d.date === 17 && { color: COLORS.cream, fontFamily: FONTS.bold }]}>
                        {d.date}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          </Card>
        )}

        {/* ─────────────────────────────────────────────────────────────────────
            6. RECENT SESSIONS teaser
        ───────────────────────────────────────────────────────────────────── */}
        {section(6,
          <Card>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Recent Sessions</Text>
              <MoreBtn />
            </View>
            {[
              { goal: 'Finish chapter 4',  dur: '45m', time: '3:20 PM', score: 4 },
              { goal: 'Deep work sprint',  dur: '90m', time: '1:00 PM', score: 3 },
              { goal: 'Email catchup',     dur: '20m', time: '11:10 AM', score: 2 },
            ].map((s, i) => (
              <View key={i} style={[styles.sessionRow, i < 2 && styles.sessionRowBorder]}>
                <View style={styles.sessionLeft}>
                  <Text style={styles.sessionGoal}>{s.goal}</Text>
                  <Text style={styles.sessionTime}>{s.time}</Text>
                </View>
                <View style={styles.sessionRight}>
                  <Text style={styles.sessionDur}>{s.dur}</Text>
                  <View style={styles.sessionDots}>
                    {[1,2,3,4].map(dot => (
                      <View key={dot} style={[
                        styles.sessionDot,
                        { backgroundColor: dot <= s.score ? COLORS.orange : COLORS.surface2 },
                      ]} />
                    ))}
                  </View>
                </View>
              </View>
            ))}
          </Card>
        )}

        <View style={{ height: 120 }} />
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root:         { flex: 1, backgroundColor: COLORS.bg },
  scroll:       { flex: 1 },
  scrollContent: { paddingHorizontal: H_PAD, paddingTop: 56 },

  // Header
  header:       { marginBottom: 20 },
  headerTitle:  { fontFamily: FONTS.black, fontSize: 32, color: COLORS.cream, letterSpacing: -0.5 },
  dateNav:      { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12 },
  navBtn:       {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: COLORS.surface2, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: COLORS.border,
  },
  navBtnDisabled: { opacity: 0.35 },
  navArrow:     { fontFamily: FONTS.bold, fontSize: 18, color: COLORS.cream, lineHeight: 20 },
  datePill:     {
    flex: 1, alignItems: 'center', paddingVertical: 8,
    backgroundColor: COLORS.surface2, borderRadius: RADII.pill,
    borderWidth: 1, borderColor: COLORS.border,
  },
  dateText:     { fontFamily: FONTS.bold, fontSize: 15, color: COLORS.cream },

  // Card header
  cardHeader:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  cardTitle:       { fontFamily: FONTS.bold, fontSize: 16, color: COLORS.cream },
  cardHeaderRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  timelinePill:    {
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
    borderRadius: RADII.pill, paddingHorizontal: 14, paddingVertical: 6,
  },
  timelineTxt:     { fontFamily: FONTS.bold, fontSize: 12, color: COLORS.cream },
  shareIcon:       {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: COLORS.surface2, alignItems: 'center', justifyContent: 'center',
  },

  // Focus Summary
  heroTime:     { fontFamily: FONTS.black, fontSize: 52, color: COLORS.orange, letterSpacing: -1, textAlign: 'center' },
  heroLabel:    { fontFamily: FONTS.bold, fontSize: 18, color: COLORS.orange, textAlign: 'center', marginBottom: 14 },
  subStats:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 16 },
  subStat:      { fontFamily: FONTS.regular, fontSize: 13, color: COLORS.muted },
  subStatVal:   { fontFamily: FONTS.bold, color: COLORS.cream },
  subStatDot:   { width: 4, height: 4, borderRadius: 2, backgroundColor: COLORS.muted },

  // Motivational banner
  motiveBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: 'rgba(255,107,26,0.1)',
    borderRadius: RADII.lg, padding: 14,
    borderWidth: 1, borderColor: 'rgba(255,107,26,0.18)',
    marginTop: 4,
  },
  motiveEmoji:  { fontSize: 28 },
  motiveTitle:  { fontFamily: FONTS.bold, fontSize: 14, color: COLORS.cream, marginBottom: 2 },
  motiveSub:    { fontFamily: FONTS.regular, fontSize: 12, color: COLORS.muted, lineHeight: 17 },

  // Goal performance
  goalStatus:   { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  goalIconCircle: {
    width: 50, height: 50, borderRadius: 25,
    backgroundColor: 'rgba(100,120,200,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  goalStatusText: { fontFamily: FONTS.regular, fontSize: 15, color: COLORS.cream, lineHeight: 21 },
  goalStatusSub:  { fontFamily: FONTS.regular, fontSize: 12, color: COLORS.muted, marginTop: 3 },

  // Hourly chart
  hourlyChart:  { position: 'relative' },
  goalLine:     {
    position: 'absolute', top: 8, left: 0, right: 0, height: 1,
    backgroundColor: COLORS.orange, opacity: 0.5,
  },
  goalLineLabel: {
    position: 'absolute', top: 0, right: 0,
    fontFamily: FONTS.mono ?? FONTS.regular, fontSize: 10, color: COLORS.orange,
  },
  barsRow:      { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  barXLabel:    { fontFamily: FONTS.regular, fontSize: 10, color: COLORS.muted, textAlign: 'center' },

  legendRow:    { flexDirection: 'row', gap: 20, marginTop: 10 },
  legendItem:   { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot:    { width: 10, height: 10, borderRadius: 5 },
  legendText:   { fontFamily: FONTS.regular, fontSize: 11, color: COLORS.muted },

  // Streak
  streakRow:    { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  streakDayCol: { alignItems: 'center', gap: 6 },
  streakCircle: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: COLORS.surface2,
    borderWidth: 1, borderColor: COLORS.border,
    alignItems: 'center', justifyContent: 'center',
  },
  streakCircleDone: { backgroundColor: COLORS.red, borderColor: COLORS.red },
  streakCheck:  { fontFamily: FONTS.bold, fontSize: 16, color: '#fff' },
  streakLabel:  { fontFamily: FONTS.regular, fontSize: 11, color: COLORS.muted },

  // Pattern / heatmap
  patternStats:     { flexDirection: 'row', alignItems: 'center', gap: 20, marginBottom: 20, marginTop: 8 },
  patternStat:      {},
  patternStatVal:   { fontFamily: FONTS.black, fontSize: 28, color: COLORS.cream },
  patternStatLbl:   { fontFamily: FONTS.regular, fontSize: 12, color: COLORS.muted, marginTop: 2 },
  patternStatDivider: { width: 1, height: 36, backgroundColor: 'rgba(255,255,255,0.08)' },

  heatmapWrap:  { position: 'relative', marginBottom: 14 },
  heatMonthRow: { flexDirection: 'row', height: 18, position: 'relative', marginLeft: 20, marginBottom: 4 },
  heatMonthLabel: { position: 'absolute', fontFamily: FONTS.regular, fontSize: 10, color: COLORS.muted },
  heatRow:      { flexDirection: 'row', marginLeft: 20 },
  heatRowLabel: { fontFamily: FONTS.regular, fontSize: 10, color: COLORS.muted, width: 16 },
  heatLegend:   { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 14 },
  heatLegendCell: { width: 13, height: 13, borderRadius: 2 },

  // Tabs
  tabRow:       { flexDirection: 'row', borderBottomWidth: 1, borderColor: COLORS.border, marginBottom: 14 },
  tabBtn:       { flex: 1, alignItems: 'center', paddingBottom: 10, position: 'relative' },
  tabText:      { fontFamily: FONTS.bold, fontSize: 15, color: COLORS.muted },
  tabTextActive:{ color: COLORS.cream },
  tabUnderline: {
    position: 'absolute', bottom: -1, left: '15%', right: '15%',
    height: 2, backgroundColor: COLORS.cream, borderRadius: 1,
  },

  chartSubHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  chartSubLabel:  { fontFamily: FONTS.mono ?? FONTS.regular, fontSize: 11, color: COLORS.muted, letterSpacing: 0.5 },
  tagsBtn:        {
    backgroundColor: COLORS.surface2, borderRadius: RADII.md,
    paddingHorizontal: 14, paddingVertical: 7,
  },
  tagsBtnText:    { fontFamily: FONTS.bold, fontSize: 13, color: COLORS.cream },

  weekChartWrap:  { flexDirection: 'row', gap: 8 },
  yAxis:          { width: 52, justifyContent: 'space-between', paddingBottom: 28 },
  yLabel:         { fontFamily: FONTS.regular, fontSize: 10, color: COLORS.muted, textAlign: 'right' },
  weekBarsRow:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  weekDayLabel:   { fontFamily: FONTS.regular, fontSize: 11, color: COLORS.muted },
  weekDateLabel:  { fontFamily: FONTS.regular, fontSize: 12, color: COLORS.muted },

  // Recent sessions
  sessionRow:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 },
  sessionRowBorder: { borderBottomWidth: 1, borderColor: COLORS.border },
  sessionLeft:    { flex: 1 },
  sessionGoal:    { fontFamily: FONTS.bold, fontSize: 14, color: COLORS.cream },
  sessionTime:    { fontFamily: FONTS.regular, fontSize: 11, color: COLORS.muted, marginTop: 2 },
  sessionRight:   { alignItems: 'flex-end', gap: 5 },
  sessionDur:     { fontFamily: FONTS.bold, fontSize: 14, color: COLORS.amber },
  sessionDots:    { flexDirection: 'row', gap: 3 },
  sessionDot:     { width: 7, height: 7, borderRadius: 3.5 },

  // Shared
  faint:     { color: COLORS.faint },
});
