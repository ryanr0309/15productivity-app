/**
 * app/(protected)/(tabs)/insights.tsx
 *
 * Full Insights screen wired to live Supabase data via sessionService.
 * Date navigator lets the user step backwards/forwards through:
 *   — days  (default view: "Today", "Yesterday", "Mon 17 Feb", …)
 *   — The ‹/› arrows are disabled when at today (no future data).
 *
 * fetchInsights(isoDate?) accepts an optional ISO date string.
 * Passing no arg (or today's ISO date) returns today's data.
 *
 * Everything else is identical to the original.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Animated, Dimensions, StatusBar,
  Easing, RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Line } from 'react-native-svg';
import {
  useFonts, Nunito_800ExtraBold, Nunito_700Bold, Nunito_400Regular,
} from '@expo-google-fonts/nunito';
import { useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  fetchInsights, InsightsData, fmtSec, fmtTime,
  heatColor, sessionScore, motivationCopy,
  WeekBar, HourlyBucket, StreakDay, RecentSession,
} from '../../../services/sessionService';
import { COLORS, FONTS, RADII } from '../../../theme';

const { width: SW } = Dimensions.get('window');
const H_PAD  = 16;
const CARD_W = SW - H_PAD * 2;

type ChartTab = 'Focus' | 'Total' | 'Sessions';

// ─── Date helpers ─────────────────────────────────────────────────────────────

/** Return a JS Date offset from today by `days` (negative = past). */
function offsetDate(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}

