/**
 * components/FeedbackModal.tsx
 *
 * In-app feedback form that composes an email to your support address.
 * Uses Linking.openURL with a mailto: so no extra package is needed.
 */

import React, { useRef, useState } from 'react';
import {
  Animated,
  Keyboard,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, FONTS } from '../theme';

// ── Change this to your real support email ────────────────────────────────────
const SUPPORT_EMAIL = 'ryanthony2007@gmail.com';

const CATEGORIES = [
  { id: 'feature',  label: '✨  Feature Request' },
  { id: 'bug',      label: '🐛  Bug Report' },
  { id: 'general',  label: '💬  General Feedback' },
];

interface Props {
  visible:  boolean;
  onClose:  () => void;
}

export function FeedbackModal({ visible, onClose }: Props) {
  const insets  = useSafeAreaInsets();
  const backdropO = useRef(new Animated.Value(0)).current;
  const slideY    = useRef(new Animated.Value(60)).current;
  const opacity   = useRef(new Animated.Value(0)).current;

  const [category, setCategory] = useState<string>('feature');
  const [message,  setMessage]  = useState('');
  const [sending,  setSending]  = useState(false);
  const [sent,     setSent]     = useState(false);

  React.useEffect(() => {
    if (visible) {
      setSent(false);
      setMessage('');
      setCategory('feature');
      Animated.parallel([
        Animated.timing(backdropO, { toValue: 1, duration: 220, useNativeDriver: true }),
        Animated.spring(slideY,    { toValue: 0, tension: 70, friction: 10, useNativeDriver: true }),
        Animated.timing(opacity,   { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(backdropO, { toValue: 0, duration: 180, useNativeDriver: true }),
        Animated.timing(opacity,   { toValue: 0, duration: 160, useNativeDriver: true }),
        Animated.timing(slideY,    { toValue: 40, duration: 180, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  const handleSend = async () => {
    if (!message.trim()) return;
    setSending(true);

    const categoryLabel = CATEGORIES.find(c => c.id === category)?.label ?? category;
    const subject = encodeURIComponent(`[Ember Feedback] ${categoryLabel}`);
    const body    = encodeURIComponent(
      `Category: ${categoryLabel}\n\n${message.trim()}\n\n---\nSent from Ember iOS`
    );
    const url = `mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`;

    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
        setSent(true);
        setTimeout(() => onClose(), 1800);
      } else {
        // Fallback: just close — user may not have Mail configured
        onClose();
      }
    } catch {
      onClose();
    } finally {
      setSending(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      {/* Backdrop */}
      <Animated.View style={[styles.backdrop, { opacity: backdropO }]}>
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>

      <KeyboardAvoidingView
        style={styles.kvWrapper}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        pointerEvents="box-none"
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.kvInner} pointerEvents="box-none">
            <Animated.View
              style={[
                styles.sheet,
                { paddingBottom: insets.bottom + 20 },
                { opacity, transform: [{ translateY: slideY }] },
              ]}
            >
              {/* Handle */}
              <View style={styles.handle} />

              {/* Header */}
              <View style={styles.header}>
                <Text style={styles.title}>Send Feedback</Text>
                <TouchableOpacity onPress={onClose} hitSlop={12} style={styles.closeBtn}>
                  <Text style={styles.closeIcon}>✕</Text>
                </TouchableOpacity>
              </View>

              {sent ? (
                // ── Success state ──────────────────────────────────────
                <View style={styles.successWrap}>
                  <Text style={styles.successEmoji}>🎉</Text>
                  <Text style={styles.successTitle}>Thanks!</Text>
                  <Text style={styles.successSub}>Your feedback means a lot.</Text>
                </View>
              ) : (
                <>
                  {/* Category chips */}
                  <Text style={styles.sectionLabel}>CATEGORY</Text>
                  <View style={styles.chips}>
                    {CATEGORIES.map(c => (
                      <TouchableOpacity
                        key={c.id}
                        style={[styles.chip, category === c.id && styles.chipActive]}
                        onPress={() => setCategory(c.id)}
                        activeOpacity={0.75}
                      >
                        <Text style={[styles.chipText, category === c.id && styles.chipTextActive]}>
                          {c.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {/* Message input */}
                  <Text style={styles.sectionLabel}>YOUR MESSAGE</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Tell us what's on your mind…"
                    placeholderTextColor="rgba(255,244,230,0.25)"
                    multiline
                    numberOfLines={5}
                    textAlignVertical="top"
                    value={message}
                    onChangeText={setMessage}
                    maxLength={1000}
                    returnKeyType="default"
                  />
                  <Text style={styles.charCount}>{message.length} / 1000</Text>

                  {/* Send button */}
                  <TouchableOpacity
                    style={[
                      styles.sendBtn,
                      (!message.trim() || sending) && styles.sendBtnDisabled,
                    ]}
                    onPress={handleSend}
                    activeOpacity={0.85}
                    disabled={!message.trim() || sending}
                  >
                    <Text style={styles.sendBtnText}>
                      {sending ? 'Opening Mail…' : 'Send Feedback'}
                    </Text>
                  </TouchableOpacity>
                </>
              )}
            </Animated.View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.72)',
  },
  kvWrapper: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  kvInner: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#1A0E07',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 12,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: 'rgba(255,255,255,0.09)',
  },
  handle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignSelf: 'center', marginBottom: 20,
  },
  header: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 24,
  },
  title: {
    fontFamily: FONTS.black, fontSize: 20,
    color: COLORS.cream, letterSpacing: -0.3,
  },
  closeBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.07)',
    alignItems: 'center', justifyContent: 'center',
  },
  closeIcon: {
    fontFamily: FONTS.bold, fontSize: 13,
    color: 'rgba(255,244,230,0.45)',
  },

  sectionLabel: {
    fontFamily: FONTS.regular, fontSize: 10, letterSpacing: 2.5,
    color: 'rgba(255,244,230,0.30)', textTransform: 'uppercase',
    marginBottom: 10,
  },

  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.09)',
  },
  chipActive: {
    backgroundColor: 'rgba(255,144,48,0.15)',
    borderColor: 'rgba(255,144,48,0.40)',
  },
  chipText: {
    fontFamily: FONTS.bold, fontSize: 13,
    color: 'rgba(255,244,230,0.45)',
  },
  chipTextActive: { color: '#FF9030' },

  input: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.09)',
    padding: 16, minHeight: 120,
    fontFamily: FONTS.regular, fontSize: 15,
    color: COLORS.cream, lineHeight: 22,
    marginBottom: 6,
  },
  charCount: {
    fontFamily: FONTS.regular, fontSize: 11,
    color: 'rgba(255,244,230,0.22)',
    textAlign: 'right', marginBottom: 24,
  },

  sendBtn: {
    backgroundColor: '#FF5500',
    borderRadius: 16, paddingVertical: 17,
    alignItems: 'center',
    shadowColor: '#FF5500', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45, shadowRadius: 16,
  },
  sendBtnDisabled: {
    backgroundColor: 'rgba(255,85,0,0.25)',
    shadowOpacity: 0,
  },
  sendBtnText: {
    fontFamily: FONTS.black, fontSize: 16,
    color: COLORS.cream, letterSpacing: 0.2,
  },

  // Success
  successWrap: {
    alignItems: 'center', paddingVertical: 40,
  },
  successEmoji: { fontSize: 52, marginBottom: 16 },
  successTitle: {
    fontFamily: FONTS.black, fontSize: 24,
    color: COLORS.cream, marginBottom: 8,
  },
  successSub: {
    fontFamily: FONTS.regular, fontSize: 15,
    color: 'rgba(255,244,230,0.45)',
  },
});
