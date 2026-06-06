import { useState } from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SlideToResume } from './SlideToResume';

interface Props {
  coveredKm: number;
  elapsedSeconds: number;
  totalKm: number;
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

export function RunningScreen({ coveredKm, elapsedSeconds, totalKm, isPaused, onPause, onResume, onFinish }: Props) {
  const remainingKm = Math.max(0, totalKm - coveredKm);
  const [showFinishModal, setShowFinishModal] = useState(false);

  return (
    <View style={styles.card}>
      {/* Always visible when collapsed */}
      <View style={styles.sheetHeader}>
        <View style={styles.dragHandle} />
        <Text style={styles.appName}>Roamer</Text>
      </View>

      {isPaused && (
        <View style={styles.pausedBanner}>
          <Text style={styles.pausedText}>⏸  Paused</Text>
        </View>
      )}

      <View style={styles.statsGrid}>
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{coveredKm.toFixed(2)}</Text>
            <Text style={styles.statLabel}>km covered</Text>
          </View>
          <View style={styles.statVerticalDivider} />
          <View style={styles.stat}>
            <Text style={styles.statValue}>{formatTime(elapsedSeconds)}</Text>
            <Text style={styles.statLabel}>time</Text>
          </View>
        </View>
        <View style={styles.statHorizontalDivider} />
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{formatPace(coveredKm, elapsedSeconds)}</Text>
            <Text style={styles.statLabel}>min/km</Text>
          </View>
          <View style={styles.statVerticalDivider} />
          <View style={styles.stat}>
            <Text style={styles.statValue}>{remainingKm.toFixed(2)}</Text>
            <Text style={styles.statLabel}>km left</Text>
          </View>
        </View>
      </View>

      {isPaused ? (
        <View style={styles.pausedActions}>
          <SlideToResume onResume={onResume} />
          <TouchableOpacity onPress={() => setShowFinishModal(true)} activeOpacity={0.6}>
            <Text style={styles.finishLink}>Finish Run</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity style={styles.pauseButton} onPress={onPause} activeOpacity={0.8}>
          <Text style={styles.pauseButtonText}>⏸  Pause</Text>
        </TouchableOpacity>
      )}
      <Modal
        visible={showFinishModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowFinishModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>End your run?</Text>
            <Text style={styles.modalSubtitle}>Your progress will be saved.</Text>
            <TouchableOpacity
              style={styles.modalKeepButton}
              onPress={() => setShowFinishModal(false)}
              activeOpacity={0.8}
            >
              <Text style={styles.modalKeepText}>Keep Running</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalEndButton}
              onPress={() => { setShowFinishModal(false); onFinish(); }}
              activeOpacity={0.8}
            >
              <Text style={styles.modalEndText}>End Run</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    paddingBottom: 80,
    paddingHorizontal: 24,
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 8,
    alignItems: 'center',
  },
  sheetHeader: {
    alignItems: 'center',
    width: '100%',
    gap: 6,
    paddingBottom: 4,
  },
  dragHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D0D0D0',
  },
  appName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1A1A',
    letterSpacing: 0.5,
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
  statsGrid: {
    width: '100%',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  stat: {
    width: '50%',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 4,
  },
  statVerticalDivider: {
    width: 0,
  },
  statHorizontalDivider: {
    width: '100%',
    height: 1,
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
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  modalCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    paddingVertical: 32,
    paddingHorizontal: 28,
    width: '100%',
    alignItems: 'center',
    gap: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#888',
    marginBottom: 8,
  },
  modalKeepButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 14,
    borderRadius: 28,
    alignItems: 'center',
    width: '100%',
  },
  modalKeepText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  modalEndButton: {
    paddingVertical: 14,
    borderRadius: 28,
    alignItems: 'center',
    width: '100%',
    borderWidth: 1.5,
    borderColor: '#E53935',
  },
  modalEndText: {
    color: '#E53935',
    fontSize: 16,
    fontWeight: '600',
  },
});
