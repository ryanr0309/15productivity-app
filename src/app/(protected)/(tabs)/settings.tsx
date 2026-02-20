/**
 * Ember – SettingsScreen.tsx
 *
 * Settings screen with:
 *  - App settings (notifications, blocked apps)
 *  - Account (manage subscription, restore purchases)
 *  - Legal (privacy policy, terms of service)
 *  - Danger zone (delete data — with confirmation modal)
 */

import React, { useCallback, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  Easing,
  Linking,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFonts, Nunito_800ExtraBold, Nunito_700Bold, Nunito_400Regular } from '@expo-google-fonts/nunito';
import { router } from 'expo-router';
import { COLORS, FONTS } from '../../../theme';

// ── Replace with your real URLs ───────────────────────────────────────────────
const PRIVACY_URL     = 'https://yourapp.com/privacy';
const TERMS_URL       = 'https://yourapp.com/terms';
const SUBSCRIPTION_URL = 'https://apps.apple.com/account/subscriptions';

const { width } = Dimensions.get('window');

// ─── Delete modal ─────────────────────────────────────────────────────────────
function DeleteModal({ visible, onCancel, onConfirm }: {
  visible:   boolean;
  onCancel:  () => void;
  onConfirm: () => void;
}) {
  const backdropO = useRef(new Animated.Value(0)).current;
  const scaleY    = useRef(new Animated.Value(0.88)).current;
  const opacity   = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(backdropO, { toValue: 1, duration: 220, useNativeDriver: true }),
        Animated.spring(scaleY,    { toValue: 1, tension: 70, friction: 10, useNativeDriver: true }),
        Animated.timing(opacity,   { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(backdropO, { toValue: 0, duration: 180, useNativeDriver: true }),
        Animated.timing(opacity,   { toValue: 0, duration: 160, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onCancel}>
      <Animated.View style={[styles.modalBackdrop, { opacity: backdropO }]}>
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onCancel} />
      </Animated.View>

      <View style={styles.modalContainer} pointerEvents="box-none">
        <Animated.View style={[styles.modalCard, { opacity, transform: [{ scale: scaleY }] }]}>
          {/* Warning icon */}
          <View style={styles.modalIconWrap}>
            <Text style={styles.modalIcon}>⚠️</Text>
          </View>

          <Text style={styles.modalTitle}>Delete All Data?</Text>
          <Text style={styles.modalBody}>
            This permanently deletes all your focus sessions, streaks, and insights. This action{' '}
            <Text style={styles.modalBodyBold}>cannot be undone.</Text>
          </Text>

          <View style={styles.modalDivider} />

          <TouchableOpacity style={styles.modalDeleteBtn} onPress={onConfirm} activeOpacity={0.85}>
            <Text style={styles.modalDeleteText}>Delete Everything</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.modalCancelBtn} onPress={onCancel} activeOpacity={0.75}>
            <Text style={styles.modalCancelText}>Cancel</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

// ─── Row components ───────────────────────────────────────────────────────────
function SettingsRow({
  icon, label, sublabel, onPress, danger = false, chevron = true, badge,
}: {
  icon:      string;
  label:     string;
  sublabel?: string;
  onPress:   () => void;
  danger?:   boolean;
  chevron?:  boolean;
  badge?:    string;
}) {
  const scale = useRef(new Animated.Value(1)).current;

  const onPressIn  = () => Animated.spring(scale, { toValue: 0.97, tension: 120, friction: 8, useNativeDriver: true }).start();
  const onPressOut = () => Animated.spring(scale, { toValue: 1,    tension: 120, friction: 8, useNativeDriver: true }).start();

  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      activeOpacity={1}
    >
      <Animated.View style={[styles.row, { transform: [{ scale }] }]}>
        <View style={[styles.rowIconWrap, danger && styles.rowIconWrapDanger]}>
          <Text style={styles.rowIcon}>{icon}</Text>
        </View>

        <View style={styles.rowBody}>
          <Text style={[styles.rowLabel, danger && styles.rowLabelDanger]}>{label}</Text>
          {sublabel ? <Text style={styles.rowSublabel}>{sublabel}</Text> : null}
        </View>

        {badge ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badge}</Text>
          </View>
        ) : null}

        {chevron && (
          <Text style={[styles.chevron, danger && styles.chevronDanger]}>›</Text>
        )}
      </Animated.View>
    </TouchableOpacity>
  );
}