/** Format a date as ISO "YYYY-MM-DD" */
function toISO(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Human-readable label for the date navigator pill */
function navLabel(offset: number): string {
  if (offset === 0)  return 'Today';
  if (offset === -1) return 'Yesterday';
  const d = offsetDate(offset);
  const DAY  = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const MON  = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${DAY[d.getDay()]} ${d.getDate()} ${MON[d.getMonth()]}`;
}

// ─── Animated rising bar ──────────────────────────────────────────────────────
function AnimBar({
  heightPct, maxH, width, isToday, delay, isNow,
}: {
  heightPct: number; maxH: number; width: number;
  isToday?: boolean; delay: number; isNow?: boolean;
}) {
  const scaleY = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(scaleY, {
      toValue: 1, duration: 500, delay,
      easing: Easing.out(Easing.back(1.1)),
      useNativeDriver: true,
    }).start();
  }, [scaleY, delay]);

  const barH = Math.max(heightPct * maxH, 3);
  const colors: [string, string] = isNow
    ? [COLORS.red ?? '#FF4444', '#FF8060']
    : (isToday ? [COLORS.orange, COLORS.amber] : [COLORS.amber, COLORS.orange]);

  return (
    <View style={{ height: maxH, width, alignItems: 'center', justifyContent: 'flex-end' }}>
      <Animated.View style={{
        width, height: barH, borderRadius: 5, overflow: 'hidden',
        transform: [{ scaleY }],
      }}>
        <LinearGradient colors={colors} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={{ flex: 1 }} />
      </Animated.View>
    </View>
  );
}

// ─── Card wrapper ─────────────────────────────────────────────────────────────
function Card({ children, style }: { children: React.ReactNode; style?: object }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

// ─── "more ▶" pill ────────────────────────────────────────────────────────────
function MoreBtn() {
  return (
    <View style={styles.moreBtn}>
      <Text style={styles.moreTxt}>more ▶</Text>
    </View>
  );
}

// ─── Skeleton shimmer ─────────────────────────────────────────────────────────
function Skeleton({ w, h, r = 6 }: { w: number | string; h: number; r?: number }) {
  const shimmer = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(shimmer, { toValue: 1, duration: 900, useNativeDriver: true }),
      Animated.timing(shimmer, { toValue: 0, duration: 900, useNativeDriver: true }),
    ])).start();
  }, [shimmer]);
  return (
    <Animated.View style={{
      width: w as number, height: h, borderRadius: r,
      backgroundColor: 'rgba(255,255,255,0.07)',
      opacity: shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.4, 0.9] }),
    }} />
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function InsightsScreen() {
  const insets = useSafeAreaInsets();
  const [fontsLoaded] = useFonts({ Nunito_800ExtraBold, Nunito_700Bold, Nunito_400Regular });

  // ── Date navigation state ────────────────────────────────────────────────
  // dayOffset: 0 = today, -1 = yesterday, -2 = two days ago, etc.
  const [dayOffset,  setDayOffset]  = useState(0);

  // ── Data state ───────────────────────────────────────────────────────────
  const [data,       setData]       = useState<InsightsData | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [chartTab,   setChartTab]   = useState<ChartTab>('Focus');
  const [chartKey,   setChartKey]   = useState(0);

  // Staggered section animations
  const N = 8;
  const fadeA  = useRef(Array.from({ length: N }, () => new Animated.Value(0))).current;
  const slideA = useRef(Array.from({ length: N }, () => new Animated.Value(20))).current;

  // Pill press animation
  const pillScale = useRef(new Animated.Value(1)).current;

  const runEntrance = useCallback(() => {
    fadeA.forEach(a  => a.setValue(0));
    slideA.forEach(a => a.setValue(20));
    Animated.parallel(
      fadeA.map((fa, i) => Animated.parallel([
        Animated.timing(fa,        { toValue: 1, duration: 380, delay: i * 80, useNativeDriver: true }),
        Animated.timing(slideA[i], { toValue: 0, duration: 380, delay: i * 80, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      ]))
    ).start();
  }, [fadeA, slideA]);

  const load = useCallback(async (isRefresh = false, offset = dayOffset) => {
    if (isRefresh) setRefreshing(true);
    else           setLoading(true);
    try {
      // Pass the ISO date for the selected day so sessionService can filter
      const isoDate = toISO(offsetDate(offset));
      const result  = await fetchInsights(isoDate);
      setData(result);
      setChartKey(k => k + 1);
      runEntrance();
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [runEntrance, dayOffset]);

  // Reload when tab gains focus (always load today on re-focus)
  useFocusEffect(useCallback(() => { load(); }, [load]));

  // ── Navigation handlers ───────────────────────────────────────────────────
  const animatePill = () => {
    Animated.sequence([
      Animated.timing(pillScale, { toValue: 0.92, duration: 80, useNativeDriver: true }),
      Animated.spring(pillScale, { toValue: 1, tension: 180, friction: 10, useNativeDriver: true }),
    ]).start();
  };

  const goBack = () => {
    const next = dayOffset - 1;
    animatePill();
    setDayOffset(next);
    load(false, next);
  };

  const goForward = () => {
    if (dayOffset >= 0) return; // can't go past today
    const next = dayOffset + 1;
    animatePill();
    setDayOffset(next);
    load(false, next);
  };

  const goToday = () => {
    if (dayOffset === 0) return;
    animatePill();
    setDayOffset(0);
    load(false, 0);
  };

  const canGoForward = dayOffset < 0;
  const isToday      = dayOffset === 0;

  const sec = (i: number, children: React.ReactNode) => (
    <Animated.View style={{ opacity: fadeA[i], transform: [{ translateY: slideA[i] }] }}>
      {children}
    </Animated.View>
  );

  if (!fontsLoaded) return null;

  // ── Derived layout values ────────────────────────────────────────────────
  const hourBarMaxH = 110;
  const hourBuckets = data?.hourlyBuckets ?? [];
  const hourMaxMins = Math.max(...hourBuckets.map(h => h.minutes), 1);
  const hourBarW    = Math.floor((CARD_W - 40 - (hourBuckets.length - 1) * 8) / Math.max(hourBuckets.length, 1));

  const HM_COLS  = 14;
  const HM_ROWS  = 7;
  const HM_CELL  = Math.floor((CARD_W - 40 - 24) / HM_COLS);
  const HM_GAP   = 3;

  const wkBarMaxH = 140;
  const weekBars  = data?.weekBars ?? [];
  const wkMaxMins = Math.max(...weekBars.map(b => b.minutes), 1);
  const wkBarW    = Math.floor((CARD_W - 40 - 6 * 8) / 7);
  const wkYLabels = ['2h', '1.5h', '1h', '30m', '0'];

  // Heatmap grid
  const hmGrid: number[][] = Array.from({ length: 7 }, () => Array(14).fill(0));
  const hmFlat = data?.heatmap ?? [];
  hmFlat.forEach((day, idx) => {
    const offset    = 83 - idx;
    const dow       = ((new Date().getDay() - offset) % 7 + 7) % 7;
    const weekFromEnd = Math.floor(offset / 7);
    const col       = 13 - weekFromEnd;
    const row       = dow;
    if (col >= 0 && col < 14) hmGrid[row][col] = day.minutes;
  });

  const HM_MONTH_LABELS = buildMonthLabels();
  const HM_ROW_LABELS   = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  const motive = motivationCopy(data?.todayFocusSec ?? 0, data?.todaySessions ?? 0);
  const streak = data?.currentStreak ?? 0;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <LinearGradient colors={['#0C0A0E', '#120E0A', '#1A1410']} style={StyleSheet.absoluteFill} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 16 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={COLORS.orange} />
        }
      >

        {/* ══ 0. HEADER ══ */}
        {sec(0,
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Insights</Text>

            {/* Date navigator */}
            <View style={styles.dateNav}>

              {/* Back arrow — always available (no limit on how far back) */}
              <TouchableOpacity
                style={styles.navBtn}
                onPress={goBack}
                activeOpacity={0.7}
              >
                <Text style={styles.navArrow}>‹</Text>
              </TouchableOpacity>

              {/* Date pill — tap to jump back to today */}
              <Animated.View style={[styles.datePillWrap, { transform: [{ scale: pillScale }] }]}>
                <TouchableOpacity
                  style={[styles.datePill, !isToday && styles.datePillPast]}
                  onPress={goToday}
                  activeOpacity={isToday ? 1 : 0.75}
                >
                  {/* Subtle orange tint when not today */}
                  {!isToday && (
                    <LinearGradient
                      colors={['rgba(255,107,26,0.12)', 'rgba(255,107,26,0.06)']}
                      style={StyleSheet.absoluteFill}
                    />
                  )}
                  <Text style={[styles.dateText, !isToday && styles.dateTextPast]}>
                    {navLabel(dayOffset)}
                  </Text>
                  {!isToday && (
                    <Text style={styles.dateTodayHint}>tap for today</Text>
                  )}
                </TouchableOpacity>
              </Animated.View>

              {/* Forward arrow — greyed out when at today */}
              <TouchableOpacity
                style={[styles.navBtn, !canGoForward && styles.navBtnOff]}
                onPress={goForward}
                activeOpacity={canGoForward ? 0.7 : 0.3}
                disabled={!canGoForward}
              >
                <Text style={[styles.navArrow, !canGoForward && styles.navArrowOff]}>›</Text>
              </TouchableOpacity>

            </View>

            {/* Subtle date context line when viewing a past day */}
            {!isToday && (
              <Text style={styles.pastHint}>
                Viewing {navLabel(dayOffset)} · {toISO(offsetDate(dayOffset))}
              </Text>
            )}
          </View>
        )}

        {/* ══ 1. FOCUS SUMMARY ══ */}
        {sec(1,
          <Card>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Focus Summary</Text>
              <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                <View style={styles.pill}><Text style={styles.pillTxt}>Timeline</Text></View>
                <View style={styles.iconBtn}><Text style={{ fontSize: 15, color: COLORS.muted }}>↑</Text></View>
              </View>
            </View>

            {loading ? (
              <View style={{ gap: 10, alignItems: 'center', paddingVertical: 16 }}>
                <Skeleton w={140} h={52} r={8} />
                <Skeleton w={80}  h={20} r={6} />
                <Skeleton w={CARD_W - 60} h={14} r={4} />
              </View>
            ) : (
              <>
                <Text style={styles.heroTime}>{fmtSec(data?.todayFocusSec ?? 0)}</Text>
                <Text style={styles.heroLabel}>Focused</Text>

                <View style={styles.subStats}>
                  <Text style={styles.subStat}>
                    <Text style={styles.subStatVal}>{data?.todaySessions ?? 0} </Text>Sessions
                  </Text>
                  <View style={styles.subStatDot} />
                  <Text style={styles.subStat}>
                    <Text style={styles.subStatVal}>{fmtSec(data?.todayTotalSec ?? 0)} </Text>Total
                  </Text>
                  <View style={styles.subStatDot} />
                  <Text style={styles.subStat}>
                    <Text style={styles.subStatVal}>{fmtSec(data?.todayBreakSec ?? 0)} </Text>Break
                  </Text>
                </View>

                <View style={styles.motiveBanner}>
                  <Text style={styles.motiveEmoji}>{motive.emoji}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.motiveTitle}>{motive.title}</Text>
                    <Text style={styles.motiveSub}>{motive.sub}</Text>
                  </View>
                </View>
              </>
            )}
          </Card>
        )}

        {/* ══ 2. GOAL PERFORMANCE ══ */}
        {sec(2,
          <Card>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Goal Performance</Text>
              <MoreBtn />
            </View>

            {loading ? (
              <View style={{ gap: 10, paddingVertical: 8 }}>
                <Skeleton w="100%" h={44} r={10} />
                <Skeleton w="100%" h={110} r={6} />
              </View>
            ) : (
              <>
                <View style={styles.goalStatus}>
                  <View style={styles.goalIconCircle}>
                    <Text style={{ fontSize: 22 }}>
                      {(data?.completionRate ?? 0) >= 80 ? '🏆' : (data?.completionRate ?? 0) >= 50 ? '🚀' : '💤'}
                    </Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.goalStatusText}>
                      <Text style={{ color: COLORS.orange, fontFamily: FONTS.bold }}>
                        {data?.completionRate ?? 0}%{' '}
                      </Text>
                      completion rate.{' '}
                      {(data?.completionRate ?? 0) >= 80
                        ? 'Exceptional discipline!'
                        : (data?.completionRate ?? 0) >= 50
                        ? 'Almost there, finish strong!'
                        : 'Keep showing up — it builds.'}
                    </Text>
                    <Text style={styles.goalStatusSub}>
                      Focused for{' '}
                      <Text style={{ fontFamily: FONTS.bold, color: COLORS.cream }}>
                        {fmtSec(data?.todayFocusSec ?? 0)}
                      </Text>{' '}{isToday ? 'today' : navLabel(dayOffset)}
                    </Text>
                  </View>
                </View>

                {/* Hourly chart */}
                <View>
                  <View style={styles.barsRow}>
                    {hourBuckets.map((b, i) => (
                      <AnimBar
                        key={i}
                        heightPct={b.minutes / hourMaxMins}
                        maxH={hourBarMaxH}
                        width={hourBarW}
                        isNow={isToday && b.isNow}  // "now" indicator only on today
                        delay={i * 80}
                      />
                    ))}
                    {hourBuckets.length === 0 && (
                      <View style={{ height: hourBarMaxH, flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                        <Text style={styles.emptyChartTxt}>
                          {isToday ? 'No sessions today yet' : 'No sessions this day'}
                        </Text>
                      </View>
                    )}
                  </View>
                  <View style={[styles.barsRow, { marginTop: 6 }]}>
                    {hourBuckets.map((b, i) => (
                      <Text key={i} style={[styles.barXLabel, { width: hourBarW }]}>{b.label}</Text>
                    ))}
                  </View>
                  <View style={styles.legendRow}>
                    {isToday && (
                      <View style={styles.legendItem}>
                        <View style={[styles.legendDot, { backgroundColor: COLORS.red ?? '#FF4444' }]} />
                        <Text style={styles.legendText}>Current hour</Text>
                      </View>
                    )}
                    <View style={styles.legendItem}>
                      <View style={[styles.legendDot, { backgroundColor: COLORS.amber }]} />
                      <Text style={styles.legendText}>Already logged</Text>
                    </View>
                  </View>
                </View>
              </>
            )}
          </Card>
        )}

        {/* ══ 3. FOCUS STREAK ══ */}
        {sec(3,
          <Card>
            <View style={styles.cardHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={{ fontSize: 22 }}>🔥</Text>
                <Text style={styles.cardTitle}>
                  {streak > 0 ? `${streak} day streak` : 'No streak yet'}
                </Text>
              </View>
              <MoreBtn />
            </View>

            {loading ? (
              <View style={{ flexDirection: 'row', gap: 6, justifyContent: 'space-between' }}>
                {Array(7).fill(0).map((_, i) => <Skeleton key={i} w={38} h={56} r={19} />)}
              </View>
            ) : (
              <View style={styles.streakRow}>
                {(data?.streakDays ?? []).map((d, i) => (
                  <View key={i} style={styles.streakCol}>
                    <View style={[
                      styles.streakCircle,
                      d.done && styles.streakCircleDone,
                      d.isToday && !d.done && styles.streakCircleToday,
                    ]}>
                      {d.done
                        ? <Text style={styles.streakCheck}>✓</Text>
                        : d.isToday
                        ? <Text style={styles.streakToday}>·</Text>
                        : null
                      }
                    </View>
                    <Text style={[styles.streakLabel, d.done && { color: COLORS.orange }]}>{d.label}</Text>
                  </View>
                ))}
              </View>
            )}
          </Card>
        )}

        {/* ══ 4. PATTERN OF YOUR FOCUS (heatmap) ══ */}
        {sec(4,
          <Card>
            <Text style={styles.cardTitle}>The Pattern of Your Focus</Text>

            <View style={styles.patternStats}>
              <View>
                <Text style={styles.patternVal}>{data?.allTimeSessions ?? '—'}</Text>
                <Text style={styles.patternLbl}>Sessions</Text>
              </View>
              <View style={styles.patternDivider} />
              <View>
                <Text style={styles.patternVal}>{fmtSec(data?.allTimeFocusSec ?? 0)}</Text>
                <Text style={styles.patternLbl}>All time focused</Text>
              </View>
            </View>

            {loading ? (
              <Skeleton w="100%" h={120} r={6} />
            ) : (
              <View style={{ marginTop: 4 }}>
                <View style={{ flexDirection: 'row', marginLeft: 20, marginBottom: 4, position: 'relative', height: 18 }}>
                  {HM_MONTH_LABELS.map(m => (
                    <Text key={m.label} style={[styles.hmMonthLabel, { left: m.col * (HM_CELL + HM_GAP) }]}>
                      {m.label}
                    </Text>
                  ))}
                </View>
                <View style={{ position: 'relative' }}>
                  {HM_ROW_LABELS.map((lbl, ri) => (
                    <View key={ri} style={[styles.hmRow, { marginBottom: HM_GAP }]}>
                      <Text style={styles.hmRowLabel}>{lbl}</Text>
                      {hmGrid[ri].map((mins, ci) => (
                        <View
                          key={ci}
                          style={{
                            width: HM_CELL, height: HM_CELL,
                            borderRadius: 3,
                            backgroundColor: heatColor(mins),
                            marginRight: ci < HM_COLS - 1 ? HM_GAP : 0,
                            borderWidth: mins === 0 ? 1 : 0,
                            borderColor: 'rgba(255,255,255,0.04)',
                          }}
                        />
                      ))}
                    </View>
                  ))}
                </View>
                <View style={styles.hmLegend}>
                  <Text style={styles.legendText}>Less</Text>
                  {[0, 15, 45, 90, 120].map(m => (
                    <View key={m} style={[styles.hmLegendCell, { backgroundColor: heatColor(m) }]} />
                  ))}
                  <Text style={styles.legendText}>More</Text>
                </View>
              </View>
            )}

            <View style={[styles.motiveBanner, { marginTop: 14 }]}>
              <Text style={styles.motiveEmoji}>🌱</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.motiveTitle}>
                  {streak > 3 ? `${streak} day streak — don't break it.` : "You've made a start."}
                </Text>
                <Text style={styles.motiveSub}>
                  {streak > 0
                    ? 'Each session you do today deepens that pattern.'
                    : 'Continue today to shape your pattern.'}
                </Text>
              </View>
            </View>
          </Card>
        )}

        {/* ══ 5. WEEKLY CHART ══ */}
        
