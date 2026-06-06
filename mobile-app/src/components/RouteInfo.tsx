import { StyleSheet, Text, View } from 'react-native';
import { RouteStatus, TargetDistance } from '../types';

interface Props {
  status: RouteStatus;
  distanceKm: number | null;
  targetKm: TargetDistance;
}

export function RouteInfo({ status, distanceKm, targetKm }: Props) {
  if (status === 'idle') {
    return (
      <Text style={styles.hint}>Tap the button to generate a {targetKm}km route</Text>
    );
  }

  if (status === 'loading') {
    return <Text style={styles.hint}>Generating route...</Text>;
  }

  if (status === 'error') {
    return <Text style={styles.error}>Failed to generate route. Please try again.</Text>;
  }

  if (status === 'success' && distanceKm !== null) {
    return (
      <View style={styles.badge}>
        <Text style={styles.badgeText}>Estimated Distance</Text>
        <Text style={styles.distance}>{distanceKm} km</Text>
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
