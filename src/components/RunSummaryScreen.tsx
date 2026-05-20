import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MapboxGL from '@rnmapbox/maps';
import { MAPBOX_TOKEN } from '../constants';
import { Coordinate, RunRoute } from '../types';

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

function getBoundingBox(coordinates: Coordinate[]) {
  const lats = coordinates.map((c) => c.latitude);
  const lngs = coordinates.map((c) => c.longitude);
  return {
    ne: [Math.max(...lngs), Math.max(...lats)] as [number, number],
    sw: [Math.min(...lngs), Math.min(...lats)] as [number, number],
  };
}

export function RunSummaryScreen({ coveredKm, elapsedSeconds, route, onHome }: Props) {
  const routeGeoJSON: GeoJSON.Feature<GeoJSON.LineString> = {
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'LineString',
      coordinates: route.coordinates.map((c) => [c.longitude, c.latitude]),
    },
  };

  const bounds = getBoundingBox(route.coordinates);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Run Complete 🎉</Text>
      </View>

      {/* Route map */}
      <View style={styles.mapContainer}>
        <MapboxGL.MapView style={styles.map} styleURL={MapboxGL.StyleURL.Street} scrollEnabled={false} zoomEnabled={false} rotateEnabled={false}>
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
        </MapboxGL.MapView>
      </View>

      {/* Stats */}
      <View style={styles.statsCard}>
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{coveredKm.toFixed(2)}</Text>
            <Text style={styles.statLabel}>km</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statValue}>{formatTime(elapsedSeconds)}</Text>
            <Text style={styles.statLabel}>time</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statValue}>{formatPace(coveredKm, elapsedSeconds)}</Text>
            <Text style={styles.statLabel}>min/km</Text>
          </View>
        </View>
      </View>

      {/* Home button */}
      <TouchableOpacity style={styles.homeButton} onPress={onHome} activeOpacity={0.8}>
        <Text style={styles.homeButtonText}>Back to Home</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1A1A1A',
  },
  mapContainer: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  statsCard: {
    backgroundColor: '#fff',
    paddingVertical: 24,
    paddingHorizontal: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 8,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stat: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#E0E0E0',
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  statLabel: {
    fontSize: 12,
    color: '#888',
    letterSpacing: 0.5,
  },
  homeButton: {
    backgroundColor: '#4CAF50',
    margin: 24,
    paddingVertical: 16,
    borderRadius: 28,
    alignItems: 'center',
  },
  homeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
