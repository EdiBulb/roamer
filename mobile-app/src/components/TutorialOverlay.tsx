import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { useEffect, useRef } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTutorial } from '../contexts/TutorialContext';

const STEPS = [
  {
    label: '1 / 4',
    text: 'Tap Journey tab to start exploring',
    position: 'bottom' as const,
  },
  {
    label: '2 / 4',
    text: 'Choose how far you\'d like to run',
    position: 'top' as const,
  },
  {
    label: '3 / 4',
    text: 'Tap Generate Route to create your path',
    position: 'top' as const,
  },
  {
    label: '4 / 4',
    text: 'Tap Start Run to begin exploring',
    position: 'top' as const,
  },
];

interface Props {
  onComplete: () => void;
}

export function TutorialOverlay({ onComplete }: Props) {
  const { currentStep, skip } = useTutorial();
  const insets = useSafeAreaInsets();
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const prevStep = useRef(currentStep);

  useEffect(() => {
    if (prevStep.current === currentStep) return;
    prevStep.current = currentStep;
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [currentStep]);

  if (currentStep >= STEPS.length) {
    return (
      <View style={styles.completeContainer}>
        <View style={styles.completeCard}>
          <Text style={styles.completeEmoji}>🏃</Text>
          <Text style={styles.completeTitle}>You're ready to explore.</Text>
          <Text style={styles.completeBody}>
            Your city is full of streets{'\n'}you've never discovered.
          </Text>
          <TouchableOpacity style={styles.startButton} onPress={onComplete} activeOpacity={0.8}>
            <Text style={styles.startButtonText}>Start Exploring</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const step = STEPS[currentStep];
  const isTop = step.position === 'top';

  return (
    <View style={styles.overlay} pointerEvents="box-none">
      {/* Top banner */}
      {isTop && (
        <Animated.View
          style={[styles.banner, { top: insets.top + 8, opacity: fadeAnim }]}
        >
          <Text style={styles.bannerLabel}>{step.label}</Text>
          <Text style={styles.bannerText} numberOfLines={1}>{step.text}</Text>
          <TouchableOpacity onPress={skip} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={styles.bannerClose}>✕</Text>
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* Bottom banner (above tab bar) */}
      {!isTop && (
        <Animated.View
          style={[styles.banner, { bottom: insets.bottom + 64, opacity: fadeAnim }]}
        >
          <Text style={styles.bannerLabel}>{step.label}</Text>
          <Text style={styles.bannerText} numberOfLines={1}>{step.text}</Text>
          <TouchableOpacity onPress={skip} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={styles.bannerClose}>✕</Text>
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* Progress dots */}
      <Animated.View
        style={[
          styles.dotsContainer,
          isTop ? { top: insets.top + 60 } : { bottom: insets.bottom + 112 },
          { opacity: fadeAnim },
        ]}
        pointerEvents="none"
      >
        {STEPS.map((_, i) => (
          <View key={i} style={[styles.dot, i === currentStep && styles.dotActive]} />
        ))}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
  },
  banner: {
    position: 'absolute',
    left: 16,
    right: 16,
    backgroundColor: '#1a1a1a',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  bannerLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4CAF50',
    letterSpacing: 0.5,
    minWidth: 32,
  },
  bannerText: {
    flex: 1,
    fontSize: 13,
    color: '#f0f0f0',
    fontWeight: '500',
  },
  bannerClose: {
    fontSize: 13,
    color: '#555',
    fontWeight: '600',
  },
  dotsContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#333',
  },
  dotActive: {
    width: 16,
    backgroundColor: '#4CAF50',
  },
  completeContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  completeCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    width: '100%',
  },
  completeEmoji: {
    fontSize: 48,
    marginBottom: 20,
  },
  completeTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#f5f5f5',
    textAlign: 'center',
    marginBottom: 12,
  },
  completeBody: {
    fontSize: 15,
    color: '#888',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 28,
  },
  startButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 14,
    borderRadius: 28,
    width: '100%',
    alignItems: 'center',
  },
  startButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
});
