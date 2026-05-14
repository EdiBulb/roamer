import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface Props {
  coveredKm: number;
  elapsedSeconds: number;
  onStop: () => void;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function formatPace(distKm: number, seconds: number): string {
  if (distKm < 0.01) return '--:--';
  const paceSeconds = seconds / distKm;
  const m = Math.floor(paceSeconds / 60).toString().padStart(2, '0');
  const s = Math.floor(paceSeconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export function RunningScreen({ coveredKm, elapsedSeconds, onStop }: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{coveredKm.toFixed(2)}</Text>
          <Text style={styles.statLabel}>km covered</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Text style={styles.statValue}>{formatTime(elapsedSeconds)}</Text>
          <Text style={styles.statLabel}>time</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Text style={styles.statValue}>{formatPace(coveredKm, elapsedSeconds)}</Text>
          <Text style={styles.statLabel}>min/km</Text>
        </View>
      </View>
      <TouchableOpacity style={styles.stopButton} onPress={onStop} activeOpacity={0.8}>
        <Text style={styles.stopButtonText}>Stop Run</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 24,
    paddingBottom: 60,
    paddingHorizontal: 24,
    gap: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 8,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stat: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#E0E0E0',
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  statLabel: {
    fontSize: 12,
    color: '#888',
    letterSpacing: 0.5,
  },
  stopButton: {
    backgroundColor: '#E53935',
    paddingVertical: 14,
    borderRadius: 28,
    alignItems: 'center',
  },
  stopButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
