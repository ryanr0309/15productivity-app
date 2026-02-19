/**
 * services/sessionService.ts
 *
 * All Supabase reads/writes for sessions.
 * Provides everything InsightsScreen needs in one fetch.
 */

import { supabase, getSupabase, getDeviceId } from '../lib/supabase';

// ─── Persist ──────────────────────────────────────────────────────────────────
export interface SessionRecord {
  id?:           string;
  device_id:     string;
  goal:          string;
  started_at:    string;
  completed_at?: string;
  duration_sec:  number;
  elapsed_sec:   number;
  was_completed: boolean;
  checkpoints:   number;
}

// ─── Insights shapes ──────────────────────────────────────────────────────────

export interface RecentSession {
  id:           string;
  goal:         string;
  started_at:   string;   // ISO
  elapsed_sec:  number;
  was_completed:boolean;
  checkpoints:  number;
}

export interface HeatmapDay {
  date:         string;   // 'YYYY-MM-DD'
  minutes:      number;
  sessionCount: number;
}

export interface HourlyBucket {
  label:   string;   // '9 AM', '10 AM' …
  hour:    number;   // 0-23
  minutes: number;
  isNow:   boolean;
}

export interface WeekBar {
  day:     string;   // 'Mon'
  date:    number;   // day-of-month
  isoDate: string;   // 'YYYY-MM-DD'
  minutes: number;
  isToday: boolean;
}

export interface StreakDay {
  label:  string;    // single letter day
  isoDate:string;
  done:   boolean;
  isToday:boolean;
}

export interface InsightsData {
  // Summary card
  todayFocusSec:   number;
  todaySessions:   number;
  todayTotalSec:   number;   // elapsed including break time approx
  todayBreakSec:   number;
  completionRate:  number;   // 0-100

  // Streak
  currentStreak:   number;
  longestStreak:   number;
  streakDays:      StreakDay[];   // last 7 days

  // Goal performance hourly
  hourlyBuckets:   HourlyBucket[];

  // Heatmap (84 days)
  heatmap:         HeatmapDay[];

  // Weekly chart
  weekBars:        WeekBar[];
  weekFocusSec:    number;   // total this week

  // Recent sessions
  recentSessions:  RecentSession[];

  // Totals (all time)
  allTimeSessions: number;
  allTimeFocusSec: number;
}

// ─── Save ─────────────────────────────────────────────────────────────────────
export async function saveSession(params: {
  goal:         string;
  startedAt:    number;
  elapsed:      number;
  durationSec:  number;
  wasCompleted: boolean;
  checkpoints:  number;
}): Promise<void> {
  try {
    const deviceId = await getDeviceId();
    const record: SessionRecord = {
      device_id:    deviceId,
      goal:         params.goal,
      started_at:   new Date(params.startedAt).toISOString(),
      completed_at: params.wasCompleted ? new Date().toISOString() : undefined,
      duration_sec: params.durationSec,
      elapsed_sec:  params.elapsed,
      was_completed:params.wasCompleted,
      checkpoints:  params.checkpoints,
    };
    const { error } = await supabase.from('sessions').insert(record);
    if (error) console.warn('[Ember] saveSession:', error.message);
  } catch (e) {
    console.warn('[Ember] saveSession error:', e);
  }
}

