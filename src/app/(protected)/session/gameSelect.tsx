/**
 * Ember – GameSelectScreen.tsx
 *
 * WHERE THIS LIVES:
 *   app/(protected)/session/game-select.tsx
 *
 * It's a full screen (not a modal) that sits inside the session folder
 * so it shares the session navigation context.
 *
 * NAVIGATION:
 *   Push to here from checkpoint.tsx:
 *     router.push('/session/game-select');
 *
 *   Each game card navigates to its own screen:
 *     router.push('/session/games/breathe');
 *     router.push('/session/games/dots');
 *     router.push('/session/games/trace');
 *     router.push('/session/games/color-match');
 *     router.push('/session/games/stack');
 *
 *   The X button goes back to checkpoint:
 *     router.back();
 */

import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  useFonts,
  Nunito_800ExtraBold,
  Nunito_700Bold,
  Nunito_400Regular,
} from '@expo-google-fonts/nunito';
import { useSessionStore, selectTimeDisplay } from '../../../store/sessionStore';
import { COLORS, FONTS } from '../../../theme';
import { BreakStatusBar } from '../../../components/BreakStatusBar';

const { width } = Dimensions.get('window');

// ─── Game definitions ─────────────────────────────────────────────────────────
const GAMES = [
  {
    id:       'breathe',
    emoji:    '🫁',
    name:     'Breathing Orb',
    desc:     'Sync your breath to the orb. Drops fatigue fast.',
    tag:      'CALM',
    tagStyle: 'calm',
    extra:    'RECOMMENDED',
    route:    '/session/games/breathe',
    featured: true,
    barColors:['#4488CC', '#88CCFF'] as [string, string],
  },
  {
    id:       'dots',
    emoji:    '🔴',
    name:     'Pop the Dots',
    desc:     'Tap glowing circles before they fade',
    tag:      'REFLEX',
    tagStyle: 'reflex',
    route:    '/session/games/dots',
    featured: false,
    barColors:['#FF6B1A', '#FFD166'] as [string, string],
  },
  {
    id:       'trace',
    emoji:    '✦',
    name:     'Trace the Path',
    desc:     'Follow a flowing line with your finger',
    tag:      'ZEN',
    tagStyle: 'zen',
    route:    '/session/games/trace',
    featured: false,
    barColors:['#7755CC', '#BB99FF'] as [string, string],
  },
  {
    id:       'simon',
    emoji:    '🎨',
    name:     'Simon Says',
    desc:     'Tap the color that matches the word',
    tag:      'FOCUS',
    tagStyle: 'focus',
    route:    '/session/games/simon',
    featured: false,
    barColors:['#FFAA33', '#FFD166'] as [string, string],
  },
  {
    id:       'stack',
    emoji:    '📦',
    name:     'Stack Blocks',
    desc:     'Drop blocks on the platform. 5 drops.',
    tag:      'REWARD',
    tagStyle: 'reward',
    route:    '/session/games/stack',
    featured: false,
    barColors:['#44AA77', '#66DD99'] as [string, string],
  },
  {
    id:       'snake',
    emoji:    '🐍',
    name:     'Snake',
    desc:     'Navigate the snake to eat food.',
    tag:      'REWARD',
    tagStyle: 'reward',
    route:    '/session/games/snake',
    featured: false,
    barColors:['#44AA77', '#66DD99'] as [string, string],
  },
  {
    id:       'clean',
    emoji:    '🧹',
    name:     'Clean Up',
    desc:     'Clear the screen of all items.',
    tag:      'CLEAN',
    tagStyle: 'clean',
    route:    '/session/games/clean',
    featured: false,
    barColors:['#44AA77', '#66DD99'] as [string, string],
  },
] as const;

// Tag color map
const TAG_STYLES: Record<string, { bg: string; color: string; border: string }> = {
  calm:  { bg: 'rgba(68,136,204,0.15)',  color: '#88CCFF', border: 'rgba(68,136,204,0.30)' },
  reflex:{ bg: 'rgba(255,107,26,0.15)',  color: '#FF8844', border: 'rgba(255,107,26,0.30)' },
  zen:   { bg: 'rgba(119,85,204,0.18)',  color: '#BB99FF', border: 'rgba(119,85,204,0.35)' },
  focus: { bg: 'rgba(255,170,51,0.15)',  color: '#FFCC55', border: 'rgba(255,170,51,0.30)' },
  reward:{ bg: 'rgba(68,170,119,0.15)',  color: '#66DD99', border: 'rgba(68,170,119,0.30)' },
};

