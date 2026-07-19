import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { COLOR_NEW } from '../constants';

interface Props {
  heading: number;   // degrees, 0 = north, clockwise
  isActive?: boolean;
}

const BODY = 28;
const SIZE = 54;
const BODY_TOP = (SIZE - BODY) / 2;   // 13
const BODY_LEFT = (SIZE - BODY) / 2;  // 13

export function ExplorerPainterMarker({ heading, isActive = false }: Props) {
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const headingAnim = useRef(new Animated.Value(heading)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const prevHeadingRef = useRef(heading);

  // Continuous pulse ring
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 1400, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  // Smooth rotation — shortest-path to avoid 350→10 spinning the wrong way
  useEffect(() => {
    const prev = prevHeadingRef.current;
    let diff = heading - (prev % 360);
    if (diff > 180) diff -= 360;
    if (diff < -180) diff += 360;
    const next = prev + diff;
    prevHeadingRef.current = next;
    Animated.spring(headingAnim, {
      toValue: next,
      tension: 50,
      friction: 9,
      useNativeDriver: true,
    }).start();
  }, [heading]);

  // Subtle bounce while actively moving
  useEffect(() => {
    if (!isActive) {
      Animated.timing(bounceAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start();
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnim, { toValue: -3, duration: 420, useNativeDriver: true }),
        Animated.timing(bounceAnim, { toValue: 0, duration: 420, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [isActive]);

  const rotate = headingAnim.interpolate({
    inputRange: [-3600, 3600],
    outputRange: ['-3600deg', '3600deg'],
  });
  const pulseScale = pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [0.9, 2.4] });
  const pulseOpacity = pulseAnim.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0.5, 0.2, 0] });

  return (
    <View style={styles.container} pointerEvents="none">
      {/* Pulse ring — stays behind, no rotation */}
      <Animated.View
        style={[styles.pulse, { transform: [{ scale: pulseScale }], opacity: pulseOpacity }]}
      />

      {/* Rotating marker — rotates around body center (container center) */}
      <Animated.View
        style={[styles.rotating, { transform: [{ rotate }, { translateY: bounceAnim }] }]}
      >
        {/* Brush tip — coral paint at the very front */}
        <View style={styles.brushTip} />

        {/* Brush handle — dark stick connecting tip to body */}
        <View style={styles.brushHandle} />

        {/* Body — green explorer circle */}
        <View style={styles.body}>
          {/* White highlight — gives depth */}
          <View style={styles.highlight} />
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: SIZE,
    height: SIZE,
  },
  pulse: {
    position: 'absolute',
    width: BODY,
    height: BODY,
    borderRadius: BODY / 2,
    backgroundColor: '#4CAF50',
    top: BODY_TOP,
    left: BODY_LEFT,
  },
  rotating: {
    position: 'absolute',
    width: SIZE,
    height: SIZE,
  },
  body: {
    position: 'absolute',
    width: BODY,
    height: BODY,
    borderRadius: BODY / 2,
    backgroundColor: '#4CAF50',
    borderWidth: 2.5,
    borderColor: '#1A1A2E',
    top: BODY_TOP,
    left: BODY_LEFT,
  },
  highlight: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.65)',
    top: 4,
    left: 5,
  },
  brushHandle: {
    position: 'absolute',
    width: 4,
    height: 8,
    borderRadius: 2,
    backgroundColor: '#1A1A2E',
    top: BODY_TOP - 8,  // 5 — sits just above body
    left: SIZE / 2 - 2, // 25 — horizontally centered
  },
  brushTip: {
    position: 'absolute',
    width: 9,
    height: 5,
    borderRadius: 2,
    backgroundColor: COLOR_NEW,
    top: BODY_TOP - 12, // 1 — coral paint tip at front
    left: SIZE / 2 - 4, // 23 — centered
  },
});
