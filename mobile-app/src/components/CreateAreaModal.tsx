import { useState, useRef } from 'react';
import {
  ActivityIndicator, Modal, StyleSheet,
  Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import MapboxGL from '@rnmapbox/maps';
import { Coordinate, Area, RoadSegment } from '../types';
import { fetchSegmentsInPolygon } from '../services/overpassApi';
import { saveArea } from '../services/areaStorage';
import { MAPBOX_TOKEN } from '../constants';

MapboxGL.setAccessToken(MAPBOX_TOKEN);

interface Props {
  visible: boolean;
  location: Coordinate;
  onClose: () => void;
  onCreated: (area: Area) => void;
}

type Step = 'draw' | 'name';

function polygonCenter(polygon: Coordinate[]): Coordinate {
  const lat = polygon.reduce((s, c) => s + c.latitude, 0) / polygon.length;
  const lng = polygon.reduce((s, c) => s + c.longitude, 0) / polygon.length;
  return { latitude: lat, longitude: lng };
}

function polygonRadiusKm(center: Coordinate, polygon: Coordinate[]): number {
  const R = 6371;
  return Math.max(...polygon.map((c) => {
    const dLat = ((c.latitude - center.latitude) * Math.PI) / 180;
    const dLon = ((c.longitude - center.longitude) * Math.PI) / 180;
    const lat1 = (center.latitude * Math.PI) / 180;
    const lat2 = (c.latitude * Math.PI) / 180;
    const x = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.asin(Math.sqrt(x));
  }));
}

export function CreateAreaModal({ visible, location, onClose, onCreated }: Props) {
  const [step, setStep] = useState<Step>('draw');
  const [vertices, setVertices] = useState<Coordinate[]>([]);
  const [name, setName] = useState('');
  const [fetchStatus, setFetchStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const cameraRef = useRef<MapboxGL.Camera>(null);

  function reset() {
    setStep('draw');
    setVertices([]);
    setName('');
    setFetchStatus('idle');
  }

  function handleClose() {
    reset();
    onClose();
  }

  function handleMapPress(feature: GeoJSON.Feature) {
    if (step !== 'draw') return;
    const [lng, lat] = (feature.geometry as GeoJSON.Point).coordinates;
    setVertices((prev) => [...prev, { latitude: lat, longitude: lng }]);
  }

  function handleUndo() {
    setVertices((prev) => prev.slice(0, -1));
  }

  function handleConfirmPolygon() {
    if (vertices.length < 3) return;
    setStep('name');
  }

  async function handleCreate() {
    if (!name.trim() || vertices.length < 3) return;
    setFetchStatus('loading');
    try {
      const segments: RoadSegment[] = await fetchSegmentsInPolygon(vertices);
      const center = polygonCenter(vertices);
      const radiusKm = polygonRadiusKm(center, vertices);
      const area: Area = {
        id: Date.now().toString(),
        name: name.trim(),
        center,
        radiusKm,
        polygon: vertices,
        segments,
        coloredSegmentIds: [],
        createdAt: new Date().toISOString(),
      };
      await saveArea(area);
      reset();
      onCreated(area);
    } catch (e) {
      console.error('[CreateArea] fetch failed:', e);
      setFetchStatus('error');
    }
  }

  // GeoJSON for the polygon outline during drawing
  const lineCoords = vertices.map((v) => [v.longitude, v.latitude]);
  const closedLine = vertices.length >= 2
    ? [...lineCoords, lineCoords[0]]
    : lineCoords;

  const outlineGeoJSON: GeoJSON.Feature = {
    type: 'Feature',
    properties: {},
    geometry: { type: 'LineString', coordinates: closedLine },
  };

  const fillGeoJSON: GeoJSON.Feature | null = vertices.length >= 3 ? {
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'Polygon',
      coordinates: [[...lineCoords, lineCoords[0]]],
    },
  } : null;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={handleClose}>
      {step === 'draw' ? (
        <View style={styles.container}>
          {/* Map */}
          <MapboxGL.MapView style={styles.map} onPress={handleMapPress}>
            <MapboxGL.Camera
              ref={cameraRef}
              centerCoordinate={[location.longitude, location.latitude]}
              zoomLevel={14}
            />

            {/* Polygon fill */}
            {fillGeoJSON && (
              <MapboxGL.ShapeSource id="area-fill-src" shape={fillGeoJSON}>
                <MapboxGL.FillLayer
                  id="area-fill"
                  style={{ fillColor: '#4CAF50', fillOpacity: 0.15 }}
                />
              </MapboxGL.ShapeSource>
            )}

            {/* Polygon outline */}
            {vertices.length >= 2 && (
              <MapboxGL.ShapeSource id="area-outline-src" shape={outlineGeoJSON}>
                <MapboxGL.LineLayer
                  id="area-outline"
                  style={{ lineColor: '#4CAF50', lineWidth: 2.5, lineDasharray: [4, 2] }}
                />
              </MapboxGL.ShapeSource>
            )}

            {/* Vertex dots */}
            {vertices.map((v, i) => (
              <MapboxGL.PointAnnotation
                key={`v-${i}`}
                id={`vertex-${i}`}
                coordinate={[v.longitude, v.latitude]}
              >
                <View style={i === 0 ? styles.firstVertex : styles.vertex} />
              </MapboxGL.PointAnnotation>
            ))}
          </MapboxGL.MapView>

          {/* Instruction header */}
          <View style={[styles.header, { pointerEvents: 'none' }]}>
            <Text style={styles.headerText}>
              {vertices.length === 0
                ? 'Tap on the map to draw your area'
                : vertices.length < 3
                ? `${vertices.length} point${vertices.length > 1 ? 's' : ''} — need at least 3`
                : `${vertices.length} points — area ready`}
            </Text>
          </View>

          {/* Bottom controls */}
          <View style={styles.controls}>
            <TouchableOpacity style={styles.cancelBtn} onPress={handleClose} activeOpacity={0.7}>
              <Text style={styles.cancelText}>✕ Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.undoBtn, vertices.length === 0 && styles.btnDisabled]}
              onPress={handleUndo}
              disabled={vertices.length === 0}
              activeOpacity={0.7}
            >
              <Text style={styles.undoText}>↩ Undo</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.confirmBtn, vertices.length < 3 && styles.btnDisabled]}
              onPress={handleConfirmPolygon}
              disabled={vertices.length < 3}
              activeOpacity={0.8}
            >
              <Text style={styles.confirmText}>Confirm →</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        /* Name step */
        <View style={styles.nameContainer}>
          <View style={styles.nameCard}>
            <Text style={styles.title}>Name your area</Text>
            <Text style={styles.subtitle}>{vertices.length} points drawn</Text>

            <TextInput
              style={styles.input}
              placeholder="e.g. My Neighbourhood"
              placeholderTextColor="#BDBDBD"
              value={name}
              onChangeText={setName}
              maxLength={30}
              autoFocus
              returnKeyType="done"
            />

            {fetchStatus === 'error' && (
              <Text style={styles.errorText}>Failed to fetch road data. Check your connection.</Text>
            )}

            {fetchStatus === 'loading' && (
              <Text style={styles.loadingHint}>Fetching streets inside your area...</Text>
            )}

            <View style={styles.buttons}>
              <TouchableOpacity style={styles.backBtn} onPress={() => setStep('draw')} activeOpacity={0.7}>
                <Text style={styles.cancelText}>← Back</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.createBtn, (!name.trim() || fetchStatus === 'loading') && styles.createBtnDisabled]}
                onPress={handleCreate}
                disabled={!name.trim() || fetchStatus === 'loading'}
                activeOpacity={0.8}
              >
                {fetchStatus === 'loading'
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={styles.createText}>Create Area</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </Modal>
  );
}

