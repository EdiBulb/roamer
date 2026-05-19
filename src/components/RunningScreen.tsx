import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SlideToResume } from './SlideToResume';

interface Props {
  coveredKm: number;
  elapsedSeconds: number;
  instruction: string | null;
  isPaused: boolean;
  onPause: () => void;
  onResume: () => void;
  onFinish: () => void;
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

function handleFinishPress(onFinish: () => void) {
  Alert.alert(
    'Finish Run?',
    'Are you sure you want to end this run?',
    [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Finish', style: 'destructive', onPress: onFinish },
    ]
  );
}

export function RunningScreen({ coveredKm, elapsedSeconds, instruction, isPaused, onPause, onResume, onFinish }: Props) {
  return (
    <View style={styles.card}>
      {isPaused ? (
        <View style={styles.pausedBanner}>
          <Text style={styles.pausedText}>⏸  Paused</Text>
        </View>
      ) : instruction ? (
        <View style={styles.instructionBanner}>
          <Text style={styles.instructionText}>{instruction}</Text>
        </View>
      ) : null}

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

      {isPaused ? (
        <View style={styles.pausedActions}>
          <SlideToResume onResume={onResume} />
          <TouchableOpacity onPress={() => handleFinishPress(onFinish)} activeOpacity={0.6}>
            <Text style={styles.finishLink}>Finish Run</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity style={styles.pauseButton} onPress={onPause} activeOpacity={0.8}>
          <Text style={styles.pauseButtonText}>⏸  Pause</Text>
        </TouchableOpacity>
      )}
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
    alignItems: 'center',
  },
  instructionBanner: {
    backgroundColor: '#1A1A2E',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
    width: '100%',
  },
  instructionText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
  pausedBanner: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
    width: '100%',
  },
  pausedText: {
    color: '#888',
    fontSize: 15,
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
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
  pauseButton: {
    backgroundColor: '#1A1A2E',
    paddingVertical: 14,
    borderRadius: 28,
    alignItems: 'center',
    width: '100%',
  },
  pauseButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  pausedActions: {
    alignItems: 'center',
    gap: 16,
  },
  finishLink: {
    fontSize: 14,
    color: '#E53935',
    textDecorationLine: 'underline',
  },
});
