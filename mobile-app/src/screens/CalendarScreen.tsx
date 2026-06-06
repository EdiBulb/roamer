import { useCallback, useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { useFocusEffect } from '@react-navigation/native';
import { useRunHistory } from '../hooks/useRunHistory';
import { getTotalExploredCount } from '../services/streetTracker';
import { BADGES } from '../services/badges';

function formatTotalTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h === 0) return `${m}m`;
  return `${h}h ${m}m`;
}

export function CalendarScreen() {
  const { history, refresh } = useRunHistory();
  const [badgeModalVisible, setBadgeModalVisible] = useState(false);
  const [totalStreets, setTotalStreets] = useState(0);

  useFocusEffect(useCallback(() => {
    refresh();
    getTotalExploredCount().then(setTotalStreets);
  }, [refresh]));

  const markedDates = history.reduce<Record<string, { marked: boolean; dotColor: string; selected?: boolean; selectedColor?: string }>>((acc, record) => {
    const dateStr = record.date.slice(0, 10);
    acc[dateStr] = { marked: true, dotColor: '#4CAF50', selected: true, selectedColor: '#E8F5E9' };
    return acc;
  }, {});

  // This month stats
  const now = new Date();
  const thisMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const monthHistory = history.filter((r) => r.date.startsWith(thisMonthStr));
  const monthRuns = monthHistory.length;
  const monthKm = monthHistory.reduce((sum, r) => sum + r.distanceKm, 0);
  const monthSeconds = monthHistory.reduce((sum, r) => sum + r.elapsedSeconds, 0);

  // All time stats
  const totalRuns = history.length;
  const totalKm = history.reduce((sum, r) => sum + r.distanceKm, 0);
  const totalSeconds = history.reduce((sum, r) => sum + r.elapsedSeconds, 0);
  const activeDays = new Set(history.map((r) => r.date.slice(0, 10))).size;

  const monthName = now.toLocaleDateString('en-US', { month: 'long' });

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Trail</Text>
        <Text style={styles.subtitle}>Your running habit</Text>
      </View>

      {/* This month stats */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{monthName}</Text>
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{monthRuns}</Text>
            <Text style={styles.statLabel}>Runs</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statValue}>{monthKm.toFixed(1)}</Text>
            <Text style={styles.statLabel}>km</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statValue}>{formatTotalTime(monthSeconds)}</Text>
            <Text style={styles.statLabel}>Time</Text>
          </View>
        </View>
      </View>

      {/* Calendar */}
      <Calendar
        markedDates={markedDates}
        theme={{
          todayTextColor: '#4CAF50',
          arrowColor: '#4CAF50',
          selectedDayBackgroundColor: '#E8F5E9',
          selectedDayTextColor: '#1A1A1A',
          dotColor: '#4CAF50',
          textDayFontWeight: '600',
          textMonthFontWeight: '800',
          textMonthFontSize: 16,
          calendarBackground: '#fff',
        }}
        style={styles.calendar}
      />

      {/* All time stats */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>All Time</Text>
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{totalRuns}</Text>
            <Text style={styles.statLabel}>Runs</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statValue}>{totalKm.toFixed(1)}</Text>
            <Text style={styles.statLabel}>km</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statValue}>{formatTotalTime(totalSeconds)}</Text>
            <Text style={styles.statLabel}>Time</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statValue}>{activeDays}</Text>
            <Text style={styles.statLabel}>Days</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.badgeButton} onPress={() => setBadgeModalVisible(true)} activeOpacity={0.8}>
          <Text style={styles.badgeButtonText}>🏅 View My Badges</Text>
        </TouchableOpacity>
      </View>

      {/* Badge modal */}
      <Modal visible={badgeModalVisible} transparent animationType="fade" onRequestClose={() => setBadgeModalVisible(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setBadgeModalVisible(false)}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>My Badges</Text>
            <Text style={styles.modalStreets}>{totalStreets} streets explored</Text>
            {BADGES.map((badge) => {
              const earned = totalStreets >= badge.requiredStreets;
              return (
                <View key={badge.id} style={[styles.badgeRow, !earned && styles.badgeRowLocked]}>
                  <Text style={[styles.badgeEmoji, !earned && styles.badgeEmojiLocked]}>{badge.emoji}</Text>
                  <View style={styles.badgeInfo}>
                    <Text style={[styles.badgeName, !earned && styles.badgeNameLocked]}>{badge.name}</Text>
                    <Text style={styles.badgeDesc}>{badge.description}</Text>
                  </View>
                  {earned && <Text style={styles.checkmark}>✓</Text>}
                </View>
              );
            })}
            <TouchableOpacity style={styles.modalClose} onPress={() => setBadgeModalVisible(false)}>
              <Text style={styles.modalCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  content: { paddingBottom: 40 },
  header: {
    backgroundColor: '#fff',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  title: { fontSize: 28, fontWeight: '800', color: '#1A1A1A' },
  subtitle: { fontSize: 14, color: '#BDBDBD', marginTop: 4 },
  section: {
    backgroundColor: '#fff',
    margin: 16,
    marginBottom: 0,
    borderRadius: 16,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#BDBDBD',
    letterSpacing: 1,
    marginBottom: 16,
    textTransform: 'uppercase',
  },
  calendar: {
    margin: 16,
    marginBottom: 0,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  statsRow: { flexDirection: 'row', alignItems: 'center' },
  stat: { flex: 1, alignItems: 'center', gap: 4 },
  statDivider: { width: 1, height: 40, backgroundColor: '#E0E0E0' },
  statValue: { fontSize: 24, fontWeight: '700', color: '#1A1A1A' },
  statLabel: { fontSize: 12, color: '#888', letterSpacing: 0.5 },
  badgeButton: {
    marginTop: 20,
    backgroundColor: '#F1F8E9',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  badgeButtonText: { fontSize: 15, fontWeight: '700', color: '#388E3C' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  modalCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    gap: 12,
  },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#1A1A1A', textAlign: 'center' },
  modalStreets: { fontSize: 13, color: '#888', textAlign: 'center', marginTop: -4, marginBottom: 4 },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 6,
  },
  badgeRowLocked: { opacity: 0.35 },
  badgeEmoji: { fontSize: 32, width: 40, textAlign: 'center' },
  badgeEmojiLocked: { filter: undefined },
  badgeInfo: { flex: 1 },
  badgeName: { fontSize: 15, fontWeight: '700', color: '#1A1A1A' },
  badgeNameLocked: { color: '#888' },
  badgeDesc: { fontSize: 12, color: '#888', marginTop: 1 },
  checkmark: { fontSize: 16, color: '#4CAF50', fontWeight: '800' },
  modalClose: {
    backgroundColor: '#4CAF50',
    borderRadius: 20,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 4,
  },
  modalCloseText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
