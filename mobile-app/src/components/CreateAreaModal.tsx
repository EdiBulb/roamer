import { useState, useRef, useEffect } from 'react';
import {
  Animated, ActivityIndicator, Keyboard, KeyboardAvoidingView, Modal, Platform, StyleSheet,
  Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MapboxGL from '@rnmapbox/maps';
import { Coordinate, Area, RoadSegment } from '../types';
import { fetchSegmentsInPolygon } from '../services/overpassApi';
import { saveArea } from '../services/areaStorage';
import { MAPBOX_TOKEN, COLOR_NEW, COLOR_EXPLORED } from '../constants';

MapboxGL.setAccessToken(MAPBOX_TOKEN);

interface Props {
  visible: boolean;
  location: Coordinate;
  existingAreas?: Area[];
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

export function CreateAreaModal({ visible, location, existingAreas, onClose, onCreated }: Props) {
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState<Step>('draw');
  const [vertices, setVertices] = useState<Coordinate[]>([]);
  const [name, setName] = useState('');
  const [fetchStatus, setFetchStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const cameraRef = useRef<MapboxGL.Camera>(null);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);

  // Radar ring animated values (0 = ring start, 1 = ring end)
  const ring1Anim = useRef(new Animated.Value(0)).current;
  const ring2Anim = useRef(new Animated.Value(0)).current;
  const ring3Anim = useRef(new Animated.Value(0)).current;
  // Bouncing dot values
  const dot1Y = useRef(new Animated.Value(0)).current;
  const dot2Y = useRef(new Animated.Value(0)).current;
  const dot3Y = useRef(new Animated.Value(0)).current;
  const dot1Op = useRef(new Animated.Value(0.35)).current;
  const dot2Op = useRef(new Animated.Value(0.35)).current;
  const dot3Op = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    if (fetchStatus !== 'loading') {
      ring1Anim.setValue(0); ring2Anim.setValue(0); ring3Anim.setValue(0);
      dot1Y.setValue(0); dot2Y.setValue(0); dot3Y.setValue(0);
      dot1Op.setValue(0.35); dot2Op.setValue(0.35); dot3Op.setValue(0.35);
      return;
    }

    function makeRing(anim: Animated.Value, delay: number) {
      return Animated.sequence([
        Animated.delay(delay),
        Animated.loop(Animated.sequence([
          Animated.timing(anim, { toValue: 1, duration: 2200, useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0, duration: 0, useNativeDriver: true }),
        ])),
      ]);
    }

    function makeDot(y: Animated.Value, op: Animated.Value, delay: number) {
      return Animated.sequence([
        Animated.delay(delay),
        Animated.loop(Animated.sequence([
          Animated.parallel([
            Animated.timing(y, { toValue: -6, duration: 420, useNativeDriver: true }),
            Animated.timing(op, { toValue: 1, duration: 420, useNativeDriver: true }),
          ]),
          Animated.parallel([
            Animated.timing(y, { toValue: 0, duration: 420, useNativeDriver: true }),
            Animated.timing(op, { toValue: 0.35, duration: 420, useNativeDriver: true }),
          ]),
          Animated.delay(360),
        ])),
      ]);
    }

    const all = Animated.parallel([
      makeRing(ring1Anim, 0),
      makeRing(ring2Anim, 733),
      makeRing(ring3Anim, 1466),
      makeDot(dot1Y, dot1Op, 0),
      makeDot(dot2Y, dot2Op, 150),
      makeDot(dot3Y, dot3Op, 300),
    ]);
    all.start();
    return () => all.stop();
  }, [fetchStatus]);


  function isActiveVertex(i: number) {
    if (draggingIndex !== null) return i === draggingIndex;
    return i === vertices.length - 1;
  }

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
    Keyboard.dismiss();
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

  // GeoJSON for existing areas overlay
  const existingAreasGeoJSON: GeoJSON.FeatureCollection = {
    type: 'FeatureCollection',
    features: (existingAreas ?? [])
      .filter(a => a.polygon && a.polygon.length >= 3)
      .map(a => ({
        type: 'Feature' as const,
        properties: { name: a.name },
        geometry: {
          type: 'Polygon' as const,
          coordinates: [[
            ...a.polygon!.map(c => [c.longitude, c.latitude]),
            [a.polygon![0].longitude, a.polygon![0].latitude],
          ]],
        },
      })),
  };

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

  const ringScale = (anim: Animated.Value) =>
    anim.interpolate({ inputRange: [0, 1], outputRange: [0.35, 1.75] });
  const ringOpacity = (anim: Animated.Value) =>
    anim.interpolate({ inputRange: [0, 1], outputRange: [0.75, 0] });

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={handleClose}>
      <View style={{ flex: 1 }}>
      {step === 'draw' ? (
        <View style={styles.container}>
          {/* Map */}
          <MapboxGL.MapView style={styles.map} onPress={handleMapPress}>
            <MapboxGL.Camera
              ref={cameraRef}
              centerCoordinate={[location.longitude, location.latitude]}
              zoomLevel={14}
            />

            {/* User location */}
            <MapboxGL.UserLocation visible />

            {/* Existing areas */}
            {existingAreasGeoJSON.features.length > 0 && (
              <MapboxGL.ShapeSource id="existing-areas-src" shape={existingAreasGeoJSON}>
                <MapboxGL.FillLayer
                  id="existing-areas-fill"
                  style={{ fillColor: '#2196F3', fillOpacity: 0.1 }}
                />
                <MapboxGL.LineLayer
                  id="existing-areas-line"
                  style={{ lineColor: '#2196F3', lineWidth: 2, lineDasharray: [3, 2] }}
                />
                <MapboxGL.SymbolLayer
                  id="existing-areas-label"
                  style={{
                    textField: ['get', 'name'],
                    textSize: 12,
                    textColor: '#1565C0',
                    textHaloColor: '#fff',
                    textHaloWidth: 1.5,
                    textFont: ['DIN Offc Pro Medium', 'Arial Unicode MS Regular'],
                  }}
                />
              </MapboxGL.ShapeSource>
            )}

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

            {/* Vertex dots — native Mapbox drag */}
            {vertices.map((v, i) => (
              <MapboxGL.PointAnnotation
                key={`v-${i}`}
                id={`vertex-${i}`}
                coordinate={[v.longitude, v.latitude]}
                draggable
                onDragStart={() => setDraggingIndex(i)}
                onDrag={(feature) => {
                  const [lng, lat] = (feature.geometry as GeoJSON.Point).coordinates;
                  setVertices((prev) =>
                    prev.map((c, j) => j === i ? { latitude: lat, longitude: lng } : c)
                  );
                }}
                onDragEnd={(feature) => {
                  const [lng, lat] = (feature.geometry as GeoJSON.Point).coordinates;
                  setVertices((prev) =>
                    prev.map((c, j) => j === i ? { latitude: lat, longitude: lng } : c)
                  );
                  setDraggingIndex(null);
                }}
              >
                <View style={isActiveVertex(i) ? styles.activeVertex : styles.vertex} />
              </MapboxGL.PointAnnotation>
            ))}
          </MapboxGL.MapView>

          {/* Instruction header */}
          <View style={[styles.header, { pointerEvents: 'none' }]}>
            <Text style={styles.headerText}>
              {draggingIndex !== null
                ? 'Drag to new position — release to place'
                : vertices.length === 0
                ? 'Tap on the map to draw your area'
                : vertices.length < 3
                ? `${vertices.length} point${vertices.length > 1 ? 's' : ''} — need at least 3`
                : `${vertices.length} points — hold a dot to move it`}
            </Text>
          </View>

          {/* Bottom controls */}
          <View style={[styles.controls, { bottom: Math.max(insets.bottom, 24) }]}>
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
        <KeyboardAvoidingView
          style={styles.nameContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
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
        </KeyboardAvoidingView>
      )}

      {/* ── Loading overlay (radar scan) ── */}
      {fetchStatus === 'loading' && (
        <View style={styles.loadingOverlay}>
          {/* Radar rings */}
          <View style={styles.radarContainer}>
            {([
              { anim: ring1Anim, color: '#4CAF50' },
              { anim: ring2Anim, color: '#4CAF50' },
              { anim: ring3Anim, color: '#A5D6A7' },
            ] as const).map(({ anim, color }, i) => (
              <Animated.View
                key={i}
                style={[
                  styles.radarRing,
                  {
                    borderColor: color,
                    transform: [{ scale: ringScale(anim) }],
                    opacity: ringOpacity(anim),
                  },
                ]}
              />
            ))}
            {/* Center GPS dot */}
            <View style={styles.radarCenter}>
              <View style={styles.radarCenterInner} />
            </View>
          </View>

          {/* Area name pill */}
          <View style={styles.areaNamePill}>
            <Text style={styles.areaNamePillText}>{name}</Text>
          </View>

          <Text style={styles.loadingTitle}>거리를 불러오고 있어요</Text>
          <Text style={styles.loadingSubtitle}>
            {'구역 안의 모든 도로를 찾는 중이에요\n최대 30초 정도 걸릴 수 있어요'}
          </Text>

          {/* Bouncing dots */}
          <View style={styles.dotsRow}>
            {([
              { y: dot1Y, op: dot1Op },
              { y: dot2Y, op: dot2Op },
              { y: dot3Y, op: dot3Op },
            ] as const).map(({ y, op }, i) => (
              <Animated.View
                key={i}
                style={[styles.bounceDot, { transform: [{ translateY: y }], opacity: op }]}
              />
            ))}
          </View>
        </View>
      )}
      </View>
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
  activeVertex: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: COLOR_NEW,
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
  createBtnDisabled: { backgroundColor: COLOR_EXPLORED },
  createText: { fontSize: 15, fontWeight: '700', color: '#fff' },
  // Loading overlay
  loadingOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.96)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 0,
    paddingHorizontal: 32,
  },
  radarContainer: {
    width: 190,
    height: 190,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radarRing: {
    position: 'absolute',
    width: 190,
    height: 190,
    borderRadius: 95,
    borderWidth: 2,
  },
  radarCenter: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#4CAF50',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  radarCenterInner: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#fff',
  },
  areaNamePill: {
    marginTop: 28,
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#4CAF50',
    borderRadius: 16,
    backgroundColor: 'rgba(165,214,167,0.18)',
  },
  areaNamePillText: { fontSize: 15, fontWeight: '600', color: '#2E7D32' },
  loadingTitle: {
    marginTop: 18,
    fontSize: 22,
    fontWeight: '800',
    color: '#1A1A1A',
    textAlign: 'center',
  },
  loadingSubtitle: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#8A8A8A',
    textAlign: 'center',
    lineHeight: 22,
  },
  dotsRow: { flexDirection: 'row', gap: 8, marginTop: 22 },
  bounceDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: '#4CAF50',
  },
});
