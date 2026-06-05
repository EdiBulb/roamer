import { useRef } from 'react';
import { Animated, PanResponder, StyleSheet, Text, View } from 'react-native';

interface Props {
  onResume: () => void;
}

const TRACK_WIDTH = 280;
const THUMB_SIZE = 52;
const MAX_SLIDE = TRACK_WIDTH - THUMB_SIZE - 8;
const TRIGGER_THRESHOLD = MAX_SLIDE * 0.75;

export function SlideToResume({ onResume }: Props) {
  const slideAnim = useRef(new Animated.Value(0)).current;
  const completed = useRef(false);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderMove: (_, gs) => {
        if (completed.current) return;
        const clamped = Math.max(0, Math.min(gs.dx, MAX_SLIDE));
        slideAnim.setValue(clamped);
      },
      onPanResponderRelease: (_, gs) => {
        if (completed.current) return;
        if (gs.dx >= TRIGGER_THRESHOLD) {
          completed.current = true;
          Animated.timing(slideAnim, {
            toValue: MAX_SLIDE,
            duration: 100,
            useNativeDriver: false,
          }).start(() => {
            onResume();
            slideAnim.setValue(0);
            completed.current = false;
          });
        } else {
          Animated.spring(slideAnim, {
            toValue: 0,
            useNativeDriver: false,
            bounciness: 8,
          }).start();
        }
      },
    })
  ).current;

  const labelOpacity = slideAnim.interpolate({
    inputRange: [0, MAX_SLIDE * 0.4],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.track}>
      <Animated.Text style={[styles.label, { opacity: labelOpacity }]}>
        slide to resume  ▶▶
      </Animated.Text>
      <Animated.View
        style={[styles.thumb, { transform: [{ translateX: slideAnim }] }]}
        {...panResponder.panHandlers}
      >
        <Text style={styles.thumbIcon}>🏃</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    width: TRACK_WIDTH,
    height: THUMB_SIZE + 8,
    backgroundColor: '#E8F5E9',
    borderRadius: (THUMB_SIZE + 8) / 2,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  label: {
    position: 'absolute',
    fontSize: 13,
    color: '#4CAF50',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  thumb: {
    position: 'absolute',
    left: 4,
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    backgroundColor: '#4CAF50',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  thumbIcon: {
    fontSize: 24,
  },
});
