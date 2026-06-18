import { useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Area } from '../types';
import { deleteArea, renameArea } from '../services/areaStorage';

interface Props {
  visible: boolean;
  areas: Area[];
  activeAreaId: string | null;
  onSelect: (area: Area) => void;
  onCreateNew: () => void;
  onClose: () => void;
  onRenamed: (id: string, newName: string) => void;
  onDeleted: (id: string) => void;
}

export function MyAreasSheet({ visible, areas, activeAreaId, onSelect, onCreateNew, onClose, onRenamed, onDeleted }: Props) {
  const [editingArea, setEditingArea] = useState<Area | null>(null);
  const [editName, setEditName] = useState('');

  function handleLongPress(area: Area) {
    setEditingArea(area);
    setEditName(area.name);
  }

  async function handleSaveRename() {
    if (!editingArea || !editName.trim()) return;
    await renameArea(editingArea.id, editName.trim());
    onRenamed(editingArea.id, editName.trim());
    setEditingArea(null);
  }

  async function handleDelete() {
    if (!editingArea) return;
    await deleteArea(editingArea.id);
    onDeleted(editingArea.id);
    setEditingArea(null);
  }

  return (
    <>
      <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <Text style={styles.title}>My Areas</Text>

          <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
            {areas.length === 0 ? (
              <Text style={styles.empty}>No areas yet. Create one to start collecting streets.</Text>
            ) : (
              areas.map((area) => {
                const pct = Math.round(
                  (area.coloredSegmentIds.length / Math.max(area.segments.length, 1)) * 100,
                );
                const isActive = area.id === activeAreaId;
                return (
                  <TouchableOpacity
                    key={area.id}
                    style={[styles.areaCard, isActive && styles.areaCardActive]}
                    onPress={() => { onSelect(area); onClose(); }}
                    onLongPress={() => handleLongPress(area)}
                    delayLongPress={400}
                    activeOpacity={0.75}
                  >
                    <View style={styles.areaCardLeft}>
                      <Text style={[styles.areaName, isActive && styles.areaNameActive]}>
                        {area.name}
                      </Text>
                      <Text style={styles.areaMeta}>{area.radiusKm} km radius · {area.segments.length} streets</Text>
                    </View>
                    <View style={styles.areaCardRight}>
                      <Text style={[styles.areaPct, isActive && styles.areaPctActive]}>{pct}%</Text>
                      {isActive && <View style={styles.activeDot} />}
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </ScrollView>

          <Text style={styles.hint}>Hold an area to rename it</Text>

          <TouchableOpacity style={styles.createBtn} onPress={() => { onClose(); onCreateNew(); }} activeOpacity={0.8}>
            <Text style={styles.createBtnText}>＋  Create New Area</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* Rename modal */}
      <Modal visible={!!editingArea} transparent animationType="fade" onRequestClose={() => setEditingArea(null)}>
        <View style={styles.renameOverlay}>
          <View style={styles.renameCard}>
            <Text style={styles.renameTitle}>Rename Area</Text>
            <TextInput
              style={styles.renameInput}
              value={editName}
              onChangeText={setEditName}
              maxLength={30}
              autoFocus
              selectTextOnFocus
              returnKeyType="done"
              onSubmitEditing={handleSaveRename}
            />
            <View style={styles.renameButtons}>
              <TouchableOpacity style={styles.renameCancelBtn} onPress={() => setEditingArea(null)} activeOpacity={0.7}>
                <Text style={styles.renameCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.renameSaveBtn, !editName.trim() && styles.renameSaveBtnDisabled]}
                onPress={handleSaveRename}
                disabled={!editName.trim()}
                activeOpacity={0.8}
              >
                <Text style={styles.renameSaveText}>Save</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.renameDeleteBtn} onPress={handleDelete} activeOpacity={0.8}>
              <Text style={styles.renameDeleteText}>Delete Area</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingBottom: 40,
    maxHeight: '70%',
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E0E0E0',
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 16,
  },
  title: { fontSize: 20, fontWeight: '800', color: '#1A1A1A', marginBottom: 16 },
  list: { maxHeight: 320 },
  empty: { fontSize: 14, color: '#BDBDBD', textAlign: 'center', paddingVertical: 24 },
  hint: { fontSize: 11, color: '#BDBDBD', textAlign: 'center', marginTop: 8, marginBottom: 4 },
  areaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: '#F5F5F5',
    marginBottom: 10,
  },
  areaCardActive: {
    backgroundColor: '#FFF3E0',
    borderWidth: 1.5,
    borderColor: '#FF6B6B',
  },
  areaCardLeft: { flex: 1, gap: 3 },
  areaName: { fontSize: 16, fontWeight: '700', color: '#1A1A1A' },
  areaNameActive: { color: '#FF6B6B' },
  areaMeta: { fontSize: 12, color: '#BDBDBD' },
  areaCardRight: { alignItems: 'center', gap: 4 },
  areaPct: { fontSize: 18, fontWeight: '800', color: '#BDBDBD' },
  areaPctActive: { color: '#FF6B6B' },
  activeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF6B6B',
  },
  createBtn: {
    marginTop: 12,
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: 'center',
  },
  createBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  // Rename modal
  renameOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  renameCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    gap: 16,
  },
  renameTitle: { fontSize: 18, fontWeight: '800', color: '#1A1A1A' },
  renameInput: {
    borderWidth: 1.5,
    borderColor: '#FF6B6B',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#1A1A1A',
  },
  renameButtons: { flexDirection: 'row', gap: 12 },
  renameCancelBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
  },
  renameCancelText: { fontSize: 15, fontWeight: '600', color: '#888' },
  renameSaveBtn: {
    flex: 2,
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: '#FF6B6B',
    alignItems: 'center',
  },
  renameSaveBtnDisabled: { backgroundColor: '#FFCDD2' },
  renameSaveText: { fontSize: 15, fontWeight: '700', color: '#fff' },
  renameDeleteBtn: {
    paddingVertical: 13,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E53935',
    alignItems: 'center',
  },
  renameDeleteText: { fontSize: 15, fontWeight: '600', color: '#E53935' },
});
