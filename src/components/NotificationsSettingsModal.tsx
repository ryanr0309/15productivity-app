/**
 * components/NotificationsSettingsModal.tsx
 *
 * Modal that shows current notification permission status and lets
 * the user enable/disable or go to iOS Settings to change it.
 *
 * Usage in settings.tsx:
 *   import { NotificationsSettingsModal } from '../../../components/NotificationsSettingsModal';
 *   const [notifsOpen, setNotifsOpen] = useState(false);
 *   <NotificationsSettingsModal visible={notifsOpen} onClose={() => setNotifsOpen(false)} />
 *   // In the row: onPress={() => setNotifsOpen(true)}
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  Animated, Linking, Modal, Platform,
  StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import * as Notifications from 'expo-notifications';
import { COLORS, FONTS } from '../theme';

type PermissionStatus = 'granted' | 'denied' | 'undetermined' | 'loading';

interface Props {
  visible:  boolean;
  onClose:  () => void;
}

export function NotificationsSettingsModal({ visible, onClose }: Props) {
  const [status,     setStatus]     = useState<PermissionStatus>('loading');
  const [requesting, setRequesting] = useState(false);

  const backdropO = useRef(new Animated.Value(0)).current;
  const sheetY    = useRef(new Animated.Value(300)).current;
  const opacity   = useRef(new Animated.Value(0)).current;

  // Fetch current permission status whenever modal opens
  useEffect(() => {
    if (!visible) return;
    setStatus('loading');
    Notifications.getPermissionsAsync().then(({ status }) => {
      setStatus(status as PermissionStatus);
    });
  }, [visible]);

  // Animate in/out
  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(backdropO, { toValue: 1, duration: 240, useNativeDriver: true }),
        Animated.spring(sheetY,    { toValue: 0, tension: 65, friction: 11, useNativeDriver: true }),
        Animated.timing(opacity,   { toValue: 1, duration: 220, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(backdropO, { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(sheetY,    { toValue: 300, duration: 220, useNativeDriver: true }),
        Animated.timing(opacity,   { toValue: 0, duration: 180, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  const handleEnable = async () => {
    if (status === 'granted') return;

    if (status === 'denied') {
      // Already denied — must go to iOS Settings
      await Linking.openSettings();
      return;
    }

    // undetermined — request directly
    setRequesting(true);
    const { status: newStatus } = await Notifications.requestPermissionsAsync();
    setStatus(newStatus as PermissionStatus);
    setRequesting(false);
  };

  const handleDisable = async () => {
    // iOS doesn't allow programmatic disable — send to Settings
    await Linking.openSettings();
  };

  const isGranted     = status === 'granted';
  const isLoading     = status === 'loading';
  const isDenied      = status === 'denied';
  const isUndetermined = status === 'undetermined';

  const statusLabel = isLoading      ? '...'
                    : isGranted      ? 'Yes'
                    : isDenied       ? 'No'
                    : 'Not yet set';

  const statusColor = isGranted ? '#66DD99'
                    : isDenied  ? '#FF6B55'
                    : 'rgba(255,244,230,0.40)';

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      {/* Backdrop */}
      <Animated.View style={[styles.backdrop, { opacity: backdropO }]}>
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>

      {/* Sheet */}
      <View style={styles.sheetOuter} pointerEvents="box-none">
        <Animated.View style={[styles.sheet, { opacity, transform: [{ translateY: sheetY }] }]}>

          {/* Handle */}
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.iconWrap}>
              <Text style={styles.icon}>🔔</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>Notifications</Text>
              <Text style={styles.subtitle}>Session alerts and reminders</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={12}>
              <Text style={styles.closeTxt}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Status card */}
          <View style={styles.statusCard}>
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Notifications allowed</Text>
              <View style={[styles.statusBadge, { borderColor: statusColor + '55', backgroundColor: statusColor + '18' }]}>
                <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                <Text style={[styles.statusValue, { color: statusColor }]}>{statusLabel}</Text>
              </View>
            </View>

            <View style={styles.divider} />

            {/* What Ember sends */}
            <Text style={styles.sectionLabel}>WHAT EMBER SENDS</Text>
            {[
              { icon: '⏱', text: 'Session complete alerts' },
              { icon: '🔓', text: 'Reminder to unlock your apps' },
            ].map((item, i) => (
              <View key={i} style={styles.featureRow}>
                <Text style={styles.featureIcon}>{item.icon}</Text>
                <Text style={styles.featureText}>{item.text}</Text>
              </View>
            ))}
          </View>

          {/* Actions */}
          {!isLoading && (
            <View style={styles.actions}>
              {!isGranted ? (
                <TouchableOpacity
                  style={styles.enableBtn}
                  onPress={handleEnable}
                  activeOpacity={0.88}
                  disabled={requesting}
                >
                  <Text style={styles.enableTxt}>
                    {requesting          ? 'Requesting…'
                     : isDenied         ? 'Open iOS Settings'
                     : 'Enable Notifications'}
                  </Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.disableBtn}
                  onPress={handleDisable}
                  activeOpacity={0.80}
                >
                  <Text style={styles.disableTxt}>Manage in iOS Settings</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity onPress={onClose} style={styles.cancelBtn} activeOpacity={0.7}>
                <Text style={styles.cancelTxt}>Done</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Denied helper text */}
          {isDenied && (
            <Text style={styles.helperTxt}>
              You previously denied notifications. Tap "Open iOS Settings" above, then enable Notifications for Ember.
            </Text>
          )}

        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.70)',
  },
  sheetOuter: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#170D07',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: 'rgba(255,255,255,0.09)',
    paddingHorizontal: 24,
    paddingBottom: 36,
    paddingTop: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -12 },
    shadowOpacity: 0.55,
    shadowRadius: 30,
    elevation: 24,
  },

  handle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignSelf: 'center', marginBottom: 20,
  },

  header: {
    flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 20,
  },
  iconWrap: {
    width: 48, height: 48, borderRadius: 16,
    backgroundColor: 'rgba(255,144,48,0.14)',
    borderWidth: 1, borderColor: 'rgba(255,144,48,0.22)',
    alignItems: 'center', justifyContent: 'center',
  },
  icon:     { fontSize: 22 },
  title:    { fontFamily: FONTS.black, fontSize: 18, color: COLORS.cream, letterSpacing: -0.3 },
  subtitle: { fontFamily: FONTS.regular, fontSize: 13, color: 'rgba(255,244,230,0.38)', marginTop: 2 },
  closeBtn: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.07)',
    alignItems: 'center', justifyContent: 'center',
  },
  closeTxt: { fontFamily: FONTS.bold, fontSize: 12, color: 'rgba(255,244,230,0.40)' },

  statusCard: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 18, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    padding: 18, marginBottom: 20,
  },
  statusRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  statusLabel: { fontFamily: FONTS.bold, fontSize: 15, color: COLORS.cream },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 5,
    borderRadius: 20, borderWidth: 1,
  },
  statusDot:  { width: 7, height: 7, borderRadius: 4 },
  statusValue: { fontFamily: FONTS.black, fontSize: 14 },

  divider: {
    height: 1, backgroundColor: 'rgba(255,255,255,0.06)',
    marginVertical: 14,
  },

  sectionLabel: {
    fontFamily: FONTS.regular, fontSize: 10, letterSpacing: 2.5,
    color: 'rgba(255,244,230,0.28)', textTransform: 'uppercase',
    marginBottom: 12,
  },
  featureRow:  { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  featureIcon: { fontSize: 16, width: 24, textAlign: 'center' },
  featureText: { fontFamily: FONTS.regular, fontSize: 13, color: 'rgba(255,244,230,0.55)', flex: 1 },

  actions: { gap: 10 },
  enableBtn: {
    backgroundColor: '#FF6010',
    borderRadius: 18, paddingVertical: 17,
    alignItems: 'center',
    shadowColor: '#FF5500', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.38, shadowRadius: 14, elevation: 8,
  },
  enableTxt: { fontFamily: FONTS.black, fontSize: 16, color: '#fff', letterSpacing: 0.2 },

  disableBtn: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 18, paddingVertical: 17,
    alignItems: 'center', borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
  },
  disableTxt: { fontFamily: FONTS.bold, fontSize: 15, color: 'rgba(255,244,230,0.55)' },

  cancelBtn: { alignItems: 'center', paddingVertical: 10 },
  cancelTxt: { fontFamily: FONTS.regular, fontSize: 15, color: 'rgba(255,244,230,0.30)' },

  helperTxt: {
    fontFamily: FONTS.regular, fontSize: 12,
    color: 'rgba(255,244,230,0.28)', textAlign: 'center',
    lineHeight: 18, marginTop: 8, paddingHorizontal: 8,
  },
});

/*
─── HOW TO USE IN settings.tsx ────────────────────────────────────────────────

1. Import it:
   import { NotificationsSettingsModal } from '../../../components/NotificationsSettingsModal';

2. Add state:
   const [notifsOpen, setNotifsOpen] = useState(false);

3. Wire the row:
   <SettingsRow
     icon="🔔"
     label="Session Reminders"
     sublabel="Daily nudges to stay on track"
     onPress={() => setNotifsOpen(true)}
   />

4. Add the modal before the closing </> fragment:
   <NotificationsSettingsModal
     visible={notifsOpen}
     onClose={() => setNotifsOpen(false)}
   />
*/
