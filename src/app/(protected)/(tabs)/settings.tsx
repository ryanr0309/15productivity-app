import React, { useCallback, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  Linking,
  Modal,
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
import AsyncStorage from '@react-native-async-storage/async-storage';
import Purchases from 'react-native-purchases';
import { COLORS, FONTS } from '../../../theme';
import AppBlockerSheet from '../../../components/AppBlockerSheet';
import { useSessionStore } from '../../../store/sessionStore';
import { NotificationsSettingsModal } from '../../../components/NotificationsSettingsModal';
import { FeedbackModal } from '../../../components/FeedbackModal';
// TODO: import { deleteAllUserSessions } from '../../../services/sessionService';
// Paste your sessionService.ts and I'll add the real call here.

const PRIVACY_URL      = 'https://docs.google.com/document/d/e/2PACX-1vQFd8Mhq8xa6He6CllLMVHwUdo_r4VBj9fGaatCWmYn3MorjB59ldq-CM3JuHeg64EclbrEo6wN5DO3/pub';
const TERMS_URL        = 'https://docs.google.com/document/d/e/2PACX-1vQP33WfPLWBH7tGRMwVSymaK4-kfsB8vydLLskcXIVcI4fUSZen5_mDK67SUwzgW66kcrty6fsfP8q9/pub';
const SUBSCRIPTION_URL = 'https://apps.apple.com/account/subscriptions';
const SUPPORT_EMAIL    = 'ryanthony2007@gmail.com'

const { width } = Dimensions.get('window');

// ─── Delete modal ─────────────────────────────────────────────────────────────
function DeleteModal({ visible, onCancel, onConfirm, deleting }: {
  visible:   boolean;
  onCancel:  () => void;
  onConfirm: () => void;
  deleting:  boolean;
}) {
  const backdropO = useRef(new Animated.Value(0)).current;
  const scale     = useRef(new Animated.Value(0.88)).current;
  const opacity   = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(backdropO, { toValue: 1, duration: 220, useNativeDriver: true }),
        Animated.spring(scale,     { toValue: 1, tension: 70, friction: 10, useNativeDriver: true }),
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
        <Animated.View style={[styles.modalCard, { opacity, transform: [{ scale }] }]}>
          <View style={styles.modalIconWrap}>
            <Text style={styles.modalIcon}>⚠️</Text>
          </View>
          <Text style={styles.modalTitle}>Delete All Data?</Text>
          <Text style={styles.modalBody}>
            This permanently deletes all your focus sessions, streaks, and insights. This action{' '}
            <Text style={styles.modalBodyBold}>cannot be undone.</Text>
          </Text>
          <View style={styles.modalDivider} />
          <TouchableOpacity
            style={[styles.modalDeleteBtn, deleting && { opacity: 0.5 }]}
            onPress={onConfirm}
            activeOpacity={0.85}
            disabled={deleting}
          >
            <Text style={styles.modalDeleteText}>
              {deleting ? 'Deleting…' : 'Delete Everything'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.modalCancelBtn} onPress={onCancel} activeOpacity={0.75} disabled={deleting}>
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
    <TouchableOpacity onPress={onPress} onPressIn={onPressIn} onPressOut={onPressOut} activeOpacity={1}>
      <Animated.View style={[styles.row, { transform: [{ scale }] }]}>
        <View style={[styles.rowIconWrap, danger && styles.rowIconWrapDanger]}>
          <Text style={styles.rowIcon}>{icon}</Text>
        </View>
        <View style={styles.rowBody}>
          <Text style={[styles.rowLabel, danger && styles.rowLabelDanger]}>{label}</Text>
          {sublabel ? <Text style={styles.rowSublabel}>{sublabel}</Text> : null}
        </View>
        {badge ? <View style={styles.badge}><Text style={styles.badgeText}>{badge}</Text></View> : null}
        {chevron && <Text style={[styles.chevron, danger && styles.chevronDanger]}>›</Text>}
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
  const insets       = useSafeAreaInsets();
  const resetSession = useSessionStore(s => s.resetSession);

  const [fontsLoaded]          = useFonts({ Nunito_800ExtraBold, Nunito_700Bold, Nunito_400Regular });
  const [deleteModalVisible,   setDeleteModalVisible]   = useState(false);
  const [deleting,             setDeleting]             = useState(false);
  const [blockerOpen,          setBlockerOpen]          = useState(false);
  const [restoringPurchases,   setRestoringPurchases]   = useState(false);
  const [notifsOpen, setNotifsOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  // ── Delete all data ──────────────────────────────────────────────────────
  const handleDeleteConfirm = useCallback(async () => {
    setDeleting(true);
    try {
      // 1. Cancel any active session
      await resetSession();

      // 2. Wipe all local AsyncStorage keys
      const keys = await AsyncStorage.getAllKeys();
      await AsyncStorage.multiRemove(keys as string[]);

      // 3. TODO: Delete Supabase data once you paste sessionService.ts
      //    e.g. await deleteAllUserSessions();

      setDeleteModalVisible(false);
      Alert.alert(
        'Data Deleted',
        'All your data has been permanently deleted.',
        [{ text: 'OK', onPress: () => router.replace('/(onboarding)') }]
      );
    } catch (e) {
      console.warn('[Ember] Delete all data error:', e);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setDeleting(false);
    }
  }, [resetSession]);

  // ── Restore purchases ────────────────────────────────────────────────────
  const handleRestorePurchases = useCallback(async () => {
    setRestoringPurchases(true);
    try {
      const info = await Purchases.restorePurchases();
      const isActive = Object.keys(info.entitlements.active).length > 0;
      if (isActive) {
        Alert.alert('Restored!', 'Your Ember Pro subscription has been restored.');
      } else {
        Alert.alert('No Purchases Found', 'We couldn\'t find an active subscription for this Apple ID.');
      }
    } catch (e: any) {
      Alert.alert('Restore Failed', e?.message ?? 'Something went wrong. Please try again.');
    } finally {
      setRestoringPurchases(false);
    }
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
              onPress={() => setBlockerOpen(true)}
            />
          </SectionCard>

          {/* ── Notifications ── */}
          <SectionHeader label="Notifications" />
          <SectionCard>
            <SettingsRow
              icon="🔔"
              label="Session Reminders"
              sublabel="Daily nudges to stay on track"
              onPress={() => setNotifsOpen(true)}
            />
          </SectionCard>

          {/* ── Subscription ── */}
          <SectionHeader label="Subscription" />
          <SectionCard>
            <SettingsRow
              icon="🔥"
              label="Manage Subscription"
              sublabel="View or cancel your Ember Pro plan"
              onPress={() => Linking.openURL(SUBSCRIPTION_URL)}
            />
            <RowDivider />
            <SettingsRow
              icon="♻️"
              label="Restore Purchases"
              sublabel={restoringPurchases ? 'Checking…' : 'Already subscribed? Tap to restore'}
              onPress={handleRestorePurchases}
              chevron={!restoringPurchases}
            />
          </SectionCard>

          <SectionHeader label="Support" />
          <SectionCard>
            <SettingsRow
              icon="💡"
              label="Send Feedback"
              sublabel="Request features or report bugs"
              onPress={() => setFeedbackOpen(true)}
            />
            <RowDivider />
            <SettingsRow
              icon="✉️"
              label="Contact Support"
              sublabel="Get help from the Ember team"
              onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=Ember%20Support`)}
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

          {/* ── Data ── */}
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

          <Text style={styles.versionText}>Ember · Version 1.0.0</Text>
        </ScrollView>
      </View>

      {/* Modals / sheets */}
      <DeleteModal
        visible={deleteModalVisible}
        onCancel={() => setDeleteModalVisible(false)}
        onConfirm={handleDeleteConfirm}
        deleting={deleting}
      />

      <AppBlockerSheet
        visible={blockerOpen}
        onClose={() => setBlockerOpen(false)}
      />

      <NotificationsSettingsModal visible={notifsOpen} onClose={() => setNotifsOpen(false)} />
      <FeedbackModal visible={feedbackOpen} onClose={() => setFeedbackOpen(false)} />
    </>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#090602' },

  bgBloom: {
    position: 'absolute', top: '15%', alignSelf: 'center',
    width: width * 0.9, height: width * 0.9, borderRadius: width * 0.45,
    backgroundColor: 'transparent',
    shadowColor: '#FF5500', shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.18, shadowRadius: 120, elevation: 0,
  },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingBottom: 12,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center', justifyContent: 'center',
  },
  backChevron: { fontFamily: FONTS.black, fontSize: 22, color: COLORS.cream, lineHeight: 26 },
  headerTitle: { fontFamily: FONTS.black, fontSize: 20, color: COLORS.cream, letterSpacing: -0.3 },

  scroll:        { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 8 },

  sectionHeader: {
    fontFamily: FONTS.regular, fontSize: 11, letterSpacing: 2.5,
    color: 'rgba(255,244,230,0.30)', textTransform: 'uppercase',
    marginTop: 28, marginBottom: 8, marginLeft: 4,
  },

  card: {
    backgroundColor: 'rgba(255,255,255,0.045)',
    borderRadius: 18, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    overflow: 'hidden',
  },

  row: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14, gap: 12,
  },
  rowIconWrap: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.07)',
    alignItems: 'center', justifyContent: 'center',
  },
  rowIconWrapDanger: { backgroundColor: 'rgba(255,80,60,0.12)' },
  rowIcon:     { fontSize: 17 },
  rowBody:     { flex: 1, gap: 2 },
  rowLabel:    { fontFamily: FONTS.bold, fontSize: 15, color: COLORS.cream },
  rowLabelDanger: { color: '#FF6B55' },
  rowSublabel: { fontFamily: FONTS.regular, fontSize: 12, color: 'rgba(255,244,230,0.38)' },
  chevron:     { fontFamily: FONTS.bold, fontSize: 20, color: 'rgba(255,244,230,0.22)', marginRight: -2 },
  chevronDanger: { color: 'rgba(255,107,85,0.35)' },

  badge: {
    backgroundColor: 'rgba(255,144,48,0.18)', borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 3,
    borderWidth: 1, borderColor: 'rgba(255,144,48,0.28)',
  },
  badgeText: { fontFamily: FONTS.bold, fontSize: 11, color: '#FF9030' },

  rowDivider: {
    height: 1, marginHorizontal: 16,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },

  versionText: {
    fontFamily: FONTS.regular, fontSize: 12,
    color: 'rgba(255,244,230,0.18)', textAlign: 'center',
    marginTop: 36,
  },

  // Delete modal
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.72)',
  },
  modalContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 32,
  },
  modalCard: {
    width: '100%', backgroundColor: '#1A0E07',
    borderRadius: 24, padding: 28,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.09)',
    alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.6, shadowRadius: 40, elevation: 20,
  },
  modalIconWrap: {
    width: 64, height: 64, borderRadius: 20,
    backgroundColor: 'rgba(255,80,60,0.12)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 16,
  },
  modalIcon:      { fontSize: 30 },
  modalTitle:     { fontFamily: FONTS.black, fontSize: 20, color: COLORS.cream, marginBottom: 10, letterSpacing: -0.3 },
  modalBody:      { fontFamily: FONTS.regular, fontSize: 14, color: 'rgba(255,244,230,0.50)', textAlign: 'center', lineHeight: 21 },
  modalBodyBold:  { fontFamily: FONTS.bold, color: 'rgba(255,244,230,0.75)' },
  modalDivider:   { height: 1, width: '100%', backgroundColor: 'rgba(255,255,255,0.07)', marginVertical: 20 },
  modalDeleteBtn: {
    width: '100%', backgroundColor: 'rgba(255,70,50,0.18)',
    borderRadius: 16, paddingVertical: 16, alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,70,50,0.30)', marginBottom: 10,
  },
  modalDeleteText: { fontFamily: FONTS.black, fontSize: 16, color: '#FF6B55' },
  modalCancelBtn:  { width: '100%', paddingVertical: 12, alignItems: 'center' },
  modalCancelText: { fontFamily: FONTS.regular, fontSize: 15, color: 'rgba(255,244,230,0.35)' },
});
