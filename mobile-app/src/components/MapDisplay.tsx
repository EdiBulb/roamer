import MapboxGL from '@rnmapbox/maps';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Magnetometer } from 'expo-sensors';
import { MAPBOX_TOKEN, DEFAULT_ZOOM } from '../constants';
import { getBoundingBox } from '../services/mapboxApi';
import { Coordinate, RunRoute } from '../types';

MapboxGL.setAccessToken(MAPBOX_TOKEN);

// ── helpers ──────────────────────────────────────────────────────────────────

function findCoordIndex(coords: Coordinate[], target: Coordinate): number {
  let minDist = Infinity;
  let minIdx = 0;
  for (let i = 0; i < coords.length; i++) {
    const d =
      Math.pow(coords[i].latitude - target.latitude, 2) +
      Math.pow(coords[i].longitude - target.longitude, 2);
    if (d < minDist) { minDist = d; minIdx = i; }
  }
  return minIdx;
}

function calcBearing(from: Coordinate, to: Coordinate): number {
  const lat1 = (from.latitude * Math.PI) / 180;
  const lat2 = (to.latitude * Math.PI) / 180;
  const dLon = ((to.longitude - from.longitude) * Math.PI) / 180;
  const y = Math.sin(dLon) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
  return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
}

function sampleArrows(
  coords: Coordinate[],
  interval = 8,
): Array<{ coord: Coordinate; bearing: number }> {
  const result: Array<{ coord: Coordinate; bearing: number }> = [];
  for (let i = interval; i < coords.length - 1; i += interval) {
    result.push({ coord: coords[i], bearing: calcBearing(coords[i - 1], coords[i + 1]) });
  }
  return result;
}

function toLineGeoJSON(coords: Coordinate[]): GeoJSON.Feature<GeoJSON.LineString> {
  return {
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'LineString',
      coordinates: coords.length >= 2 ? coords.map((c) => [c.longitude, c.latitude]) : [],
    },
  };
}

// ── component ─────────────────────────────────────────────────────────────────

interface Props {
  location: Coordinate;
  route: RunRoute | null;
  isRunning?: boolean;
  bearing?: number;
  destinationPickerActive?: boolean;
  destination?: Coordinate | null;
  onMapPress?: (coord: Coordinate) => void;
  isFollowMode?: boolean;
  onUserDrag?: () => void;
  onFollowResume?: () => void;
  nextWaypointIndex?: number;
}

