import { useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Area } from '../types';
import { deleteArea, renameArea, areAreasAdjacent } from '../services/areaStorage';
import { MergeLoadingWebView } from './MergeLoadingWebView';
import { COLOR_NEW } from '../constants';

interface Props {
  visible: boolean;
  areas: Area[];
  activeAreaId: string | null;
  onSelect: (area: Area) => void;
  onCreateNew: () => void;
  onClose: () => void;
  onRenamed: (id: string, newName: string) => void;
  onDeleted: (id: string) => void;
  onMerge: (areaA: Area, areaB: Area, newName: string) => Promise<void>;
}

const ALL_LEVELS = [
  { label: 'Wanderer',        emoji: '🚶', color: '#9E9E9E', min: 0  },
  { label: 'Scout',           emoji: '🔍', color: '#FF9800', min: 10 },
  { label: 'Explorer',        emoji: '🌿', color: '#4CAF50', min: 30 },
  { label: 'Pathfinder',      emoji: '🧭', color: '#2196F3', min: 60 },
  { label: 'Cartographer',    emoji: '🗺️', color: '#9C27B0', min: 90 },
  { label: 'Master Explorer', emoji: '👑', color: '#FFD700', min: 100 },
];

function getAreaLevel(pct: number) {
  for (let i = ALL_LEVELS.length - 1; i >= 0; i--) {
    if (pct >= ALL_LEVELS[i].min) return ALL_LEVELS[i];
  }
  return ALL_LEVELS[0];
}