function SectionHeader({ label }: { label: string }) {
  return <Text style={styles.sectionHeader}>{label}</Text>;
}

function SectionCard({ children }: { children: React.ReactNode }) {
  return <View style={styles.card}>{children}</View>;
}

function RowDivider() {
  return <View style={styles.rowDivider} />;
}

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const [fontsLoaded] = useFonts({ Nunito_800ExtraBold, Nunito_700Bold, Nunito_400Regular });
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);

  const handleDeleteConfirm = useCallback(async () => {
    setDeleteModalVisible(false);
    // TODO: call your Supabase delete function here
    // await deleteAllData();
    // await resetSession();
    // router.replace('/(onboarding)');
    Alert.alert('Data Deleted', 'All your data has been permanently deleted.');
  }, []);

  const handleManageSubscription = useCallback(() => {
    Linking.openURL(SUBSCRIPTION_URL);
  }, []);

  const handleRestorePurchases = useCallback(async () => {
    // TODO: Purchases.restorePurchases() from react-native-purchases
    Alert.alert('Restore Purchases', 'Checking for previous purchases…');
  }, []);

  if (!fontsLoaded) return null;

  return (
    <>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <View style={styles.root}>
        <LinearGradient
          colors={['#090602', '#180B05', '#1E1007', '#180B05', '#090602']}
          locations={[0, 0.2, 0.5, 0.8, 1]}
          start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }}
          style={StyleSheet.absoluteFill}
        />

        {/* Ambient glow */}
        <View style={styles.bgBloom} />

        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
            <Text style={styles.backChevron}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Settings</Text>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
          showsVerticalScrollIndicator={false}
        >

          {/* ── Focus ── */}
          <SectionHeader label="Focus" />
          <SectionCard>
            <SettingsRow
              icon="📱"
              label="Blocked Apps"
              sublabel="Choose apps to block during sessions"
              onPress={() => router.push('/(protected)/blocked-apps')}
            />
            <RowDivider />
            <SettingsRow
              icon="⏱"
              label="Default Duration"
              sublabel="25 minutes"
              onPress={() => router.push('/(protected)/default-duration')}
            />
            <RowDivider />
            <SettingsRow
              icon="🏁"
              label="Checkpoint Interval"
              sublabel="Every 25 minutes"
              onPress={() => router.push('/(protected)/checkpoint-interval')}
            />
          </SectionCard>

          {/* ── Notifications ── */}
          <SectionHeader label="Notifications" />
          <SectionCard>
            <SettingsRow
              icon="🔔"
              label="Session Reminders"
              sublabel="Daily nudges to stay on track"
              onPress={() => router.push('/(protected)/notifications')}
            />
          </SectionCard>

          {/* ── Subscription ── */}
          <SectionHeader label="Subscription" />
          <SectionCard>
            <SettingsRow
              icon="🔥"
              label="Manage Subscription"
              sublabel="View or cancel your Ember Pro plan"
              onPress={handleManageSubscription}
            />
            <RowDivider />
            <SettingsRow
              icon="♻️"
              label="Restore Purchases"
              sublabel="Already subscribed? Tap to restore"
              onPress={handleRestorePurchases}
            />
          </SectionCard>

          {/* ── Legal ── */}
          <SectionHeader label="Legal" />
          <SectionCard>
            <SettingsRow
              icon="🔒"
              label="Privacy Policy"
              onPress={() => Linking.openURL(PRIVACY_URL)}
            />
            <RowDivider />
            <SettingsRow
              icon="📄"
              label="Terms of Service"
              onPress={() => Linking.openURL(TERMS_URL)}
            />
          </SectionCard>

          {/* ── Danger zone ── */}
          <SectionHeader label="Data" />
          <SectionCard>
            <SettingsRow
              icon="🗑"
              label="Delete All Data"
              sublabel="Permanently erase all sessions and streaks"
              onPress={() => setDeleteModalVisible(true)}
              danger
            />
          </SectionCard>

          {/* App version */}
          <Text style={styles.versionText}>Ember · Version 1.0.0</Text>

        </ScrollView>
      </View>

      <DeleteModal
        visible={deleteModalVisible}
        onCancel={() => setDeleteModalVisible(false)}
        onConfirm={handleDeleteConfirm}
      />
    </>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#090602',
  },

  bgBloom: {
    position: 'absolute', top: '5%', alignSelf: 'center',
    width: width * 0.7, height: width * 0.7, borderRadius: width * 0.35,
    backgroundColor: 'transparent',
    shadowColor: '#FF5500', shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.18, shadowRadius: 90, elevation: 0,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  backBtn: {
    width: 36, height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center', justifyContent: 'center',
  },
  backChevron: {
    fontFamily: FONTS.bold,
    fontSize: 22,
    color: 'rgba(255,244,230,0.7)',
    marginTop: -1,
  },
  headerTitle: {
    fontFamily: FONTS.black,
    fontSize: 18,
    color: COLORS.cream,
    letterSpacing: 0.2,
  },

  // Scroll
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },

  // Section header
  sectionHeader: {
    fontFamily: FONTS.regular,
    fontSize: 11,
    letterSpacing: 2.8,
    color: 'rgba(255,180,100,0.38)',
    textTransform: 'uppercase',
    marginTop: 28,
    marginBottom: 10,
    marginLeft: 4,
  },

  // Card
  card: {
    backgroundColor: 'rgba(255,255,255,0.035)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,107,26,0.12)',
    overflow: 'hidden',
  },

  // Row
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 14,
  },
  rowIconWrap: {
    width: 38, height: 38,
    borderRadius: 10,
    backgroundColor: 'rgba(255,107,26,0.10)',
    alignItems: 'center', justifyContent: 'center',
  },
  rowIconWrapDanger: {
    backgroundColor: 'rgba(220,60,60,0.12)',
  },
  rowIcon: {
    fontSize: 18,
  },
  rowBody: {
    flex: 1,
    gap: 2,
  },
  rowLabel: {
    fontFamily: FONTS.bold,
    fontSize: 15,
    color: COLORS.cream,
    letterSpacing: 0.1,
  },
  rowLabelDanger: {
    color: '#FF5555',
  },
  rowSublabel: {
    fontFamily: FONTS.regular,
    fontSize: 12,
    color: 'rgba(255,244,230,0.35)',
    letterSpacing: 0.1,
  },
  chevron: {
    fontFamily: FONTS.bold,
    fontSize: 20,
    color: 'rgba(255,244,230,0.20)',
    marginRight: -2,
  },
  chevronDanger: {
    color: 'rgba(255,85,85,0.35)',
  },
  badge: {
    backgroundColor: 'rgba(255,107,26,0.18)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,107,26,0.25)',
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  badgeText: {
    fontFamily: FONTS.bold,
    fontSize: 11,
    color: COLORS.orange,
    letterSpacing: 0.2,
  },
  rowDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginLeft: 68,
  },

  // Version
  versionText: {
    fontFamily: FONTS.regular,
    fontSize: 11,
    color: 'rgba(255,244,230,0.18)',
    textAlign: 'center',
    letterSpacing: 1,
    marginTop: 32,
  },

  // Delete modal
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.75)',
  },
  modalContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#1C0F07',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,85,85,0.20)',
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 20,
    alignItems: 'center',
    shadowColor: '#FF2200',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 32,
  },
  modalIconWrap: {
    width: 60, height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(220,60,60,0.12)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 16,
  },
  modalIcon: {
    fontSize: 28,
  },
  modalTitle: {
    fontFamily: FONTS.black,
    fontSize: 20,
    color: COLORS.cream,
    letterSpacing: -0.3,
    marginBottom: 10,
    textAlign: 'center',
  },
  modalBody: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    color: 'rgba(255,244,230,0.50)',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  modalBodyBold: {
    fontFamily: FONTS.bold,
    color: 'rgba(255,244,230,0.75)',
  },
  modalDivider: {
    width: '100%',
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    marginBottom: 16,
  },
  modalDeleteBtn: {
    width: '100%',
    backgroundColor: 'rgba(200,40,40,0.85)',
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#FF0000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
  },
  modalDeleteText: {
    fontFamily: FONTS.bold,
    fontSize: 15,
    color: '#fff',
    letterSpacing: 0.2,
  },
  modalCancelBtn: {
    width: '100%',
    paddingVertical: 13,
    alignItems: 'center',
  },
  modalCancelText: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    color: 'rgba(255,244,230,0.40)',
    letterSpacing: 0.2,
  },
});