export default function GameSelectScreen() {
  const insets     = useSafeAreaInsets();
  const timeDisplay = useSessionStore(selectTimeDisplay);

  const [fontsLoaded] = useFonts({
    Nunito_800ExtraBold,
    Nunito_700Bold,
    Nunito_400Regular,
  });

  // ── Staggered entry animations ─────────────────────────────────────────────
  const fadeIn     = useRef(new Animated.Value(0)).current;
  const cardAnims  = useRef(GAMES.map(() => ({
    opacity:   new Animated.Value(0),
    translateY: new Animated.Value(18),
  }))).current;

  useEffect(() => {
    Animated.timing(fadeIn, { toValue: 1, duration: 400, useNativeDriver: true }).start();

    Animated.stagger(
      70,
      cardAnims.map(({ opacity, translateY }) =>
        Animated.parallel([
          Animated.timing(opacity,    { toValue: 1, duration: 380, easing: Easing.out(Easing.quad), useNativeDriver: true }),
          Animated.timing(translateY, { toValue: 0, duration: 380, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        ])
      )
    ).start();
  }, [cardAnims, fadeIn]);

  if (!fontsLoaded) return null;

  const featured = GAMES[0];
  const grid     = GAMES.slice(1); // 4 cards in 2x2

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Background */}
      <LinearGradient
        colors={['#0F0804', '#1A0E06', '#120A04']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 32 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeIn }}>

          {/* ── Header ── */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={styles.eyebrow}>CHECKPOINT BREAK</Text>
              <View style={styles.titleRow}>
                <Text style={styles.title}>Choose a game </Text>
                <Text style={styles.titleEmoji}>🎮</Text>
              </View>
              <Text style={styles.sub}>2 minutes to reset your brain</Text>
            </View>

            {/* X button */}
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => router.back()}
              activeOpacity={0.75}
            >
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* ── Session still running pill ── */}
          <BreakStatusBar />

          {/* ── Featured card: Breathing Orb ── */}
          <Animated.View style={{
            opacity:   cardAnims[0].opacity,
            transform: [{ translateY: cardAnims[0].translateY }],
            marginBottom: 12,
          }}>
            <TouchableOpacity
              style={styles.featuredCard}
              activeOpacity={0.82}
              onPress={() => router.push(featured.route as any)}
            >
              {/* Subtle glow */}
              <View style={styles.featuredGlow} />

              <Text style={styles.featuredEmoji}>{featured.emoji}</Text>

              <View style={styles.featuredInfo}>
                <Text style={styles.cardName}>{featured.name}</Text>
                <Text style={styles.cardDesc}>{featured.desc}</Text>
                <View style={styles.tagsRow}>
                  <Tag label={featured.tag} style={featured.tagStyle} />
                  {featured.extra && (
                    <Tag label={featured.extra} style="extra" />
                  )}
                </View>
              </View>

              <Text style={styles.featuredArrow}>›</Text>
            </TouchableOpacity>
          </Animated.View>

          {/* ── 2×2 grid ── */}
          <View style={styles.grid}>
            {grid.map((game, i) => {
              const anim = cardAnims[i + 1];
              return (
                <Animated.View
                  key={game.id}
                  style={[
                    styles.gridItemWrap,
                    {
                      opacity:   anim.opacity,
                      transform: [{ translateY: anim.translateY }],
                    },
                  ]}
                >
                  <TouchableOpacity
                    style={styles.gridCard}
                    activeOpacity={0.80}
                    onPress={() => router.push(game.route as any)}
                  >
                    {/* Corner glow blob */}
                    <View style={[
                      styles.gridGlow,
                      { backgroundColor: game.barColors[0] },
                    ]} />

                    <Text style={styles.gridEmoji}>{game.emoji}</Text>
                    <Text style={styles.cardName}>{game.name}</Text>
                    <Text style={styles.cardDesc}>{game.desc}</Text>

                    <View style={styles.tagsRow}>
                      <Tag label={game.tag} style={game.tagStyle} />
                    </View>

                    {/* Accent bar */}
                    <LinearGradient
                      colors={game.barColors}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.accentBar}
                    />
                  </TouchableOpacity>
                </Animated.View>
              );
            })}
          </View>

        </Animated.View>
      </ScrollView>
    </View>
  );
}

// ─── Tag chip ─────────────────────────────────────────────────────────────────
function Tag({ label, style }: { label: string; style: string }) {
  const s = style === 'extra'
    ? { bg: 'rgba(255,209,102,0.12)', color: '#FFD166', border: 'rgba(255,209,102,0.28)' }
    : TAG_STYLES[style] ?? TAG_STYLES.calm;

  return (
    <View style={[
      tagStyles.chip,
      { backgroundColor: s.bg, borderColor: s.border },
    ]}>
      <Text style={[tagStyles.label, { color: s.color }]}>{label}</Text>
    </View>
  );
}

const tagStyles = StyleSheet.create({
  chip:  {
    paddingHorizontal: 9,
    paddingVertical:   4,
    borderRadius:      6,
    borderWidth:       1,
    marginRight:       6,
    marginTop:         8,
  },
  label: { fontFamily: FONTS.bold, fontSize: 10, letterSpacing: 0.6 },
});

