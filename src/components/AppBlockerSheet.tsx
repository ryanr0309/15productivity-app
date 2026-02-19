/**
 * components/AppBlockerSheet.tsx
 *
 * Reusable bottom sheet for selecting / updating blocked apps.
 * Uses the native DeviceActivitySelectionView from react-native-device-activity.
 *
 * USAGE — from HomeScreen:
 *   const [blockerOpen, setBlockerOpen] = useState(false);
 *   <AppBlockerSheet visible={blockerOpen} onClose={() => setBlockerOpen(false)} />
 *
 * USAGE — from anywhere else (e.g. StartSessionModal):
 *   Same pattern — it's fully self-contained.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Animated, Dimensions, Modal, Easing, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  useFonts, Nunito_800ExtraBold, Nunito_700Bold, Nunito_400Regular,
} from '@expo-google-fonts/nunito';
import * as RNDeviceActivity from 'react-native-device-activity';
import {
  saveSelectionToken,
  getAuthorizationStatus,
  requestScreenTimeAuthorization,
} from '../services/screenTimeService';
import { useOnboardingStore } from '../store/onboardingStore';
import { activitySelectionMetadata } from 'react-native-device-activity';

const { height: SCREEN_H, width: SCREEN_W } = Dimensions.get('window');
const SHEET_H = SCREEN_H * 0.80; // tall enough for the native picker to be comfortable

interface Props {
  visible:  boolean;
  onClose:  () => void;
}

export default function AppBlockerSheet({ visible, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const [fontsLoaded] = useFonts({ Nunito_800ExtraBold, Nunito_700Bold, Nunito_400Regular });

  const { setScreenTimeSelectionId, screenTimeSelectionId } = useOnboardingStore();

  const [hasSelection,  setHasSelection]  = useState(!!screenTimeSelectionId);
  const [appCount,      setAppCount]      = useState<number | null>(null);
  const [needsAuth,     setNeedsAuth]     = useState(false);
  const [requestingAuth, setRequestingAuth] = useState(false);
  // Pre-populate the picker with the existing selection so iOS shows it as checked
  const [storedToken, setStoredToken] = useState<string | null>(null);

  // ── Animations ────────────────────────────────────────────────────────────
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const sheetY          = useRef(new Animated.Value(SHEET_H)).current;

  useEffect(() => {
    if (visible) {
      // Check auth on open
      const status = getAuthorizationStatus();
      setNeedsAuth(status !== 'approved');

      // Load the stored token so DeviceActivitySelectionView shows existing selection.
      // getFamilyActivitySelectionId returns the raw token string iOS needs.
      if (screenTimeSelectionId) {
        const token = RNDeviceActivity.getFamilyActivitySelectionId(screenTimeSelectionId);
        setStoredToken(token ?? null);
        setHasSelection(!!token);
      }

      // Animate in
      Animated.parallel([
        Animated.timing(backdropOpacity, {
          toValue: 1, duration: 280,
          easing: Easing.out(Easing.quad), useNativeDriver: true,
        }),
        Animated.spring(sheetY, {
          toValue: 0, tension: 68, friction: 12, useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(backdropOpacity, {
          toValue: 0, duration: 220,
          easing: Easing.in(Easing.quad), useNativeDriver: true,
        }),
        Animated.timing(sheetY, {
          toValue: SHEET_H, duration: 260,
          easing: Easing.in(Easing.quad), useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  // Try to resolve app count from stored selection metadata
  useEffect(() => {
    if (!screenTimeSelectionId) return;
    try {
      const stored = RNDeviceActivity.getFamilyActivitySelectionId(screenTimeSelectionId);
      if (stored) {
        const meta = activitySelectionMetadata({ activitySelectionId: screenTimeSelectionId });
        if (meta) {
          setAppCount((meta.applicationCount ?? 0) + (meta.categoryCount ?? 0));
        }
      }
    } catch {
      // metadata unavailable — non-fatal
    }
  }, [screenTimeSelectionId, visible]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleRequestAuth = useCallback(async () => {
    setRequestingAuth(true);
    const status = await requestScreenTimeAuthorization();
    setNeedsAuth(status !== 'approved');
    setRequestingAuth(false);
  }, []);

  const handleSelectionChange = useCallback((event: any) => {
    const rawToken: string = event.nativeEvent.familyActivitySelection;
    if (!rawToken) return;
    const id = saveSelectionToken(rawToken);
    setScreenTimeSelectionId(id);
    setHasSelection(true);
    setStoredToken(rawToken); // keep in sync so re-opening shows the new selection

    // Refresh count after selection
    try {
      const meta = activitySelectionMetadata({ activitySelectionId: id });
      if (meta) setAppCount((meta.applicationCount ?? 0) + (meta.categoryCount ?? 0));
    } catch {}
  }, [setScreenTimeSelectionId]);

  const handleDone = useCallback(() => {
    onClose();
  }, [onClose]);

  if (!fontsLoaded) return null;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      {/* Backdrop */}
      <Animated.View
        style={[styles.backdrop, { opacity: backdropOpacity }]}
        pointerEvents={visible ? 'auto' : 'none'}
      >
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />
      </Animated.View>

      {/* Sheet */}
      <Animated.View
        style={[
          styles.sheet,
          { paddingBottom: insets.bottom + 16 },
          { transform: [{ translateY: sheetY }] },
        ]}
      >
        {/* Handle bar */}
        <View style={styles.handle} />

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Blocked Apps</Text>
            <Text style={styles.subtitle}>
              {hasSelection && appCount !== null && appCount > 0
                ? `${appCount} app${appCount === 1 ? '' : 's'} blocked during focus`
                : hasSelection
                ? 'Selection saved — tap to change'
                : 'Choose apps to block during sessions'}
            </Text>
          </View>

          {hasSelection && (
            <View style={styles.activeBadge}>
              <View style={styles.activeDot} />
              <Text style={styles.activeBadgeText}>Active</Text>
            </View>
          )}
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Content */}
        {needsAuth ? (
          // ── Auth required state ──────────────────────────────────────────
          <View style={styles.authWrap}>
            <Text style={styles.authIcon}>🔒</Text>
            <Text style={styles.authTitle}>Screen Time access needed</Text>
            <Text style={styles.authBody}>
              Ember needs Screen Time permission to block apps during focus sessions.
            </Text>
            <TouchableOpacity
              onPress={handleRequestAuth}
              activeOpacity={0.88}
              disabled={requestingAuth}
              style={styles.authBtn}
            >
              <LinearGradient
                colors={['#FF7830', '#EE4800']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={styles.authBtnGrad}
              >
                <Text style={styles.authBtnText}>
                  {requestingAuth ? 'Requesting…' : 'Allow Access'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        ) : (
          // ── Picker state ─────────────────────────────────────────────────
          <View style={styles.pickerArea}>
            <View style={styles.pickerCard}>
              {/* Fallback sits behind the native view */}
              <View style={styles.pickerFallback}>
                <Text style={styles.pickerFallbackText}>
                  {hasSelection ? 'Tap to update selection' : 'Tap to choose apps'}
                </Text>
              </View>

              {/* Native SwiftUI picker — must be rendered in tree, not called imperatively */}
              <RNDeviceActivity.DeviceActivitySelectionView
                style={StyleSheet.absoluteFill}
                onSelectionChange={handleSelectionChange}
                familyActivitySelection={storedToken}
              />
            </View>

            <Text style={styles.pickerHint}>
              🔒 iOS handles the picker — Ember never sees which apps you choose.
            </Text>
          </View>
        )}

        {/* Footer CTA */}
        {!needsAuth && (
          <TouchableOpacity
            onPress={handleDone}
            activeOpacity={0.88}
            style={styles.doneWrap}
          >
            <LinearGradient
              colors={hasSelection ? ['#FF7830', '#EE4800'] : ['#2A1A0A', '#1A0E05']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={styles.doneBtn}
            >
              <Text style={styles.doneBtnText}>
                {hasSelection ? 'Done' : 'Skip for now'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
      </Animated.View>
    </Modal>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.72)',
  },

  sheet: {
    position:        'absolute',
    bottom:          0,
    left:            0,
    right:           0,
    height:          SHEET_H,
    backgroundColor: '#130A04',
    borderTopLeftRadius:  28,
    borderTopRightRadius: 28,
    borderTopWidth:  1,
    borderLeftWidth: 1,
    borderRightWidth:1,
    borderColor:     'rgba(255,107,26,0.18)',
    paddingHorizontal: 24,
    paddingTop:      12,
    gap:             16,
    // Subtle inner glow at top edge
    shadowColor:     '#FF5500',
    shadowOffset:    { width: 0, height: -8 },
    shadowOpacity:   0.18,
    shadowRadius:    24,
  },

  handle: {
    width:           40,
    height:          4,
    borderRadius:    2,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignSelf:       'center',
    marginBottom:    4,
  },

  header: {
    flexDirection:   'row',
    justifyContent:  'space-between',
    alignItems:      'flex-start',
  },

  title: {
    fontFamily:  'Nunito_800ExtraBold',
    fontSize:    20,
    color:       '#FFF4E6',
    letterSpacing: -0.3,
    marginBottom: 3,
  },
  subtitle: {
    fontFamily: 'Nunito_400Regular',
    fontSize:   13,
    color:      'rgba(255,244,230,0.42)',
    lineHeight: 18,
  },

  activeBadge: {
    flexDirection:   'row',
    alignItems:      'center',
    gap:             5,
    backgroundColor: 'rgba(255,107,26,0.12)',
    borderRadius:    20,
    borderWidth:     1,
    borderColor:     'rgba(255,107,26,0.25)',
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  activeDot: {
    width:           6,
    height:          6,
    borderRadius:    3,
    backgroundColor: '#FF6B1A',
  },
  activeBadgeText: {
    fontFamily:  'Nunito_700Bold',
    fontSize:    11,
    color:       '#FF8C3A',
    letterSpacing: 0.3,
  },

  divider: {
    height:          1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    marginHorizontal: -24,
  },

  // ── Auth state ──
  authWrap: {
    flex:          1,
    alignItems:    'center',
    justifyContent:'center',
    gap:           10,
    paddingHorizontal: 8,
  },
  authIcon:  { fontSize: 40, marginBottom: 4 },
  authTitle: {
    fontFamily:  'Nunito_700Bold',
    fontSize:    17,
    color:       '#FFF4E6',
    textAlign:   'center',
  },
  authBody: {
    fontFamily:  'Nunito_400Regular',
    fontSize:    13,
    color:       'rgba(255,244,230,0.45)',
    textAlign:   'center',
    lineHeight:  19,
    marginBottom: 8,
  },
  authBtn: {
    width:         '100%',
    borderRadius:  50,
    overflow:      'hidden',
    shadowColor:   '#FF4400',
    shadowOffset:  { width: 0, height: 6 },
    shadowOpacity: 0.40,
    shadowRadius:  14,
  },
  authBtnGrad: {
    paddingVertical:  16,
    alignItems:       'center',
  },
  authBtnText: {
    fontFamily:   'Nunito_800ExtraBold',
    fontSize:     16,
    color:        '#fff',
    letterSpacing: 0.2,
  },

  // ── Picker state ──
  pickerArea: {
    flex: 1,
    gap:  10,
  },
  pickerCard: {
    flex:            1,
    borderRadius:    16,
    overflow:        'hidden',
    borderWidth:     1,
    borderColor:     'rgba(255,107,26,0.15)',
    backgroundColor: 'rgba(255,255,255,0.04)',
    position:        'relative',
  },
  pickerFallback: {
    ...StyleSheet.absoluteFillObject,
    alignItems:      'center',
    justifyContent:  'center',
  },
  pickerFallbackText: {
    fontFamily: 'Nunito_400Regular',
    fontSize:   14,
    color:      'rgba(255,244,230,0.28)',
  },
  pickerHint: {
    fontFamily:  'Nunito_400Regular',
    fontSize:    11,
    color:       'rgba(255,244,230,0.25)',
    textAlign:   'center',
    lineHeight:  16,
  },

  // ── Done button ──
  doneWrap: {
    borderRadius:  50,
    overflow:      'hidden',
    shadowColor:   '#FF4400',
    shadowOffset:  { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius:  14,
  },
  doneBtn: {
    paddingVertical: 17,
    alignItems:      'center',
  },
  doneBtnText: {
    fontFamily:   'Nunito_800ExtraBold',
    fontSize:     16,
    color:        '#fff',
    letterSpacing: 0.2,
  },
});
