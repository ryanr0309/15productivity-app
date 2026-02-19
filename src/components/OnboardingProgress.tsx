// components/OnboardingProgress.tsx

import { View, StyleSheet } from 'react-native';
import { COLORS } from '../theme';
import React from 'react';

export function OnboardingProgress({
  step,           // 1-indexed current step
  total = 14,
}: {
  step: number;
  total?: number;
}) {
  const pct = (step - 1) / (total - 1);
  return (
    <View style={styles.track}>
      <View style={[styles.fill, { width: `${Math.round(pct * 100)}%` }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height:          3,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius:    2,
    overflow:        'hidden',
    marginHorizontal: 28,
  },
  fill: {
    height:          3,
    backgroundColor: COLORS.orange,
    borderRadius:    2,
  },
});