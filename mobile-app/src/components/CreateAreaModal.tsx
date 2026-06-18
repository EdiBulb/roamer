import { useState } from 'react';
import {
  ActivityIndicator, Modal, Pressable, StyleSheet,
  Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { Coordinate, Area, RoadSegment } from '../types';
import { fetchSegmentsInArea } from '../services/overpassApi';
import { saveArea } from '../services/areaStorage';

const RADIUS_OPTIONS: { label: string; km: number }[] = [
  { label: '0.5 km', km: 0.5 },
  { label: '1 km', km: 1 },
  { label: '2 km', km: 2 },
];

interface Props {
  visible: boolean;
  location: Coordinate;
  onClose: () => void;
  onCreated: (area: Area) => void;
}

export function CreateAreaModal({ visible, location, onClose, onCreated }: Props) {
  const [name, setName] = useState('');
  const [radiusKm, setRadiusKm] = useState(1);
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');

  async function handleCreate() {
    if (!name.trim()) return;
    setStatus('loading');
    try {
      const segments: RoadSegment[] = await fetchSegmentsInArea(location, radiusKm * 1000);
      const area: Area = {
        id: Date.now().toString(),
        name: name.trim(),
        center: location,
        radiusKm,
        segments,
        coloredSegmentIds: [],
        createdAt: new Date().toISOString(),
      };
      await saveArea(area);
      setStatus('idle');
      setName('');
      onCreated(area);
    } catch (e) {
      console.error('[CreateArea] fetch failed:', e);
      setStatus('error');
    }
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>Create Area</Text>
          <Text style={styles.subtitle}>Current location will be used as center</Text>

          <TextInput
            style={styles.input}
            placeholder="Area name (e.g. Home Zone)"
            placeholderTextColor="#BDBDBD"
            value={name}
            onChangeText={setName}
            maxLength={30}
            returnKeyType="done"
          />

          <Text style={styles.label}>Radius</Text>
          <View style={styles.radiusRow}>
            {RADIUS_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.km}
                style={[styles.radiusBtn, radiusKm === opt.km && styles.radiusBtnActive]}
                onPress={() => setRadiusKm(opt.km)}
                activeOpacity={0.7}
              >
                <Text style={[styles.radiusBtnText, radiusKm === opt.km && styles.radiusBtnTextActive]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {status === 'error' && (
            <Text style={styles.errorText}>Failed to fetch road data. Check your connection.</Text>
          )}

          <View style={styles.buttons}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose} activeOpacity={0.7}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.createBtn, (!name.trim() || status === 'loading') && styles.createBtnDisabled]}
              onPress={handleCreate}
              disabled={!name.trim() || status === 'loading'}
              activeOpacity={0.8}
            >
              {status === 'loading' ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.createText}>Create</Text>
              )}
            </TouchableOpacity>
          </View>

          {status === 'loading' && (
            <Text style={styles.loadingHint}>Fetching road data for your area...</Text>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  card: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 28,
    paddingBottom: 40,
    gap: 16,
  },
  title: { fontSize: 20, fontWeight: '800', color: '#1A1A1A' },
  subtitle: { fontSize: 13, color: '#BDBDBD', marginTop: -8 },
  label: { fontSize: 13, fontWeight: '700', color: '#888', letterSpacing: 0.5 },
  input: {
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#1A1A1A',
  },
  radiusRow: { flexDirection: 'row', gap: 10 },
  radiusBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    alignItems: 'center',
  },
  radiusBtnActive: { borderColor: '#4CAF50', backgroundColor: '#F1F8E9' },
  radiusBtnText: { fontSize: 14, fontWeight: '600', color: '#888' },
  radiusBtnTextActive: { color: '#4CAF50' },
  buttons: { flexDirection: 'row', gap: 12, marginTop: 4 },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
  },
  cancelText: { fontSize: 15, fontWeight: '600', color: '#888' },
  createBtn: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#4CAF50',
    alignItems: 'center',
  },
  createBtnDisabled: { backgroundColor: '#A5D6A7' },
  createText: { fontSize: 15, fontWeight: '700', color: '#fff' },
  errorText: { fontSize: 13, color: '#E53935', textAlign: 'center' },
  loadingHint: { fontSize: 12, color: '#BDBDBD', textAlign: 'center', marginTop: -8 },
});