// ─── Fetch all insights in one call ──────────────────────────────────────────
export async function fetchInsights(isoDate?: string): Promise<InsightsData> {
  const empty = emptyInsights();
  try {
    const client = await getSupabase();

    // Pull 90 days — covers heatmap + streak + week chart + today
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 90);

    const { data, error } = await client
      .from('sessions')
      .select('id, goal, started_at, completed_at, duration_sec, elapsed_sec, was_completed, checkpoints')
      .gte('started_at', cutoff.toISOString())
      .order('started_at', { ascending: false });   // newest first

    if (error || !data) return empty;

    const now = new Date();
const activeDate = isoDate ?? toDateStr(now);


    // ── Today's sessions ────────────────────────────────────────────────────
    const daySessions = data.filter(
  r => r.started_at.slice(0, 10) === activeDate
);

  const todayFocusSec = daySessions.reduce((s, r) => s + (r.elapsed_sec ?? 0), 0);

const todayBreakSec = daySessions.reduce(
  (s, r) => s + (r.checkpoints ?? 0) * 120,
  0
);

const todayTotalSec = todayFocusSec + todayBreakSec;


    // ── All-time ────────────────────────────────────────────────────────────
    const allTimeFocusSec = data.reduce((s, r) => s + (r.elapsed_sec ?? 0), 0);
    const completed       = data.filter(r => r.was_completed).length;
    const completionRate  = data.length > 0 ? Math.round((completed / data.length) * 100) : 0;

    // ── Heatmap (84 days, oldest→newest) ───────────────────────────────────
    const dayMap = new Map<string, HeatmapDay>();
    for (let i = 83; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const k = toDateStr(d);
      dayMap.set(k, { date: k, minutes: 0, sessionCount: 0 });
    }
    data.forEach(r => {
      const k = r.started_at.slice(0, 10);
      if (!dayMap.has(k)) return;
      const day = dayMap.get(k)!;
      day.minutes      += Math.round((r.elapsed_sec ?? 0) / 60);
      day.sessionCount += 1;
    });
    const heatmap = Array.from(dayMap.values()); // 84 items, oldest→newest

    // ── Streak ──────────────────────────────────────────────────────────────
    const activeDays = new Set(data.map(r => r.started_at.slice(0, 10)));
    const { currentStreak, longestStreak } = calcStreak(activeDays, activeDate);

    // ── Streak day row (last 7 calendar days, oldest→newest) ────────────────
    const streakDays: StreakDay[] = [];
    const DAY_LETTERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const iso = toDateStr(d);
      streakDays.push({
        label:   DAY_LETTERS[d.getDay()],
        isoDate: iso,
        done:    activeDays.has(iso),
        isToday: iso === activeDate,

      });
    }

    // ── Hourly buckets (today only, 9am–9pm window or actual range) ─────────
    const hourlyMap = new Map<number, number>();
    daySessions.forEach(r => {
      const h = new Date(r.started_at).getHours();
      hourlyMap.set(h, (hourlyMap.get(h) ?? 0) + Math.round((r.elapsed_sec ?? 0) / 60));
    });
    const nowHour = now.getHours();
    // Show a 5-hour window ending at current hour
    const hourlyBuckets: HourlyBucket[] = [];
    for (let i = 4; i >= 0; i--) {
      const h = ((nowHour - i) + 24) % 24;
      const label = h === 0 ? '12 AM' : h < 12 ? `${h} AM` : h === 12 ? '12 PM' : `${h - 12} PM`;
      hourlyBuckets.push({
        label,
        hour:    h,
        minutes: hourlyMap.get(h) ?? 0,
        isNow:   h === nowHour,
      });
    }

    // ── Weekly bars (Sun–Sat of current week) ───────────────────────────────
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay()); // back to Sunday
    const WEEK_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const weekBars: WeekBar[] = [];
    let weekFocusSec = 0;
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStart); d.setDate(weekStart.getDate() + i);
      const iso = toDateStr(d);
      const mins = dayMap.get(iso)?.minutes ?? 0;
      weekFocusSec += mins * 60;
      weekBars.push({
        day:     WEEK_DAYS[i],
        date:    d.getDate(),
        isoDate: iso,
        minutes: mins,
        isToday: iso === activeDate,

      });
    }

    // ── Recent sessions (last 5) ─────────────────────────────────────────────
    const recentSessions: RecentSession[] = data.slice(0, 5).map(r => ({
      id:           r.id,
      goal:         r.goal,
      started_at:   r.started_at,
      elapsed_sec:  r.elapsed_sec,
      was_completed:r.was_completed,
      checkpoints:  r.checkpoints,
    }));

    return {
      todayFocusSec,
      todaySessions:   daySessions.length,
      todayTotalSec,
      todayBreakSec,
      completionRate,
      currentStreak,
      longestStreak,
      streakDays,
      hourlyBuckets,
      heatmap,
      weekBars,
      weekFocusSec,
      recentSessions,
      allTimeSessions: data.length,
      allTimeFocusSec,
    };
  } catch (e) {
    console.warn('[Ember] fetchInsights error:', e);
    return empty;
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function toDateStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function calcStreak(activeDays: Set<string>, today: string) {
  let currentStreak = 0;
  let longestStreak = 0;
  let streak        = 0;
  const checking    = new Date();
  if (!activeDays.has(today)) checking.setDate(checking.getDate() - 1);

  for (let i = 0; i < 90; i++) {
    const k = toDateStr(checking);
    if (activeDays.has(k)) {
      streak++;
      if (i === 0 || currentStreak > 0) currentStreak = streak;
    } else {
      longestStreak = Math.max(longestStreak, streak);
      streak = 0;
      if (currentStreak > 0) break;
    }
    checking.setDate(checking.getDate() - 1);
  }
  longestStreak = Math.max(longestStreak, streak);
  if (currentStreak === 0 && streak > 0) currentStreak = streak;
  return { currentStreak, longestStreak };
}

function emptyInsights(): InsightsData {
  return {
    todayFocusSec: 0, todaySessions: 0, todayTotalSec: 0, todayBreakSec: 0,
    completionRate: 0, currentStreak: 0, longestStreak: 0,
    streakDays: [], hourlyBuckets: [], heatmap: [], weekBars: [],
    weekFocusSec: 0, recentSessions: [], allTimeSessions: 0, allTimeFocusSec: 0,
  };
}

// ─── Formatters (used by InsightsScreen) ─────────────────────────────────────
export function fmtSec(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0)          return `${h}h`;
  return `${m}m`;
}

