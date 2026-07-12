import { useRef, useState } from 'react';
import { Alert, Image, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { MAPBOX_TOKEN } from '../constants';
import { Coordinate, RunRecord } from '../types';
import { updateRunMemo } from '../services/storage';

interface Props {
  record: RunRecord | null;
  areaName?: string;
  onClose: () => void;
  onMemoSaved: (id: string, memo: string) => void;
  onRename: (id: string, name: string) => void;
  onDelete: (id: string) => void;
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

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  });
}

function coordsToStr(coords: Coordinate[]): string {
  return coords.map(c => `[${c.longitude},${c.latitude}]`).join(',');
}

function sampleCoords(coords: Coordinate[], maxPoints: number): Coordinate[] {
  if (!coords || coords.length === 0) return [];
  if (coords.length <= maxPoints) return coords;
  const step = Math.floor(coords.length / maxPoints);
  const sampled = coords.filter((_, i) => i % step === 0);
  if (sampled[sampled.length - 1] !== coords[coords.length - 1]) sampled.push(coords[coords.length - 1]);
  return sampled;
}

function buildMapUrl(record: RunRecord): string | null {
  if (!record.routeCoordinates?.length) return null;
  const sampled = sampleCoords(record.routeCoordinates, 100);
  const geoJSON = `{"type":"Feature","properties":{"stroke":"#4CAF50","stroke-width":4},"geometry":{"type":"LineString","coordinates":[${coordsToStr(sampled)}]}}`;
  return `https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/geojson(${encodeURIComponent(geoJSON)})/auto/700x420@2x?padding=60&access_token=${MAPBOX_TOKEN}`;
}

export function RunDetailModal({ record, areaName, onClose, onMemoSaved, onRename, onDelete }: Props) {
  const [editName, setEditName] = useState(record?.name ?? '');
  const [memo, setMemo] = useState(record?.memo ?? '');
  const nameDirty = editName.trim() !== record?.name && editName.trim().length > 0;

  if (!record) return null;

  const mapUrl = buildMapUrl(record);

  function handleSaveName() {
    const trimmed = editName.trim();
    if (!trimmed || trimmed === record!.name) return;
    onRename(record!.id, trimmed);
  }

  async function handleSaveMemo() {
    await updateRunMemo(record!.id, memo);
    onMemoSaved(record!.id, memo);
    onClose();
  }

  function handleDelete() {
    Alert.alert(
      'Delete run?',
      `"${record!.name}" will be permanently deleted.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => { onDelete(record!.id); onClose(); },
        },
      ],
    );
  }

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
            <Text style={styles.closeBtnText}>✕</Text>
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <View style={styles.nameRow}>
              <TextInput
                style={styles.runName}
                value={editName}
                onChangeText={setEditName}
                onSubmitEditing={handleSaveName}
                onBlur={handleSaveName}
                returnKeyType="done"
                selectTextOnFocus
                numberOfLines={1}
              />
              {nameDirty && (
                <TouchableOpacity style={styles.nameSaveBtn} onPress={handleSaveName} activeOpacity={0.7}>
                  <Text style={styles.nameSaveBtnText}>Save</Text>
                </TouchableOpacity>
              )}
            </View>
            <Text style={styles.runDate}>{formatDate(record.date)}</Text>
            {areaName && <Text style={styles.runArea}>📍 {areaName}</Text>}
          </View>
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Map */}
          <View style={styles.mapContainer}>
            {mapUrl ? (
              <Image source={{ uri: mapUrl }} style={styles.map} resizeMode="cover" />
            ) : (
              <View style={[styles.map, styles.mapPlaceholder]}>
                <Text style={styles.mapPlaceholderText}>No route data</Text>
              </View>
            )}
          </View>

          {/* Stats */}
          <View style={styles.statsCard}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{record.distanceKm.toFixed(2)}</Text>
              <Text style={styles.statLabel}>km</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{formatTime(record.elapsedSeconds)}</Text>
              <Text style={styles.statLabel}>time</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{formatPace(record.distanceKm, record.elapsedSeconds)}</Text>
              <Text style={styles.statLabel}>min/km</Text>
            </View>
          </View>

          {/* New streets badge */}
          {record.newStreets?.length > 0 && (
            <View style={styles.streetsBadge}>
              <Text style={styles.streetsBadgeText}>🗺️ {record.newStreets.length} new street{record.newStreets.length !== 1 ? 's' : ''} discovered</Text>
            </View>
          )}

          {/* Memo */}
          <View style={styles.memoCard}>
            <Text style={styles.memoTitle}>Notes</Text>
            <TextInput
              style={styles.memoInput}
              value={memo}
              onChangeText={setMemo}
              placeholder="How did this run feel? Anything memorable?"
              placeholderTextColor="#BDBDBD"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
            <TouchableOpacity style={styles.memoSaveBtn} onPress={handleSaveMemo} activeOpacity={0.8}>
              <Text style={styles.memoSaveBtnText}>Save Note</Text>
            </TouchableOpacity>
          </View>

          {/* Delete */}
          <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete} activeOpacity={0.8}>
            <Text style={styles.deleteBtnText}>Delete Run</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingTop: 16,
    paddingBottom: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    gap: 12,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: { fontSize: 14, fontWeight: '700', color: '#555' },
  headerCenter: { flex: 1, gap: 2 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  runName: {
    flex: 1,
    fontSize: 18,
    fontWeight: '800',
    color: '#1A1A1A',
    padding: 0,
  },
  nameSaveBtn: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  nameSaveBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  runDate: { fontSize: 12, color: '#BDBDBD' },
  runArea: { fontSize: 12, color: '#888', marginTop: 2 },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 40 },
  mapContainer: {
    height: 280,
    margin: 16,
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  map: { width: '100%', height: '100%' },
  mapPlaceholder: { backgroundColor: '#E0E0E0', alignItems: 'center', justifyContent: 'center' },
  mapPlaceholderText: { color: '#9E9E9E', fontSize: 14 },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 12,
  },
  statItem: { flex: 1, alignItems: 'center', gap: 4 },
  statDivider: { width: 1, backgroundColor: '#F0F0F0', marginVertical: 4 },
  statValue: { fontSize: 22, fontWeight: '800', color: '#1A1A1A' },
  statLabel: { fontSize: 11, color: '#BDBDBD', letterSpacing: 0.5, fontWeight: '500' },
  streetsBadge: {
    backgroundColor: '#E8F5E9',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  streetsBadgeText: { fontSize: 14, fontWeight: '600', color: '#2E7D32' },
  memoCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 16,
    padding: 16,
    gap: 10,
  },
  memoTitle: { fontSize: 14, fontWeight: '700', color: '#888', letterSpacing: 0.3 },
  memoInput: {
    borderWidth: 1.5,
    borderColor: '#E8E8E8',
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    color: '#1A1A1A',
    minHeight: 100,
    lineHeight: 22,
  },
  memoSaveBtn: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
  },
  memoSaveBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  deleteBtn: {
    marginHorizontal: 16,
    marginTop: 12,
    borderWidth: 1.5,
    borderColor: '#E53935',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  deleteBtnText: { color: '#E53935', fontSize: 15, fontWeight: '700' },
});
