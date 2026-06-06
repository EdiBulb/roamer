import { useRef, useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import MapboxGL from '@rnmapbox/maps';
import { MAPBOX_TOKEN } from '../constants';
import { Badge, Coordinate, RunRecord, RunRoute } from '../types';
import { saveRunRecord } from '../services/storage';
import { findNewStreets, getTotalExploredCount, saveNewStreets } from '../services/streetTracker';
import { getNewlyEarnedBadges } from '../services/badges';

MapboxGL.setAccessToken(MAPBOX_TOKEN);

interface Props {
  coveredKm: number;
  elapsedSeconds: number;
  route: RunRoute;
  onHome: () => void;
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

function defaultRunName(): string {
  const now = new Date();
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const day = days[now.getDay()];
  const hour = now.getHours();
  const period = hour < 12 ? 'Morning' : hour < 17 ? 'Afternoon' : 'Evening';
  return `${day} ${period} Run`;
}

function getBoundingBox(coordinates: Coordinate[]) {
  const lats = coordinates.map((c) => c.latitude);
  const lngs = coordinates.map((c) => c.longitude);
  return {
    ne: [Math.max(...lngs), Math.max(...lats)] as [number, number],
    sw: [Math.min(...lngs), Math.min(...lats)] as [number, number],
  };
}

export function RunSummaryScreen({ coveredKm, elapsedSeconds, route, onHome }: Props) {
  const runNameRef = useRef(defaultRunName());
  const navigation = useNavigation();
  const [newBadges, setNewBadges] = useState<Badge[]>([]);
  const [newStreetCount, setNewStreetCount] = useState<number | null>(null);
  const [badgeModalVisible, setBadgeModalVisible] = useState(false);
  const [saved, setSaved] = useState(false);
  const [savedNewStreets, setSavedNewStreets] = useState<string[]>([]);

  const routeGeoJSON: GeoJSON.Feature<GeoJSON.LineString> = {
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'LineString',
      coordinates: route.coordinates.map((c) => [c.longitude, c.latitude]),
    },
  };

  const bounds = getBoundingBox(route.coordinates);

  const newStreetsSet = new Set(savedNewStreets);
  const newSegments = route.steps
    .filter(s => s.streetName && newStreetsSet.has(s.streetName) && s.coordinates.length > 0)
    .map(s => s.coordinates.map(c => [c.longitude, c.latitude]));
  const newStreetsGeoJSON: GeoJSON.Feature<GeoJSON.MultiLineString> | null =
    newSegments.length > 0
      ? { type: 'Feature', properties: {}, geometry: { type: 'MultiLineString', coordinates: newSegments } }
      : null;

  async function handleSave() {
    const coveredM = coveredKm * 1000;
    const coveredStreetNames = [
      ...new Set(
        route.steps
          .filter(s => s.streetName && s.distanceFromStartM <= coveredM)
          .map(s => s.streetName as string)
      ),
    ];
    const prevTotal = await getTotalExploredCount();
    const newStreets = await findNewStreets(coveredStreetNames);
    await saveNewStreets(newStreets);
    const newTotal = await getTotalExploredCount();
    const earned = getNewlyEarnedBadges(prevTotal, newTotal);

    const newStreetsSet = new Set(newStreets);
    const newStreetSegments = route.steps
      .filter(s => s.streetName && newStreetsSet.has(s.streetName) && s.coordinates.length > 0)
      .map(s => s.coordinates);

    const record: RunRecord = {
      id: String(Date.now()),
      name: runNameRef.current.trim() || defaultRunName(),
      date: new Date().toISOString(),
      distanceKm: coveredKm,
      elapsedSeconds,
      routeCoordinates: route.coordinates,
      newStreets,
      newStreetSegments: newStreetSegments.length > 0 ? newStreetSegments : undefined,
    };
    await saveRunRecord(record);

    setNewStreetCount(newStreets.length);
    setSavedNewStreets(newStreets);
    setSaved(true);
    if (earned.length > 0) {
      setNewBadges(earned);
      setBadgeModalVisible(true);
    }
  }

  function handleDone() {
    onHome();
    navigation.navigate('Home' as never);
  }

  function handleBadgeClose() {
    setBadgeModalVisible(false);
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} bounces={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerLabel}>Run Complete 🎉</Text>
        <TextInput
          style={styles.nameInput}
          defaultValue={runNameRef.current}
          onChangeText={(t) => { runNameRef.current = t; }}
          returnKeyType="done"
          selectTextOnFocus
          placeholder="Run name"
        />
        <Text style={styles.dateLabel}>
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </Text>
      </View>

      {/* Hero distance */}
      <View style={styles.heroSection}>
        <Text style={styles.heroValue}>{coveredKm.toFixed(2)}</Text>
        <Text style={styles.heroUnit}>kilometers</Text>
      </View>

      {/* Secondary stats */}
      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{formatPace(coveredKm, elapsedSeconds)}</Text>
          <Text style={styles.statLabel}>Avg. Pace</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Text style={styles.statValue}>{formatTime(elapsedSeconds)}</Text>
          <Text style={styles.statLabel}>Time</Text>
        </View>
      </View>

      {/* New streets banner */}
      {newStreetCount !== null && (
        <View style={styles.streetsBanner}>
          <Text style={styles.streetsBannerText}>
            {newStreetCount > 0
              ? `🗺️ ${newStreetCount} new street${newStreetCount !== 1 ? 's' : ''} discovered!`
              : '📍 No new streets this time'}
          </Text>
        </View>
      )}

      {/* Route map */}
      <View style={styles.mapContainer}>
        <MapboxGL.MapView
          style={styles.map}
          styleURL={MapboxGL.StyleURL.Street}
          scrollEnabled={false}
          zoomEnabled={false}
          rotateEnabled={false}
        >
          <MapboxGL.Camera
            bounds={{ ...bounds, paddingTop: 40, paddingBottom: 40, paddingLeft: 24, paddingRight: 24 }}
            animationDuration={0}
          />
          <MapboxGL.ShapeSource id="summary-route" shape={routeGeoJSON}>
            <MapboxGL.LineLayer
              id="summary-line"
              style={{ lineColor: '#4CAF50', lineWidth: 4, lineJoin: 'round', lineCap: 'round' }}
            />
          </MapboxGL.ShapeSource>
          {newStreetsGeoJSON && (
            <MapboxGL.ShapeSource id="new-streets" shape={newStreetsGeoJSON}>
              <MapboxGL.LineLayer
                id="new-streets-line"
                style={{ lineColor: '#F44336', lineWidth: 4, lineJoin: 'round', lineCap: 'round' }}
              />
            </MapboxGL.ShapeSource>
          )}
        </MapboxGL.MapView>
      </View>

      {/* Save / Done button */}
      <TouchableOpacity
        style={styles.saveButton}
        onPress={saved ? handleDone : handleSave}
        activeOpacity={0.8}
      >
        <Text style={styles.saveButtonText}>{saved ? 'Done' : 'Save & Go Home'}</Text>
      </TouchableOpacity>

      {/* Badge achievement modal */}
      <Modal visible={badgeModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>New Badge{newBadges.length > 1 ? 's' : ''} Unlocked! 🎉</Text>
            {newBadges.map((badge) => (
              <View key={badge.id} style={styles.badgeRow}>
                <Text style={styles.badgeEmoji}>{badge.emoji}</Text>
                <View>
                  <Text style={styles.badgeName}>{badge.name}</Text>
                  <Text style={styles.badgeDesc}>{badge.description}</Text>
                </View>
              </View>
            ))}
            <TouchableOpacity style={styles.modalButton} onPress={() => { handleBadgeClose(); }}>
              <Text style={styles.modalButtonText}>Continue</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  content: { paddingBottom: 60 },
  header: {
    backgroundColor: '#fff',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 24,
    alignItems: 'center',
    gap: 8,
  },
  headerLabel: { fontSize: 14, color: '#888', fontWeight: '600', letterSpacing: 0.5 },
  nameInput: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
    borderBottomWidth: 2,
    borderBottomColor: '#4CAF50',
    paddingVertical: 4,
    minWidth: 200,
    textAlign: 'center',
  },
  dateLabel: { fontSize: 13, color: '#BDBDBD' },
  heroSection: {
    backgroundColor: '#fff',
    alignItems: 'center',
    paddingVertical: 28,
    marginTop: 1,
  },
  heroValue: { fontSize: 72, fontWeight: '800', color: '#1A1A1A', letterSpacing: -2 },
  heroUnit: { fontSize: 16, color: '#888', fontWeight: '600', marginTop: -4 },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingVertical: 20,
    paddingHorizontal: 24,
    marginTop: 1,
  },
  stat: { flex: 1, alignItems: 'center', gap: 4 },
  statDivider: { width: 1, backgroundColor: '#E0E0E0', marginVertical: 4 },
  statValue: { fontSize: 24, fontWeight: '700', color: '#1A1A1A' },
  statLabel: { fontSize: 12, color: '#888', letterSpacing: 0.5 },
  streetsBanner: {
    backgroundColor: '#E8F5E9',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  streetsBannerText: { fontSize: 15, fontWeight: '600', color: '#2E7D32' },
  mapContainer: { height: 240, marginTop: 12, marginHorizontal: 16, borderRadius: 16, overflow: 'hidden' },
  map: { flex: 1 },
  saveButton: {
    backgroundColor: '#4CAF50',
    margin: 24,
    marginBottom: 56,
    paddingVertical: 16,
    borderRadius: 28,
    alignItems: 'center',
  },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  modalCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 28,
    width: '100%',
    gap: 16,
    alignItems: 'center',
  },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#1A1A1A', textAlign: 'center' },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 16, width: '100%' },
  badgeEmoji: { fontSize: 48 },
  badgeName: { fontSize: 17, fontWeight: '700', color: '#1A1A1A' },
  badgeDesc: { fontSize: 13, color: '#888', marginTop: 2 },
  modalButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: 48,
    marginTop: 4,
  },
  modalButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