export function fmtTime(isoString: string): string {
  const d = new Date(isoString);
  const h = d.getHours();
  const m = d.getMinutes().toString().padStart(2, '0');
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${m} ${ampm}`;
}

// Heatmap level 0-4 from minutes
export function heatLevel(minutes: number): number {
  if (minutes === 0)  return 0;
  if (minutes < 20)   return 1;
  if (minutes < 45)   return 2;
  if (minutes < 90)   return 3;
  return 4;
}

export function heatColor(minutes: number): string {
  const map: Record<number, string> = {
    0: '#1E1812',
    1: '#5C2A0A',
    2: '#A04818',
    3: '#FF6B1A',
    4: '#FFD166',
  };
  return map[heatLevel(minutes)] ?? map[0];
}

// Session quality score 1-4 based on completion + duration
export function sessionScore(s: RecentSession): number {
  if (!s.was_completed) return 1;
  const mins = s.elapsed_sec / 60;
  if (mins >= 60) return 4;
  if (mins >= 30) return 3;
  if (mins >= 15) return 2;
  return 1;
}

// Motivational banner copy based on today's focus
export function motivationCopy(focusSec: number, sessions: number): { emoji: string; title: string; sub: string } {
  if (sessions === 0)  return { emoji: '🌅', title: 'Start your first session', sub: 'Every great day starts with a single focus block.' };
  if (focusSec < 1800) return { emoji: '🌱', title: "You've made a start.", sub: 'Continue today to build your streak.' };
  if (focusSec < 3600) return { emoji: '🔥', title: 'Good momentum!', sub: "You're building focus muscle today." };
  if (focusSec < 7200) return { emoji: '🚀', title: 'Good Flow in Progress', sub: "You're making today count with deep focus." };
  return { emoji: '🏆', title: 'Elite focus day', sub: "You're in the top tier. Keep it going." };
}
