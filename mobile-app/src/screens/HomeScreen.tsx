import { useCallback, useState } from 'react';
import {
  ActivityIndicator, Alert, FlatList, Modal,
  StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { RunCard } from '../components/RunCard';
import { useRunHistory } from '../hooks/useRunHistory';
import { RunRecord } from '../types';
import { recalculateAreaColoredSegments } from '../services/areaStorage';

export function HomeScreen() {
  const { history, loading, refresh, removeRecord, renameRecord } = useRunHistory();
  const [editingRecord, setEditingRecord] = useState<RunRecord | null>(null);
  const [editName, setEditName] = useState('');

  useFocusEffect(useCallback(() => { refresh(); }, [refresh]));

  function handleLongPress(record: RunRecord) {
    Alert.alert(record.name, 'What would you like to do?', [
      {
        text: 'Rename',
        onPress: () => {
          setEditName(record.name);
          setEditingRecord(record);
        },
      },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          Alert.alert('Delete run?', `"${record.name}" will be permanently deleted.`, [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Delete', style: 'destructive', onPress: async () => {
                await removeRecord(record.id);
                if (record.areaId) await recalculateAreaColoredSegments(record.areaId);
              },
            },
          ]);
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }

  async function handleRenameConfirm() {
    if (!editingRecord) return;
    const trimmed = editName.trim();
    if (trimmed) await renameRecord(editingRecord.id, trimmed);
    setEditingRecord(null);
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
            <RunCard record={item} onLongPress={() => handleLongPress(item)} />
          )}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Rename modal */}
      <Modal visible={!!editingRecord} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Rename Run</Text>
            <TextInput
              style={styles.modalInput}
              value={editName}
              onChangeText={setEditName}
              autoFocus
              selectTextOnFocus
              returnKeyType="done"
              onSubmitEditing={handleRenameConfirm}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancel}
                onPress={() => setEditingRecord(null)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSave}
                onPress={handleRenameConfirm}
              >
                <Text style={styles.modalSaveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  modalCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    gap: 16,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#1A1A1A', textAlign: 'center' },
  modalInput: {
    borderWidth: 1.5,
    borderColor: '#4CAF50',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    fontSize: 16,
    color: '#1A1A1A',
  },
  modalButtons: { flexDirection: 'row', gap: 12 },
  modalCancel: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
  },
  modalCancelText: { fontSize: 15, fontWeight: '600', color: '#888' },
  modalSave: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#4CAF50',
    alignItems: 'center',
  },
  modalSaveText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});