export function MapDisplay({
  location,
  route,
  isRunning = false,
  bearing = 0,
  destinationPickerActive = false,
  destination = null,
  onMapPress,
  isFollowMode = true,
  onUserDrag,
  onFollowResume,
  nextWaypointIndex = 0,
}: Props) {
  const center: [number, number] = [location.longitude, location.latitude];
  const cameraRef = useRef<MapboxGL.Camera>(null);

  const [compassHeading, setCompassHeading] = useState(0);
  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0, duration: 100, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  useEffect(() => {
    if (!isRunning || !isFollowMode) return;
    cameraRef.current?.setCamera({
      centerCoordinate: [location.longitude, location.latitude],
      zoomLevel: 18,
      heading: bearing,
      pitch: 45,
      animationDuration: 400,
      animationMode: 'easeTo',
    });
  }, [location, bearing, isFollowMode, isRunning]);

  useEffect(() => {
    Magnetometer.setUpdateInterval(100);
    const sub = Magnetometer.addListener(({ x, y }) => {
      let angle = Math.atan2(y, x) * (180 / Math.PI);
      angle = angle + 90;
      if (angle > 360) angle -= 360;
      if (angle < 0) angle += 360;
      setCompassHeading(Math.round(angle));
    });
    return () => sub.remove();
  }, []);

  // Always use Magnetometer for the arrow — 100ms updates vs GPS 2s updates
  const effectiveBearing = compassHeading;

  // ── route segment splitting (only when running) ───────────────────────────

  const segments = useMemo(() => {
    if (!route || !isRunning) return null;

    const coords = route.coordinates;
    const wps = route.waypoints;
    const n = nextWaypointIndex;

    const splits = wps.map((wp) => findCoordIndex(coords, wp));

    const s0 = n > 0 ? splits[n - 1] : 0;
    const s1 = n < wps.length ? splits[n] : coords.length - 1;
    const s2 = n + 1 < wps.length ? splits[n + 1] : coords.length - 1;

    return {
      completed: n > 0 ? coords.slice(0, s0 + 1) : [],
      current: coords.slice(s0, s1 + 1),
      next: n < wps.length ? coords.slice(s1, s2 + 1) : [],
      rest: n + 1 < wps.length ? coords.slice(s2) : [],
    };
  }, [route, isRunning, nextWaypointIndex]);

  const arrows = useMemo(() => {
    if (!segments) return [];
    return [
      ...sampleArrows(segments.current).map((a, i) => ({ ...a, id: `cur-${i}` })),
      ...sampleArrows(segments.next).map((a, i) => ({ ...a, id: `nxt-${i}` })),
    ];
  }, [segments]);

  // ── static preview GeoJSON (not running) ─────────────────────────────────

  const previewGeoJSON: GeoJSON.Feature<GeoJSON.LineString> | null =
    !isRunning && route ? toLineGeoJSON(route.coordinates) : null;

  // ── map press handler ─────────────────────────────────────────────────────

  function handlePress(feature: GeoJSON.Feature) {
    if (!destinationPickerActive || !onMapPress) return;
    const [longitude, latitude] = (feature.geometry as GeoJSON.Point).coordinates;
    onMapPress({ latitude, longitude });
  }

  return (
    <View style={styles.container}>
      <MapboxGL.MapView
        style={styles.map}
        styleURL={MapboxGL.StyleURL.Street}
        onPress={handlePress}
        onRegionIsChanging={(feature) => {
          if (isRunning && feature.properties?.isUserInteraction) onUserDrag?.();
        }}
      >
        {/* ── camera ── */}
        {isRunning ? (
          <MapboxGL.Camera ref={cameraRef} />
        ) : route ? (
          <MapboxGL.Camera
            bounds={{
              ...getBoundingBox(route.coordinates),
              paddingTop: 100,
              paddingBottom: 100,
              paddingLeft: 40,
              paddingRight: 40,
            }}
            animationMode="flyTo"
            animationDuration={1000}
          />
        ) : (
          <MapboxGL.Camera
            zoomLevel={DEFAULT_ZOOM}
            centerCoordinate={center}
            animationMode="flyTo"
            animationDuration={1000}
          />
        )}

        {/* ── user location arrow ── */}
        <MapboxGL.PointAnnotation id="user-location" coordinate={center}>
          <View style={[styles.arrowWrapper, { transform: [{ rotate: `${effectiveBearing}deg` }] }]}>
            <View style={styles.arrowOuter} />
            <View style={styles.arrowInner} />
          </View>
        </MapboxGL.PointAnnotation>

        {/* ── destination pin ── */}
        {destination && (
          <MapboxGL.PointAnnotation
            id="destination-pin"
            coordinate={[destination.longitude, destination.latitude]}
          >
            <View style={styles.destinationOuter}>
              <View style={styles.destinationInner} />
            </View>
          </MapboxGL.PointAnnotation>
        )}

        {/* ── route: preview (not running) ── */}
        {previewGeoJSON && (
          <MapboxGL.ShapeSource id="route-preview" shape={previewGeoJSON}>
            <MapboxGL.LineLayer
              id="route-preview-line"
              style={{ lineColor: '#4CAF50', lineWidth: 4, lineJoin: 'round', lineCap: 'round' }}
            />
          </MapboxGL.ShapeSource>
        )}

        {/* ── route: dynamic segments (running) ── */}
        {/* Render order: rest → next → completed → current (last = on top) */}
        {segments && (
          <>
            <MapboxGL.ShapeSource id="seg-rest" shape={toLineGeoJSON(segments.rest)}>
              <MapboxGL.LineLayer
                id="seg-rest-line"
                style={{ lineColor: '#E8F5E9', lineWidth: 4, lineJoin: 'round', lineCap: 'round' }}
              />
            </MapboxGL.ShapeSource>
            <MapboxGL.ShapeSource id="seg-next" shape={toLineGeoJSON(segments.next)}>
              <MapboxGL.LineLayer
                id="seg-next-line"
                style={{ lineColor: '#A5D6A7', lineWidth: 4, lineJoin: 'round', lineCap: 'round' }}
              />
            </MapboxGL.ShapeSource>
            <MapboxGL.ShapeSource id="seg-completed" shape={toLineGeoJSON(segments.completed)}>
              <MapboxGL.LineLayer
                id="seg-completed-line"
                style={{ lineColor: '#9E9E9E', lineWidth: 4, lineJoin: 'round', lineCap: 'round' }}
              />
            </MapboxGL.ShapeSource>
            <MapboxGL.ShapeSource id="seg-current" shape={toLineGeoJSON(segments.current)}>
              <MapboxGL.LineLayer
                id="seg-current-line"
                style={{ lineColor: '#4CAF50', lineWidth: 4, lineJoin: 'round', lineCap: 'round' }}
              />
            </MapboxGL.ShapeSource>
          </>
        )}

        {/* ── direction arrows (current + next segments only) ── */}
        {arrows.map(({ id, coord, bearing: b }) => (
          <MapboxGL.PointAnnotation
            key={id}
            id={`arrow-${id}`}
            coordinate={[coord.longitude, coord.latitude]}
          >
            <View style={[styles.arrowMarkerWrapper, { transform: [{ rotate: `${b}deg` }] }]}>
              <View style={styles.arrowMarker} />
            </View>
          </MapboxGL.PointAnnotation>
        ))}

        {/* ── waypoints ── */}
        {route?.waypoints && route.waypoints.length > 0 && (
          <MapboxGL.ShapeSource
            id="waypoints-source"
            shape={{
              type: 'FeatureCollection',
              features: route.waypoints
                .filter((_, i) => !isRunning || i !== nextWaypointIndex)
                .map((wp, i) => ({
                  type: 'Feature',
                  id: String(i),
                  properties: {},
                  geometry: { type: 'Point', coordinates: [wp.longitude, wp.latitude] },
                })),
            }}
          >
            <MapboxGL.CircleLayer
              id="waypoints-layer"
              style={{ circleRadius: 6, circleColor: '#000', circleStrokeWidth: 2, circleStrokeColor: '#fff' }}
            />
          </MapboxGL.ShapeSource>
        )}

        {/* ── next waypoint pulse ── */}
        {isRunning && route?.waypoints?.[nextWaypointIndex] && (
          <MapboxGL.PointAnnotation
            id="next-waypoint"
            coordinate={[
              route.waypoints[nextWaypointIndex].longitude,
              route.waypoints[nextWaypointIndex].latitude,
            ]}
          >
            <View style={styles.nextWpContainer}>
              <Animated.View
                style={[
                  styles.nextWpPulse,
                  {
                    opacity: pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [0.5, 0] }),
                    transform: [{ scale: pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 2.8] }) }],
                  },
                ]}
              />
              <View style={styles.nextWpDot} />
            </View>
          </MapboxGL.PointAnnotation>
        )}
      </MapboxGL.MapView>

      {/* ── follow button ── */}
      {isRunning && (
        <TouchableOpacity
          style={[styles.followButton, isFollowMode ? styles.followButtonActive : styles.followButtonInactive]}
          onPress={onFollowResume}
          activeOpacity={0.8}
        >
          <Image
            source={
              isFollowMode
                ? require('../../assets/icons/follow-active.png')
                : require('../../assets/icons/follow-inactive.png')
            }
            style={styles.followIcon}
            resizeMode="contain"
          />
        </TouchableOpacity>
      )}

      {/* ── destination picker hint ── */}
      {destinationPickerActive && (
        <View style={styles.tapHint} pointerEvents="none">
          <View style={styles.tapHintBadge}>
            <Text style={styles.tapHintText}>📍  Tap the map to set destination</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, width: '100%' },
  map: { flex: 1 },
  arrowWrapper: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowOuter: {
    position: 'absolute',
    width: 0,
    height: 0,
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderBottomWidth: 24,
    borderStyle: 'solid',
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#fff',
  },
  arrowInner: {
    position: 'absolute',
    width: 0,
    height: 0,
    borderLeftWidth: 7,
    borderRightWidth: 7,
    borderBottomWidth: 18,
    borderStyle: 'solid',
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#4285F4',
    marginTop: 3,
  },
  arrowMarkerWrapper: {
    width: 14,
    height: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowMarker: {
    width: 0,
    height: 0,
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderBottomWidth: 10,
    borderStyle: 'solid',
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#fff',
  },
  destinationOuter: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(229, 57, 53, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  destinationInner: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#E53935',
    borderWidth: 2,
    borderColor: '#fff',
  },
  followButton: {
    position: 'absolute',
    bottom: 110,
    right: 8,
    borderRadius: 40,
  },
  followButtonActive: { borderWidth: 2.5, borderColor: '#4285F4' },
  followButtonInactive: { borderWidth: 2.5, borderColor: '#aaa' },
  followIcon: { width: 50, height: 50 },
  nextWpContainer: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextWpPulse: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#4285F4',
  },
  nextWpDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#4285F4',
    borderWidth: 3,
    borderColor: '#fff',
  },
  tapHint: {
    position: 'absolute',
    top: 16,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  tapHintBadge: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  tapHintText: { color: '#fff', fontSize: 13, fontWeight: '600' },
});
