import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { RunCard } from '../components/RunCard';
import { RunDetailModal } from '../components/RunDetailModal';
import { useRunHistory } from '../hooks/useRunHistory';
import { Area, RunRecord } from '../types';
import { recalculateAreaColoredSegments, loadAreas } from '../services/areaStorage';

export function HomeScreen() {
  const { history, loading, refresh, removeRecord, renameRecord } = useRunHistory();
  const [detailRecord, setDetailRecord] = useState<RunRecord | null>(null);
  const [areas, setAreas] = useState<Area[]>([]);

  useFocusEffect(useCallback(() => {
    refresh();
    loadAreas().then(setAreas);
  }, [refresh]));

  function handleMemoSaved(id: string, memo: string) {
    refresh();
    if (detailRecord?.id === id) setDetailRecord({ ...detailRecord, memo });
  }

  async function handleRename(id: string, name: string) {
    await renameRecord(id, name);
    refresh();
    if (detailRecord?.id === id) setDetailRecord({ ...detailRecord, name });
  }

  async function handleDelete(id: string) {
    const record = history.find(r => r.id === id);
    await removeRecord(id);
    if (record?.areaId) await recalculateAreaColoredSegments(record.areaId);
    refresh();
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Discoveries</Text>
        {history.length > 0 && (
          <Text style={styles.subtitle}>{history.length} run{history.length !== 1 ? 's' : ''} recorded</Text>
        )}
      </View>

      {history.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>🏃</Text>
          <Text style={styles.emptyTitle}>No runs yet</Text>
          <Text style={styles.emptySubtitle}>Complete your first run to see it here</Text>
        </View>
      ) : (
        <FlatList
          data={history}
          keyExtractor={(item: RunRecord) => item.id}
          renderItem={({ item }) => (
            <RunCard record={item} onPress={() => setDetailRecord(item)} />
          )}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}

      {detailRecord && (
        <RunDetailModal
          record={detailRecord}
          areaName={areas.find(a => a.id === detailRecord?.areaId)?.name}
          onClose={() => setDetailRecord(null)}
          onMemoSaved={handleMemoSaved}
          onRename={handleRename}
          onDelete={handleDelete}
        />
      )}
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
  list: { paddingTop: 16, paddingBottom: 32 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  emptyEmoji: { fontSize: 56 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: '#1A1A1A' },
  emptySubtitle: { fontSize: 14, color: '#BDBDBD', textAlign: 'center', paddingHorizontal: 40 },
});