export function MyAreasSheet({ visible, areas, activeAreaId, onSelect, onCreateNew, onClose, onRenamed, onDeleted, onMerge }: Props) {
  const [editingArea, setEditingArea] = useState<Area | null>(null);
  const [editName, setEditName] = useState('');
  const [levelModalArea, setLevelModalArea] = useState<Area | null>(null);
  const [mergeMode, setMergeMode] = useState(false);
  const [selectedForMerge, setSelectedForMerge] = useState<Area[]>([]);
  const [mergeError, setMergeError] = useState('');
  const [mergeNameModal, setMergeNameModal] = useState(false);
  const [mergeName, setMergeName] = useState('');
  const [merging, setMerging] = useState(false);

  const conqueredAreas = areas.filter(a => {
    const pct = (a.coloredSegmentIds.length / Math.max(a.segments.length, 1)) * 100;
    return pct >= 80;
  });

  function handleMergeModeToggle() {
    setMergeMode(m => !m);
    setSelectedForMerge([]);
    setMergeError('');
  }

  function handleMergeSelect(area: Area) {
    setMergeError('');
    const already = selectedForMerge.find(a => a.id === area.id);
    if (already) {
      setSelectedForMerge(selectedForMerge.filter(a => a.id !== area.id));
      return;
    }
    if (selectedForMerge.length === 0) {
      setSelectedForMerge([area]);
      return;
    }
    const first = selectedForMerge[0];
    if (!areAreasAdjacent(first, area)) {
      setMergeError('These areas are not adjacent (must be within 300m)');
      return;
    }
    const defaultName = `${first.name} + ${area.name}`;
    setMergeName(defaultName);
    setSelectedForMerge([first, area]);
    setMergeNameModal(true);
  }

  async function handleConfirmMerge() {
    if (selectedForMerge.length < 2 || !mergeName.trim()) return;
    setMerging(true);
    try {
      await onMerge(selectedForMerge[0], selectedForMerge[1], mergeName.trim());
      setMergeNameModal(false);
      setMergeMode(false);
      setSelectedForMerge([]);
    } finally {
      setMerging(false);
    }
  }

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

  const levelModalPct = levelModalArea
    ? Math.round((levelModalArea.coloredSegmentIds.length / Math.max(levelModalArea.segments.length, 1)) * 100)
    : 0;
  const currentLevel = levelModalArea ? getAreaLevel(levelModalPct) : null;

  return (
    <>
      <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <View style={styles.titleRow}>
            <Text style={styles.title}>My Areas</Text>
            {areas.length >= 1 && (
              <TouchableOpacity onPress={handleMergeModeToggle} activeOpacity={0.7}>
                <Text style={[styles.mergeToggle, mergeMode && styles.mergeToggleActive]}>
                  {mergeMode ? 'Cancel' : '⊕ Merge'}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {mergeMode && (
            <Text style={styles.mergeHint}>
              {selectedForMerge.length === 0
                ? 'Only areas 80%+ explored are shown.\nSelect one to merge.'
                : 'Select a second area to merge with.'}
            </Text>
          )}
          {mergeError !== '' && <Text style={styles.mergeError}>{mergeError}</Text>}

          <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
            {areas.length === 0 ? (
              <Text style={styles.empty}>No areas yet. Create one to start collecting streets.</Text>
            ) : (
              (mergeMode ? conqueredAreas : areas).map((area) => {
                const pct = Math.round(
                  (area.coloredSegmentIds.length / Math.max(area.segments.length, 1)) * 100,
                );
                const level = getAreaLevel(pct);
                const isActive = area.id === activeAreaId;
                const isConquered = pct >= 80;
                const isSelected = selectedForMerge.some(a => a.id === area.id);
                const dimmed = mergeMode && !isConquered;
                return (
                  <TouchableOpacity
                    key={area.id}
                    style={[
                      styles.areaCard,
                      isActive && !mergeMode && styles.areaCardActive,
                      isSelected && styles.areaCardSelected,
                      dimmed && styles.areaCardDimmed,
                    ]}
                    onPress={() => {
                      if (mergeMode) {
                        if (isConquered) handleMergeSelect(area);
                      } else {
                        onSelect(area); onClose();
                      }
                    }}
                    onLongPress={() => { if (!mergeMode) handleLongPress(area); }}
                    delayLongPress={400}
                    activeOpacity={0.75}
                  >
                    <View style={styles.areaCardLeft}>
                      <Text style={[styles.areaName, isActive && !mergeMode && styles.areaNameActive, isSelected && styles.areaNameSelected]}>
                        {area.conquered ? '🚩 ' : ''}{area.name}
                      </Text>
                      <Text style={styles.areaMeta}>{area.radiusKm} km radius · {area.segments.length} streets</Text>
                      <TouchableOpacity
                        style={[styles.levelChip, { borderColor: level.color }]}
                        onPress={() => { if (!mergeMode) setLevelModalArea(area); }}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.levelChipText, { color: level.color }]}>
                          {level.emoji} {level.label}
                        </Text>
                      </TouchableOpacity>
                    </View>
                    <View style={styles.areaCardRight}>
                      <Text style={[styles.areaPct, isActive && !mergeMode && styles.areaPctActive, isSelected && styles.areaPctSelected]}>{pct}%</Text>
                      {isSelected && <Text style={styles.checkmark}>✓</Text>}
                      {isActive && !mergeMode && !isSelected && <View style={styles.activeDot} />}
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </ScrollView>

          <Text style={styles.hint}>{mergeMode ? '' : 'Hold an area to rename it'}</Text>

          {!mergeMode && (
            <TouchableOpacity style={styles.createBtn} onPress={() => { onClose(); onCreateNew(); }} activeOpacity={0.8}>
              <Text style={styles.createBtnText}>＋  Create New Area</Text>
            </TouchableOpacity>
          )}
        </View>
      </Modal>

      {/* Level progression modal */}
      <Modal visible={!!levelModalArea} transparent animationType="fade" onRequestClose={() => setLevelModalArea(null)}>
        <TouchableOpacity style={styles.levelModalOverlay} activeOpacity={1} onPress={() => setLevelModalArea(null)}>
          <TouchableOpacity style={styles.levelModalCard} activeOpacity={1} onPress={() => {}}>
            <Text style={styles.levelModalTitle}>{levelModalArea?.name}</Text>
            <Text style={styles.levelModalSub}>{levelModalPct}% explored</Text>
            <View style={styles.levelList}>
              {ALL_LEVELS.map((lvl) => {
                const isCurrent = lvl.label === currentLevel?.label;
                const isUnlocked = levelModalPct >= lvl.min;
                return (
                  <View key={lvl.label} style={[styles.levelRow, isCurrent && styles.levelRowCurrent]}>
                    <Text style={[styles.levelEmoji, !isUnlocked && styles.locked]}>{lvl.emoji}</Text>
                    <View style={styles.levelInfo}>
                      <Text style={[styles.levelLabel, { color: isUnlocked ? lvl.color : '#BDBDBD' }, isCurrent && styles.levelLabelBold]}>
                        {lvl.label}
                      </Text>
                      <Text style={styles.levelReq}>{lvl.min === 100 ? '100%' : `${lvl.min}%+`}</Text>
                    </View>
                    {isCurrent && <Text style={[styles.currentBadge, { color: lvl.color }]}>YOU</Text>}
                  </View>
                );
              })}
            </View>
            <TouchableOpacity style={styles.levelModalClose} onPress={() => setLevelModalArea(null)}>
              <Text style={styles.levelModalCloseText}>Close</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Merge name modal */}
      <Modal visible={mergeNameModal} transparent animationType="fade" onRequestClose={() => setMergeNameModal(false)}>
        <View style={styles.renameOverlay}>
          <View style={styles.renameCard}>
            <Text style={styles.renameTitle}>Name the merged area</Text>
            <Text style={styles.mergeModalSub}>
              {selectedForMerge[0]?.name} + {selectedForMerge[1]?.name}
            </Text>
            <TextInput
              style={styles.renameInput}
              value={mergeName}
              onChangeText={setMergeName}
              maxLength={30}
              autoFocus
              selectTextOnFocus
              returnKeyType="done"
              onSubmitEditing={handleConfirmMerge}
            />
            <View style={styles.renameButtons}>
              <TouchableOpacity style={styles.renameCancelBtn} onPress={() => { setMergeNameModal(false); setSelectedForMerge([]); }} activeOpacity={0.7}>
                <Text style={styles.renameCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.renameSaveBtn, (!mergeName.trim() || merging) && styles.renameSaveBtnDisabled]}
                onPress={handleConfirmMerge}
                disabled={!mergeName.trim() || merging}
                activeOpacity={0.8}
              >
                <Text style={styles.renameSaveText}>{merging ? 'Merging…' : 'Merge'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Merge loading overlay */}
      <Modal visible={merging} transparent animationType="fade">
        <MergeLoadingWebView
          areaAName={selectedForMerge[0]?.name ?? ''}
          areaBName={selectedForMerge[1]?.name ?? ''}
          mergedName={mergeName}
        />
      </Modal>

      {/* Rename / Delete modal */}
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
    maxHeight: '75%',
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
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  title: { fontSize: 20, fontWeight: '800', color: '#1A1A1A' },
  mergeToggle: { fontSize: 14, fontWeight: '700', color: '#888', paddingVertical: 4, paddingHorizontal: 8 },
  mergeToggleActive: { color: COLOR_NEW },
  mergeHint: { fontSize: 12, color: '#888', marginBottom: 8, textAlign: 'center' },
  mergeError: { fontSize: 12, color: '#E53935', marginBottom: 6, textAlign: 'center' },
  mergeModalSub: { fontSize: 13, color: '#888', marginTop: -8 },
  list: { maxHeight: 340 },
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
    borderColor: COLOR_NEW,
  },
  areaCardSelected: {
    backgroundColor: '#FFF3E0',
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  areaCardDimmed: { opacity: 0.35 },
  areaNameSelected: { color: '#4CAF50' },
  areaPctSelected: { color: '#4CAF50' },
  checkmark: { fontSize: 16, color: '#4CAF50', fontWeight: '800' },
  areaCardLeft: { flex: 1, gap: 4 },
  areaName: { fontSize: 16, fontWeight: '700', color: '#1A1A1A' },
  areaNameActive: { color: COLOR_NEW },
  areaMeta: { fontSize: 12, color: '#BDBDBD' },
  levelChip: {
    alignSelf: 'flex-start',
    borderWidth: 1.5,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginTop: 2,
  },
  levelChipText: { fontSize: 12, fontWeight: '700' },
  areaCardRight: { alignItems: 'center', gap: 4, marginLeft: 12 },
  areaPct: { fontSize: 18, fontWeight: '800', color: '#BDBDBD' },
  areaPctActive: { color: COLOR_NEW },
  activeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLOR_NEW,
  },
  createBtn: {
    marginTop: 12,
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: 'center',
  },
  createBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  // Level modal
  levelModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 28,
  },
  levelModalCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    gap: 4,
  },
  levelModalTitle: { fontSize: 18, fontWeight: '800', color: '#1A1A1A', textAlign: 'center' },
  levelModalSub: { fontSize: 13, color: '#888', textAlign: 'center', marginBottom: 12 },
  levelList: { gap: 2 },
  levelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    gap: 12,
  },
  levelRowCurrent: { backgroundColor: '#F5F5F5' },
  levelEmoji: { fontSize: 24, width: 32, textAlign: 'center' },
  locked: { opacity: 0.3 },
  levelInfo: { flex: 1 },
  levelLabel: { fontSize: 15, fontWeight: '600' },
  levelLabelBold: { fontWeight: '800' },
  levelReq: { fontSize: 11, color: '#BDBDBD', marginTop: 1 },
  currentBadge: { fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  levelModalClose: {
    marginTop: 12,
    backgroundColor: '#1A1A1A',
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
  },
  levelModalCloseText: { color: '#fff', fontSize: 15, fontWeight: '700' },
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
    borderColor: COLOR_NEW,
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
    backgroundColor: COLOR_NEW,
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