const styles = StyleSheet.create({
  // Draw step
  container: { flex: 1, backgroundColor: '#000' },
  map: { flex: 1 },
  header: {
    position: 'absolute',
    top: 56,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  headerText: { color: '#fff', fontSize: 14, fontWeight: '600', textAlign: 'center' },
  controls: {
    position: 'absolute',
    bottom: 40,
    left: 16,
    right: 16,
    flexDirection: 'row',
    gap: 10,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
  },
  undoBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
  },
  confirmBtn: {
    flex: 1.5,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#4CAF50',
    alignItems: 'center',
  },
  btnDisabled: { opacity: 0.35 },
  cancelText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  undoText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  confirmText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  vertex: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4CAF50',
    borderWidth: 2,
    borderColor: '#fff',
  },
  firstVertex: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#FF6B6B',
    borderWidth: 2,
    borderColor: '#fff',
  },
  // Name step
  nameContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  nameCard: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 28,
    paddingBottom: 48,
    gap: 16,
  },
  title: { fontSize: 20, fontWeight: '800', color: '#1A1A1A' },
  subtitle: { fontSize: 13, color: '#BDBDBD', marginTop: -8 },
  input: {
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#1A1A1A',
  },
  errorText: { fontSize: 13, color: '#E53935', textAlign: 'center' },
  loadingHint: { fontSize: 12, color: '#BDBDBD', textAlign: 'center' },
  buttons: { flexDirection: 'row', gap: 12, marginTop: 4 },
  backBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
  },
  createBtn: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#4CAF50',
    alignItems: 'center',
  },
  createBtnDisabled: { backgroundColor: '#A5D6A7' },
  createText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});
