import { useCallback } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { useFocusEffect } from '@react-navigation/native';
import { useRunHistory } from '../hooks/useRunHistory';

export function CalendarScreen() {
  const { history, refresh } = useRunHistory();

  useFocusEffect(useCallback(() => { refresh(); }, [refresh]));

  // Build a map of { 'YYYY-MM-DD': { marked: true, dotColor: '#4CAF50' } }
  const markedDates = history.reduce<Record<string, { marked: boolean; dotColor: string; selected?: boolean; selectedColor?: string }>>((acc, record) => {
    const dateStr = record.date.slice(0, 10); // 'YYYY-MM-DD'
    acc[dateStr] = { marked: true, dotColor: '#4CAF50', selected: true, selectedColor: '#E8F5E9' };
    return acc;
  }, {});

  const totalRuns = history.length;
  const totalKm = history.reduce((sum, r) => sum + r.distanceKm, 0);

  // Count unique weeks that had at least one run (streak-like metric)
  const runDays = new Set(history.map((r) => r.date.slice(0, 10)));
  const streakDays = runDays.size;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Activity</Text>
        <Text style={styles.subtitle}>Your running habit</Text>
      </View>

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

      <View style={styles.statsSection}>
        <Text style={styles.statsSectionTitle}>All Time</Text>
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{totalRuns}</Text>
            <Text style={styles.statLabel}>Runs</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statValue}>{totalKm.toFixed(1)}</Text>
            <Text style={styles.statLabel}>Total km</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statValue}>{streakDays}</Text>
            <Text style={styles.statLabel}>Active days</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
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
  calendar: {
    marginTop: 12,
    marginHorizontal: 16,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  statsSection: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 16,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  statsSectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#BDBDBD',
    letterSpacing: 1,
    marginBottom: 16,
    textTransform: 'uppercase',
  },
  statsRow: { flexDirection: 'row', alignItems: 'center' },
  stat: { flex: 1, alignItems: 'center', gap: 4 },
  statDivider: { width: 1, height: 40, backgroundColor: '#E0E0E0' },
  statValue: { fontSize: 28, fontWeight: '700', color: '#1A1A1A' },
  statLabel: { fontSize: 12, color: '#888', letterSpacing: 0.5 },
});