{sec(5,
  <Card style={{ paddingBottom: 24 }}>

    {/* Header — no tabs, just the label */}
    <View style={styles.chartSubHead}>
      <Text style={styles.chartSubLbl}>FOCUS TIME THIS WEEK</Text>
    </View>

    {loading ? (
      <Skeleton w="100%" h={wkBarMaxH + 40} r={6} />
    ) : (() => {
      // Re-derive bar values directly from session data so they're always live.
      // For each day in weekBars, sum duration_minutes of sessions that started
      // on that ISO date. Falls back to weekBars[i].minutes if no session data.
      const barValues: number[] = weekBars.map(b => {
        if (data?.recentSessions) {
          const dayTotal = data.recentSessions
            .filter(s => s.started_at.slice(0, 10) === b.isoDate)
            .reduce((sum, s) => sum + ((s.elapsed_sec/60)), 0);
          // If sessions exist for the week but this day has 0, that's valid —
          // only fall back to b.minutes if recentSessions is missing entirely.
          return dayTotal;
        }
        return b.minutes ?? 0;
      });

      const maxVal = Math.max(...barValues, 1); // never divide by zero

      // Y-axis labels derived from actual max, not a hardcoded 120
      const yStep = maxVal <= 30 ? 10
                  : maxVal <= 60 ? 15
                  : maxVal <= 120 ? 30
                  : maxVal <= 240 ? 60
                  : 120;
      const yMax  = Math.ceil(maxVal / yStep) * yStep;
      const yLabels = [yMax, yMax * 0.75, yMax * 0.5, yMax * 0.25, 0]
        .map(v => v >= 60
          ? `${Math.round(v / 60)}h`
          : `${Math.round(v)}m`
        );

        console.log('barValues', barValues, 'maxVal', maxVal, 'yMax', yMax);
      return (
        <View style={styles.weekChartWrap}>
          {/* Y-axis */}
          <View style={styles.yAxis}>
            {yLabels.map((l, i) => (
              <Text key={i} style={styles.yLabel}>{l}</Text>
            ))}
          </View>

          <View style={{ flex: 1 }}>
            {/* Grid lines */}
            <Svg width="100%" height={wkBarMaxH} style={{ position: 'absolute', top: 0 }}>
              {[0, 0.25, 0.5, 0.75, 1].map(t => (
                <Line key={t}
                  x1="0" y1={wkBarMaxH * (1 - t)} x2="100%" y2={wkBarMaxH * (1 - t)}
                  stroke="rgba(255,255,255,0.06)" strokeWidth={1}
                />
              ))}
            </Svg>

            {/* Bars */}
            <View style={[styles.weekBarsRow, { height: wkBarMaxH }]}>
              {weekBars.map((b, i) => (
                <AnimBar
                  key={`focusonly-${i}-${barValues[i]}`}
                  heightPct={barValues[i] / yMax}
                  maxH={wkBarMaxH}
                  width={wkBarW}
                  isToday={b.isToday}
                  delay={i * 55}
                />
              ))}
            </View>

            {/* Day labels */}
            <View style={[styles.weekBarsRow, { marginTop: 8 }]}>
              {weekBars.map((b, i) => (
                <View key={i} style={{ width: wkBarW, alignItems: 'center' }}>
                  <Text style={[styles.weekDayLbl, b.isToday && styles.weekDayLblActive]}>
                    {b.day.slice(0, 3)}
                  </Text>
                  <Text style={[styles.weekDateLbl, b.isToday && styles.weekDayLblActive]}>
                    {b.date}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      );
    })()}
  </Card>
)}


        {/* ══ 6. RECENT SESSIONS ══ */}
        {sec(6,
          <Card>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Recent Sessions</Text>
              <MoreBtn />
            </View>

            {loading ? (
              <View style={{ gap: 14 }}>
                {[0, 1, 2].map(i => <Skeleton key={i} w="100%" h={48} r={8} />)}
              </View>
            ) : (data?.recentSessions?.length ?? 0) === 0 ? (
              <View style={styles.emptyWrap}>
                <Text style={styles.emptyEmoji}>🔥</Text>
                <Text style={styles.emptyTxt}>
                  {isToday
                    ? 'No sessions yet — start your first focus block.'
                    : `No sessions on ${navLabel(dayOffset)}.`}
                </Text>
              </View>
            ) : (
              (data?.recentSessions ?? []).map((s, i) => (
                <View key={s.id} style={[
                  styles.sessionRow,
                  i < (data!.recentSessions.length - 1) && styles.sessionRowBorder,
                ]}>
                  <View style={styles.sessionLeft}>
                    <Text style={styles.sessionGoal} numberOfLines={1}>{s.goal}</Text>
                    <Text style={styles.sessionTime}>{fmtTime(s.started_at)}</Text>
                  </View>
                  <View style={styles.sessionRight}>
                    <Text style={styles.sessionDur}>{fmtSec(s.elapsed_sec)}</Text>
                    <View style={styles.sessionDots}>
                      {[1, 2, 3, 4].map(dot => (
                        <View key={dot} style={[
                          styles.sessionDot,
                          { backgroundColor: dot <= sessionScore(s) ? COLORS.orange : COLORS.surface2 },
                        ]} />
                      ))}
                    </View>
                  </View>
                </View>
              ))
            )}
          </Card>
        )}

        <View style={{ height: 120 }} />
      </ScrollView>
    </View>
  );
}

// ─── Heatmap month labels ─────────────────────────────────────────────────────
function buildMonthLabels() {
  const labels: { label: string; col: number }[] = [];
  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  let lastMonth = -1;
  for (let col = 0; col < 14; col++) {
    const weeksAgo = 13 - col;
    const d = new Date(); d.setDate(d.getDate() - weeksAgo * 7);
    const m = d.getMonth();
    if (m !== lastMonth) {
      labels.push({ label: MONTHS[m], col });
      lastMonth = m;
    }
  }
  return labels;
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root:         { flex: 1, backgroundColor: COLORS.bg },
  scroll:       { flex: 1 },
  scrollContent: { paddingHorizontal: H_PAD, paddingBottom: 40 },

  card: {
    backgroundColor: COLORS.surface, borderRadius: RADII.xxl,
    padding: 20, marginBottom: 14,
    borderWidth: 1, borderColor: COLORS.border,
  },

  // Header
  header:       { marginBottom: 20 },
  headerTitle:  { fontFamily: FONTS.black, fontSize: 32, color: COLORS.cream, letterSpacing: -0.5 },
  dateNav:      { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12 },

  navBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: COLORS.surface2, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: COLORS.border,
  },
  navBtnOff:    { opacity: 0.28 },
  navArrow:     { fontFamily: FONTS.bold, fontSize: 20, color: COLORS.cream, lineHeight: 22 },
  navArrowOff:  { color: COLORS.faint },

  datePillWrap: { flex: 1 },
  datePill: {
    alignItems: 'center', paddingVertical: 9,
    backgroundColor: COLORS.surface2, borderRadius: RADII.pill,
    borderWidth: 1, borderColor: COLORS.border,
    overflow: 'hidden',
  },
  datePillPast: {
    borderColor: 'rgba(255,107,26,0.30)',
  },
  dateText:     { fontFamily: FONTS.bold, fontSize: 15, color: COLORS.cream },
  dateTextPast: { color: COLORS.amber },
  dateTodayHint:{ fontFamily: FONTS.regular, fontSize: 10, color: 'rgba(255,107,26,0.55)', marginTop: 1 },

  pastHint: {
    fontFamily: FONTS.regular, fontSize: 11,
    color: 'rgba(255,107,26,0.45)',
    marginTop: 7, textAlign: 'center',
  },

  // Card header
  cardHeader:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  cardTitle:    { fontFamily: FONTS.bold, fontSize: 16, color: COLORS.cream },
  pill: {
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
    borderRadius: RADII.pill, paddingHorizontal: 14, paddingVertical: 6,
  },
  pillTxt:      { fontFamily: FONTS.bold, fontSize: 12, color: COLORS.cream },
  iconBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: COLORS.surface2, alignItems: 'center', justifyContent: 'center',
  },
  moreBtn: {
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
    borderRadius: RADII.pill, paddingHorizontal: 14, paddingVertical: 6,
  },
  moreTxt:      { fontFamily: FONTS.bold, fontSize: 12, color: COLORS.cream },

  // Summary
  heroTime:     { fontFamily: FONTS.black, fontSize: 52, color: COLORS.orange, letterSpacing: -1, textAlign: 'center' },
  heroLabel:    { fontFamily: FONTS.bold, fontSize: 18, color: COLORS.orange, textAlign: 'center', marginBottom: 14 },
  subStats:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 16 },
  subStat:      { fontFamily: FONTS.regular, fontSize: 13, color: COLORS.muted },
  subStatVal:   { fontFamily: FONTS.bold, color: COLORS.cream },
  subStatDot:   { width: 4, height: 4, borderRadius: 2, backgroundColor: COLORS.muted },

  motiveBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: 'rgba(255,107,26,0.10)',
    borderRadius: RADII.lg, padding: 14,
    borderWidth: 1, borderColor: 'rgba(255,107,26,0.18)',
  },
  motiveEmoji:  { fontSize: 28 },
  motiveTitle:  { fontFamily: FONTS.bold, fontSize: 14, color: COLORS.cream, marginBottom: 2 },
  motiveSub:    { fontFamily: FONTS.regular, fontSize: 12, color: COLORS.muted, lineHeight: 17 },

  // Goal performance
  goalStatus:     { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  goalIconCircle: {
    width: 50, height: 50, borderRadius: 25,
    backgroundColor: 'rgba(100,120,200,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  goalStatusText: { fontFamily: FONTS.regular, fontSize: 15, color: COLORS.cream, lineHeight: 21 },
  goalStatusSub:  { fontFamily: FONTS.regular, fontSize: 12, color: COLORS.muted, marginTop: 3 },

  // Charts shared
  barsRow:       { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  barXLabel:     { fontFamily: FONTS.regular, fontSize: 10, color: COLORS.muted, textAlign: 'center' },
  legendRow:     { flexDirection: 'row', gap: 20, marginTop: 10 },
  legendItem:    { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot:     { width: 10, height: 10, borderRadius: 5 },
  legendText:    { fontFamily: FONTS.regular, fontSize: 11, color: COLORS.muted },
  emptyChartTxt: { fontFamily: FONTS.regular, fontSize: 13, color: COLORS.faint, textAlign: 'center' },

  // Streak
  streakRow:   { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  streakCol:   { alignItems: 'center', gap: 6 },
  streakCircle: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: COLORS.surface2,
    borderWidth: 1, borderColor: COLORS.border,
    alignItems: 'center', justifyContent: 'center',
  },
  streakCircleDone:  { backgroundColor: COLORS.red ?? '#FF4444', borderColor: COLORS.red ?? '#FF4444' },
  streakCircleToday: { borderColor: COLORS.orange, borderWidth: 2 },
  streakCheck:       { fontFamily: FONTS.bold, fontSize: 16, color: '#fff' },
  streakToday:       { fontFamily: FONTS.bold, fontSize: 20, color: COLORS.orange, lineHeight: 22 },
  streakLabel:       { fontFamily: FONTS.regular, fontSize: 11, color: COLORS.muted },

  // Heatmap
  patternStats:   { flexDirection: 'row', alignItems: 'center', gap: 20, marginTop: 8, marginBottom: 16 },
  patternVal:     { fontFamily: FONTS.black, fontSize: 28, color: COLORS.cream },
  patternLbl:     { fontFamily: FONTS.regular, fontSize: 12, color: COLORS.muted, marginTop: 2 },
  patternDivider: { width: 1, height: 36, backgroundColor: 'rgba(255,255,255,0.08)' },
  hmMonthLabel:   { position: 'absolute', fontFamily: FONTS.regular, fontSize: 10, color: COLORS.muted },
  hmRow:          { flexDirection: 'row', alignItems: 'center' },
  hmRowLabel:     { fontFamily: FONTS.regular, fontSize: 10, color: COLORS.muted, width: 16 },
  hmLegend:       { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 10, flexWrap: 'wrap' },
  hmLegendCell:   { width: 13, height: 13, borderRadius: 2 },

  // Tabs
  tabRow:         { flexDirection: 'row', borderBottomWidth: 1, borderColor: COLORS.border, marginBottom: 14 },
  tabBtn:         { flex: 1, alignItems: 'center', paddingBottom: 10, position: 'relative' },
  tabTxt:         { fontFamily: FONTS.bold, fontSize: 15, color: COLORS.muted },
  tabTxtActive:   { color: COLORS.cream },
  tabUnderline:   {
    position: 'absolute', bottom: -1, left: '15%', right: '15%',
    height: 2, backgroundColor: COLORS.cream, borderRadius: 1,
  },
  chartSubHead:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  chartSubLbl:    { fontFamily: FONTS.regular, fontSize: 11, color: COLORS.muted, letterSpacing: 0.5 },
  tagsBtn:        {
    backgroundColor: COLORS.surface2, borderRadius: RADII.md,
    paddingHorizontal: 14, paddingVertical: 7,
  },
  tagsTxt:        { fontFamily: FONTS.bold, fontSize: 13, color: COLORS.cream },
  weekChartWrap:  { flexDirection: 'row', gap: 8 },
  yAxis:          { width: 44, justifyContent: 'space-between', paddingBottom: 30 },
  yLabel:         { fontFamily: FONTS.regular, fontSize: 10, color: COLORS.muted, textAlign: 'right' },
  weekBarsRow:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  weekDayLbl:     { fontFamily: FONTS.regular, fontSize: 11, color: COLORS.muted },
  weekDateLbl:    { fontFamily: FONTS.regular, fontSize: 12, color: COLORS.muted },
  weekDayLblActive:{ fontFamily: FONTS.bold, color: COLORS.cream },

  // Recent sessions
  sessionRow:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 },
  sessionRowBorder:{ borderBottomWidth: 1, borderColor: COLORS.border },
  sessionLeft:     { flex: 1, marginRight: 12 },
  sessionGoal:     { fontFamily: FONTS.bold, fontSize: 14, color: COLORS.cream },
  sessionTime:     { fontFamily: FONTS.regular, fontSize: 11, color: COLORS.muted, marginTop: 2 },
  sessionRight:    { alignItems: 'flex-end', gap: 5 },
  sessionDur:      { fontFamily: FONTS.bold, fontSize: 14, color: COLORS.amber },
  sessionDots:     { flexDirection: 'row', gap: 3 },
  sessionDot:      { width: 7, height: 7, borderRadius: 3.5 },

  // Empty / error
  emptyWrap:  { alignItems: 'center', paddingVertical: 24 },
  emptyEmoji: { fontSize: 36, marginBottom: 10 },
  emptyTxt:   { fontFamily: FONTS.regular, fontSize: 14, color: COLORS.muted, textAlign: 'center', lineHeight: 20 },
});
