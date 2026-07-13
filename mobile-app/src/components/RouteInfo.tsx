import { StyleSheet, Text, View } from 'react-native';
import { Units } from '../hooks/useSettings';
import { Difficulty, RouteMode, RouteStatus, TargetDistance } from '../types';

interface Props {
  status: RouteStatus;
  distanceKm: number | null;
  targetKm: TargetDistance;
  units: Units;
  mode?: RouteMode;
  difficulty?: Difficulty;
}

export function RouteInfo({ status, distanceKm, targetKm, units, mode, difficulty }: Props) {
  const unitLabel = units === 'miles' ? 'mi' : 'km';
  const targetDisplay = targetKm === 'free'
    ? 'free'
    : units === 'miles'
      ? (targetKm * 0.621371).toFixed(1)
      : String(targetKm);

  if (status === 'idle') {
    const idleText = mode === 'destination' && difficulty
      ? `Tap the button to generate a ${difficulty} route to your destination`
      : `Tap the button to generate a ${targetDisplay}${unitLabel} route`;
    return (
      <Text style={styles.hint}>{idleText}</Text>
    );
  }

  if (status === 'loading') {
    return <Text style={styles.hint}>Generating route...</Text>;
  }

  if (status === 'error') {
    return <Text style={styles.error}>Failed to generate route. Please try again.</Text>;
  }

  if (status === 'success' && distanceKm !== null) {
    const displayDist = units === 'miles'
      ? (distanceKm * 0.621371).toFixed(1)
      : String(distanceKm);
    return (
      <View style={styles.badge}>
        <Text style={styles.badgeText}>Estimated Distance</Text>
        <Text style={styles.distance}>{displayDist} {unitLabel}</Text>
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  hint: {
    fontSize: 13,
    color: '#888',
    textAlign: 'center',
  },
  error: {
    fontSize: 13,
    color: '#E53935',
    textAlign: 'center',
  },
  badge: {
    backgroundColor: '#F1F8E9',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
    gap: 2,
  },
  badgeText: {
    fontSize: 11,
    color: '#666',
  },
  distance: {
    fontSize: 18,
    fontWeight: '700',
    color: '#4CAF50',
  },
});
