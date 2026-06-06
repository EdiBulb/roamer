import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MAPBOX_TOKEN } from '../constants';
import { Coordinate, RunRecord } from '../types';

function coordsToStr(coords: Coordinate[]): string {
  return coords.map(c => `[${c.longitude},${c.latitude}]`).join(',');
}

interface Props {
  record: RunRecord;
  onLongPress?: () => void;
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
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function sampleCoords(coords: Coordinate[], maxPoints: number): Coordinate[] {
  if (!coords || coords.length === 0) return [];
  if (coords.length <= maxPoints) return coords;
  const step = Math.floor(coords.length / maxPoints);
  const sampled = coords.filter((_, i) => i % step === 0);
  if (sampled[sampled.length - 1] !== coords[coords.length - 1]) {
    sampled.push(coords[coords.length - 1]);
  }
  return sampled;
}

function buildStaticMapUrl(coordinates: Coordinate[], newStreetSegments?: Coordinate[][]): string | null {
  if (!coordinates || coordinates.length === 0) return null;
  const sampled = sampleCoords(coordinates, 50);
  const fullRouteGeoJSON = `{"type":"Feature","properties":{"stroke":"#4CAF50","stroke-width":3},"geometry":{"type":"LineString","coordinates":[${coordsToStr(sampled)}]}}`;
  let overlays = `geojson(${encodeURIComponent(fullRouteGeoJSON)})`;

  if (newStreetSegments && newStreetSegments.length > 0) {
    const capped = newStreetSegments.slice(0, 8);
    const sampledSegs = capped.map(seg => sampleCoords(seg, 5));
    const multiCoords = sampledSegs.map(seg => `[${coordsToStr(seg)}]`).join(',');
    const newGeoJSON = `{"type":"Feature","properties":{"stroke":"#F44336","stroke-width":3},"geometry":{"type":"MultiLineString","coordinates":[${multiCoords}]}}`;
    overlays += `,geojson(${encodeURIComponent(newGeoJSON)})`;
  }

  return `https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/${overlays}/auto/400x220@2x?padding=40&access_token=${MAPBOX_TOKEN}`;
}

export function RunCard({ record, onLongPress }: Props) {
  const mapUrl = buildStaticMapUrl(record.routeCoordinates, record.newStreetSegments);

  return (
    <TouchableOpacity style={styles.card} onLongPress={onLongPress} activeOpacity={0.92} delayLongPress={400}>
      <Image
        source={mapUrl ? { uri: mapUrl } : undefined}
        style={styles.map}
        resizeMode="cover"
      />
      <View style={styles.overlay}>
        <View style={styles.gradientFill} />
        <View style={styles.topRow}>
          <View style={styles.nameRow}>
            <Text style={styles.name} numberOfLines={1}>{record.name}</Text>
            {record.newStreets?.length > 0 && (
              <View style={styles.streetsBadge}>
                <Text style={styles.streetsBadgeText}>+{record.newStreets.length} new</Text>
              </View>
            )}
          </View>
          <Text style={styles.date}>{formatDate(record.date)}</Text>
        </View>
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{record.distanceKm.toFixed(2)}</Text>
            <Text style={styles.statLabel}>km</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statValue}>{formatTime(record.elapsedSeconds)}</Text>
            <Text style={styles.statLabel}>time</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statValue}>{formatPace(record.distanceKm, record.elapsedSeconds)}</Text>
            <Text style={styles.statLabel}>min/km</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    height: 200,
    borderRadius: 20,
    overflow: 'hidden',
    marginHorizontal: 16,
    marginBottom: 14,
    backgroundColor: '#C8E6C9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 5,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    padding: 16,
    gap: 10,
  },
  topRow: {
    gap: 2,
  },
  name: {
    fontSize: 17,
    fontWeight: '700',
    color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  date: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.75)',
    fontWeight: '500',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stat: {
    flex: 1,
    alignItems: 'center',
    gap: 1,
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  statValue: {
    fontSize: 17,
    fontWeight: '700',
    color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  statLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 0.5,
    fontWeight: '500',
  },
  gradientFill: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '75%',
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  streetsBadge: {
    backgroundColor: 'rgba(76,175,80,0.85)',
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  streetsBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
  },
});