// ─── Styles ───────────────────────────────────────────────────────────────────
const CARD_GAP = 10;
const GRID_CARD_W = (width - 48 - CARD_GAP) / 2; // 24px side padding each side

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0F0804' },

  scroll:        { flex: 1 },
  scrollContent: { paddingHorizontal: 20 },

  // Header
  header: {
    flexDirection:  'row',
    alignItems:     'flex-start',
    justifyContent: 'space-between',
    marginBottom:   20,
  },
  headerLeft:  { flex: 1 },
  eyebrow:     {
    fontFamily:    FONTS.bold,
    fontSize:      11,
    letterSpacing: 2.5,
    color:         'rgba(255,244,230,0.38)',
    textTransform: 'uppercase',
    marginBottom:  6,
  },
  titleRow:    { flexDirection: 'row', alignItems: 'center', marginBottom: 5 },
  title:       { fontFamily: FONTS.black, fontSize: 28, color: COLORS.cream, letterSpacing: -0.5 },
  titleEmoji:  { fontSize: 26 },
  sub:         { fontFamily: FONTS.regular, fontSize: 14, color: 'rgba(255,244,230,0.45)' },

  closeBtn: {
    width:           36,
    height:          36,
    borderRadius:    18,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth:     1,
    borderColor:     'rgba(255,255,255,0.10)',
    alignItems:      'center',
    justifyContent:  'center',
    marginTop:       4,
  },
  closeBtnText: {
    fontFamily: FONTS.bold,
    fontSize:   14,
    color:      'rgba(255,244,230,0.45)',
  },

  // Session pill
  sessionPill: {
    flexDirection:   'row',
    alignItems:      'center',
    backgroundColor: 'rgba(255,107,26,0.10)',
    borderWidth:     1,
    borderColor:     'rgba(255,107,26,0.22)',
    borderRadius:    14,
    paddingHorizontal: 16,
    paddingVertical:   13,
    marginBottom:    20,
  },
  sessionDot: {
    width:           8,
    height:          8,
    borderRadius:    4,
    backgroundColor: COLORS.orange,
    marginRight:     10,
  },
  sessionPillText: {
    fontFamily: FONTS.regular,
    fontSize:   14,
    color:      'rgba(255,244,230,0.65)',
    flex:       1,
  },
  sessionPillTime: {
    fontFamily: FONTS.bold,
    fontSize:   16,
    color:      COLORS.orange,
    letterSpacing: 1,
  },

  // Featured card
  featuredCard: {
    flexDirection:   'row',
    alignItems:      'center',
    backgroundColor: '#211208',
    borderRadius:    18,
    borderWidth:     1.5,
    borderColor:     'rgba(255,107,26,0.20)',
    padding:         18,
    overflow:        'hidden',
    position:        'relative',
  },
  featuredGlow: {
    position:        'absolute',
    top:             -40,
    left:            -40,
    width:           120,
    height:          120,
    borderRadius:    60,
    backgroundColor: 'rgba(255,107,26,0.08)',
  },
  featuredEmoji: { fontSize: 42, marginRight: 16 },
  featuredInfo:  { flex: 1 },
  featuredArrow: {
    fontFamily: FONTS.bold,
    fontSize:   22,
    color:      'rgba(255,244,230,0.22)',
    marginLeft: 8,
  },

  // Grid
  grid: {
    flexDirection: 'row',
    flexWrap:      'wrap',
    gap:           CARD_GAP,
  },
  gridItemWrap: { width: GRID_CARD_W },
  gridCard: {
    backgroundColor: '#1C1008',
    borderRadius:    18,
    borderWidth:     1.5,
    borderColor:     'rgba(255,255,255,0.07)',
    padding:         16,
    overflow:        'hidden',
    position:        'relative',
    minHeight:       170,
  },
  gridGlow: {
    position:   'absolute',
    top:        -30,
    right:      -30,
    width:      90,
    height:     90,
    borderRadius: 45,
    opacity:    0.08,
  },
  gridEmoji: { fontSize: 30, marginBottom: 10 },

  // Shared text
  cardName: {
    fontFamily:    FONTS.bold,
    fontSize:      15,
    color:         COLORS.cream,
    marginBottom:  4,
    letterSpacing: -0.2,
  },
  cardDesc: {
    fontFamily: FONTS.regular,
    fontSize:   12,
    color:      'rgba(255,244,230,0.42)',
    lineHeight: 17,
  },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 2 },

  // Accent bar at bottom of grid cards
  accentBar: {
    position:     'absolute',
    bottom:       0,
    left:         0,
    right:        0,
    height:       3,
    borderBottomLeftRadius:  18,
    borderBottomRightRadius: 18,
  },
});
