import MapboxGL from '@rnmapbox/maps';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Magnetometer } from 'expo-sensors';
import { MAPBOX_TOKEN, DEFAULT_ZOOM } from '../constants';
import { getBoundingBox } from '../services/mapboxApi';
import { Area, Coordinate, RunRoute } from '../types';
import { ExplorerPainterMarker } from './ExplorerPainterMarker';

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

function makeCircleGeoJSON(
  center: Coordinate,
  radiusKm: number,
  steps = 64,
): GeoJSON.Feature<GeoJSON.Polygon> {
  const R = 6371;
  const lat = (center.latitude * Math.PI) / 180;
  const lng = (center.longitude * Math.PI) / 180;
  const d = radiusKm / R;
  const ring: [number, number][] = [];
  for (let i = 0; i <= steps; i++) {
    const angle = (i / steps) * 2 * Math.PI;
    const pLat = Math.asin(
      Math.sin(lat) * Math.cos(d) + Math.cos(lat) * Math.sin(d) * Math.cos(angle),
    );
    const pLng =
      lng +
      Math.atan2(
        Math.sin(angle) * Math.sin(d) * Math.cos(lat),
        Math.cos(d) - Math.sin(lat) * Math.sin(pLat),
      );
    ring.push([(pLng * 180) / Math.PI, (pLat * 180) / Math.PI]);
  }
  return {
    type: 'Feature',
    properties: {},
    geometry: { type: 'Polygon', coordinates: [ring] },
  };
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

export type FollowMode = 'free' | 'follow' | 'north';

interface Props {
  location: Coordinate;
  route: RunRoute | null;
  isRunning?: boolean;
  bearing?: number;
  destinationPickerActive?: boolean;
  destination?: Coordinate | null;
  onMapPress?: (coord: Coordinate) => void;
  followMode?: FollowMode;
  onUserDrag?: () => void;
  onFollowModeChange?: (mode: FollowMode) => void;
  nextWaypointIndex?: number;
  isMyWayMode?: boolean;
  historyRoutes?: Coordinate[][];
  areas?: Area[];
  activeAreaId?: string | null;
  liveColoredIds?: Set<string>;
}

export function MapDisplay({
  location,
  route,
  isRunning = false,
  bearing = 0,
  destinationPickerActive = false,
  destination = null,
  onMapPress,
  followMode = 'follow',
  onUserDrag,
  onFollowModeChange,
  nextWaypointIndex = 0,
  isMyWayMode = false,
  historyRoutes = [],
  areas = [],
  activeAreaId = null,
  liveColoredIds,
}: Props) {
  const center: [number, number] = [location.longitude, location.latitude];
  const cameraRef = useRef<MapboxGL.Camera>(null);
  const mapRef = useRef<MapboxGL.MapView>(null);
  const boundsOriginRef = useRef<Coordinate>(location);

  const [compassHeading, setCompassHeading] = useState(0);
  const [mapHeading, setMapHeading] = useState(0);
  const [arrowPos, setArrowPos] = useState<{ x: number; y: number } | null>(null);
  const pulseAnim = useRef(new Animated.Value(0)).current;

  async function recalcArrowPos() {
    if (!mapRef.current) return;
    try {
      const pos = await (mapRef.current as any).getPointInView([location.longitude, location.latitude]);
      setArrowPos({ x: pos[0], y: pos[1] });
    } catch {}
  }

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

  // Running: follow user
  useEffect(() => {
    if (!isRunning || followMode === 'free') return;
    cameraRef.current?.setCamera({
      centerCoordinate: [location.longitude, location.latitude],
      zoomLevel: 18,
      heading: followMode === 'north' ? 0 : bearing,
      pitch: followMode === 'north' ? 0 : 45,
      animationDuration: 400,
      animationMode: 'easeTo',
    });
  }, [location, bearing, followMode, isRunning]);

  // Route generated: fit all coordinates
  useEffect(() => {
    if (isRunning || !route) return;
    const { ne, sw } = getBoundingBox(route.coordinates);
    cameraRef.current?.fitBounds(ne, sw, [100, 40, 100, 40], 1000);
  }, [route, isRunning]);

  // Destination set: fit origin + destination (one-shot, not affected by GPS drift)
  useEffect(() => {
    if (isRunning || route || !destination) return;
    boundsOriginRef.current = location;
    const { ne, sw } = getBoundingBox([location, destination]);
    cameraRef.current?.fitBounds(ne, sw, [80, 60, 80, 60], 800);
  }, [destination]);

  useEffect(() => {
    Magnetometer.setUpdateInterval(100);
    const sub = Magnetometer.addListener(({ x, y }) => {
      let angle = Math.atan2(-x, y) * (180 / Math.PI);
      if (angle < 0) angle += 360;
      setCompassHeading(Math.round(angle));
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    recalcArrowPos();
  }, [location]);


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

  // ── area boundary circles (not running) ──────────────────────────────────

  const { activeCircleGeoJSON, otherCirclesGeoJSON } = useMemo(() => {
    const active = areas.find((a) => a.id === activeAreaId);
    const others = areas.filter((a) => a.id !== activeAreaId);
    return {
      activeCircleGeoJSON: active ? makeCircleGeoJSON(active.center, active.radiusKm) : null,
      otherCirclesGeoJSON: others.length > 0
        ? { type: 'FeatureCollection' as const, features: others.map((a) => makeCircleGeoJSON(a.center, a.radiusKm)) }
        : null,
    };
  }, [areas, activeAreaId]);

  // ── area segment GeoJSONs (not running) ──────────────────────────────────
  // Active area selected → show only that area's segments (focused view)
  // No active area → show all areas lightly

  const areaSegmentGeoJSON = useMemo(() => {
    if (areas.length === 0) return null;
    // During run: only show active area. Not running: show active or all.
    const targetAreas = activeAreaId
      ? areas.filter((a) => a.id === activeAreaId)
      : isRunning ? [] : areas;
    if (targetAreas.length === 0) return null;
    const existing: GeoJSON.Feature<GeoJSON.LineString>[] = [];
    const fresh: GeoJSON.Feature<GeoJSON.LineString>[] = [];
    const uncolored: GeoJSON.Feature<GeoJSON.LineString>[] = [];
    for (const area of targetAreas) {
      const coloredSet = new Set(area.coloredSegmentIds);
      for (const seg of area.segments) {
        const feature = toLineGeoJSON(seg.coordinates);
        if (coloredSet.has(seg.id)) {
          existing.push(feature);
        } else if (liveColoredIds?.has(seg.id)) {
          fresh.push(feature);
        } else {
          uncolored.push(feature);
        }
      }
    }
    return {
      existing: { type: 'FeatureCollection' as const, features: existing },
      fresh: { type: 'FeatureCollection' as const, features: fresh },
      uncolored: { type: 'FeatureCollection' as const, features: uncolored },
    };
  }, [areas, activeAreaId, isRunning, liveColoredIds]);

  // ── camera: zoom to active area when selection changes ───────────────────

  useEffect(() => {
    if (isRunning || !activeAreaId) return;
    const area = areas.find((a) => a.id === activeAreaId);
    if (!area) return;
    const { center, radiusKm } = area;
    const deltaLat = (radiusKm * 1.4) / 111;
    const deltaLng = deltaLat / Math.cos((center.latitude * Math.PI) / 180);
    cameraRef.current?.fitBounds(
      [center.longitude + deltaLng, center.latitude + deltaLat],
      [center.longitude - deltaLng, center.latitude - deltaLat],
      [60, 60, 60, 60],
      600,
    );
  }, [activeAreaId]);

  // ── history routes GeoJSON (not running) ─────────────────────────────────

  const historyGeoJSON: GeoJSON.FeatureCollection<GeoJSON.LineString> | null = useMemo(() => {
    if (isRunning || historyRoutes.length === 0) return null;
    return {
      type: 'FeatureCollection',
      features: historyRoutes
        .filter((coords) => coords.length >= 2)
        .map((coords) => toLineGeoJSON(coords)),
    };
  }, [historyRoutes, isRunning]);

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
        ref={mapRef}
        style={styles.map}
        styleURL={MapboxGL.StyleURL.Street}
        onPress={handlePress}
        onDidFinishLoadingMap={() => recalcArrowPos()}
        onRegionDidChange={(feature) => {
          setMapHeading(feature.properties?.heading ?? 0);
          recalcArrowPos();
        }}
        onRegionIsChanging={(feature) => {
          setMapHeading(feature.properties?.heading ?? 0);
          if (isRunning && feature.properties?.isUserInteraction) onUserDrag?.();
          recalcArrowPos();
        }}
      >
        {/* ── camera (single ref — all positioning is imperative via useEffects) ── */}
        <MapboxGL.Camera
          ref={cameraRef}
          zoomLevel={DEFAULT_ZOOM}
          centerCoordinate={center}
          animationMode="none"
        />


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

        {/* ── other area circles (not running) ── */}
        {otherCirclesGeoJSON && !isRunning && (
          <MapboxGL.ShapeSource id="area-circles-other" shape={otherCirclesGeoJSON}>
            <MapboxGL.FillLayer
              id="area-circles-other-fill"
              style={{ fillColor: '#FF6B6B', fillOpacity: 0.04 }}
            />
            <MapboxGL.LineLayer
              id="area-circles-other-border"
              style={{ lineColor: '#FF6B6B', lineWidth: 1.5, lineOpacity: 0.4, lineDasharray: [4, 3] }}
            />
          </MapboxGL.ShapeSource>
        )}

        {/* ── active area circle (not running) ── */}
        {activeCircleGeoJSON && !isRunning && (
          <MapboxGL.ShapeSource id="area-circle-active" shape={activeCircleGeoJSON}>
            <MapboxGL.FillLayer
              id="area-circle-active-fill"
              style={{ fillColor: '#FF6B6B', fillOpacity: 0.08 }}
            />
            <MapboxGL.LineLayer
              id="area-circle-active-border"
              style={{ lineColor: '#FF6B6B', lineWidth: 2.5, lineOpacity: 0.9, lineDasharray: [4, 3] }}
            />
          </MapboxGL.ShapeSource>
        )}

        {/* ── area segments (running + not running) ── */}
        {areaSegmentGeoJSON && (
          <>
            <MapboxGL.ShapeSource id="area-uncolored" shape={areaSegmentGeoJSON.uncolored}>
              <MapboxGL.LineLayer
                id="area-uncolored-line"
                style={{ lineColor: '#E0E0E0', lineWidth: 3, lineJoin: 'round', lineCap: 'round', lineOpacity: 0.8 }}
              />
            </MapboxGL.ShapeSource>
            <MapboxGL.ShapeSource id="area-existing" shape={areaSegmentGeoJSON.existing}>
              <MapboxGL.LineLayer
                id="area-existing-line"
                style={{ lineColor: '#4CAF50', lineWidth: 4, lineJoin: 'round', lineCap: 'round', lineOpacity: 0.9 }}
              />
            </MapboxGL.ShapeSource>
            <MapboxGL.ShapeSource id="area-fresh" shape={areaSegmentGeoJSON.fresh}>
              <MapboxGL.LineLayer
                id="area-fresh-line"
                style={{ lineColor: '#FF6B6B', lineWidth: 4, lineJoin: 'round', lineCap: 'round', lineOpacity: 1 }}
              />
            </MapboxGL.ShapeSource>
          </>
        )}

        {/* ── history routes (not running) ── */}
        {historyGeoJSON && (
          <MapboxGL.ShapeSource id="history-routes" shape={historyGeoJSON}>
            <MapboxGL.LineLayer
              id="history-routes-line"
              style={{ lineColor: '#4CAF50', lineWidth: 4, lineJoin: 'round', lineCap: 'round', lineOpacity: 0.85 }}
            />
          </MapboxGL.ShapeSource>
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
                style={{ lineColor: '#E8F5E9', lineWidth: 4, lineJoin: 'round', lineCap: 'round', lineOpacity: isMyWayMode ? 0.25 : 1 }}
              />
            </MapboxGL.ShapeSource>
            <MapboxGL.ShapeSource id="seg-next" shape={toLineGeoJSON(segments.next)}>
              <MapboxGL.LineLayer
                id="seg-next-line"
                style={{ lineColor: '#A5D6A7', lineWidth: 4, lineJoin: 'round', lineCap: 'round', lineOpacity: isMyWayMode ? 0.25 : 1 }}
              />
            </MapboxGL.ShapeSource>
            <MapboxGL.ShapeSource id="seg-completed" shape={toLineGeoJSON(segments.completed)}>
              <MapboxGL.LineLayer
                id="seg-completed-line"
                style={{ lineColor: '#9E9E9E', lineWidth: 4, lineJoin: 'round', lineCap: 'round', lineOpacity: isMyWayMode ? 0.25 : 1 }}
              />
            </MapboxGL.ShapeSource>
            <MapboxGL.ShapeSource id="seg-current" shape={toLineGeoJSON(segments.current)}>
              <MapboxGL.LineLayer
                id="seg-current-line"
                style={{ lineColor: '#4CAF50', lineWidth: 4, lineJoin: 'round', lineCap: 'round', lineOpacity: isMyWayMode ? 0.25 : 1 }}
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

        {/* ── conquered area flags ── */}
        {areas.filter(a => a.conquered).map(a => (
          <MapboxGL.PointAnnotation
            key={`flag-${a.id}`}
            id={`flag-${a.id}`}
            coordinate={[a.center.longitude, a.center.latitude]}
          >
            <View style={styles.flagMarker}>
              <Text style={styles.flagMarkerText}>🚩</Text>
            </View>
          </MapboxGL.PointAnnotation>
        ))}
      </MapboxGL.MapView>

      {/* ── follow button ── */}
      {isRunning && (
        <TouchableOpacity
          style={[styles.followButton, followMode !== 'free' ? styles.followButtonActive : styles.followButtonInactive]}
          onPress={() => {
            const next: FollowMode = followMode === 'free' ? 'follow' : followMode === 'follow' ? 'north' : 'follow';
            onFollowModeChange?.(next);
          }}
          activeOpacity={0.8}
        >
          {followMode === 'north' ? (
            <View style={styles.northButton}>
              <Text style={styles.northButtonText}>N↑</Text>
            </View>
          ) : (
            <Image
              source={
                followMode === 'follow'
                  ? require('../../assets/icons/follow-active.png')
                  : require('../../assets/icons/follow-inactive.png')
              }
              style={styles.followIcon}
              resizeMode="contain"
            />
          )}
        </TouchableOpacity>
      )}

      {/* ── ExplorerPainterMarker at GPS screen position ── */}
      {arrowPos && (
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: arrowPos.x - 27, // 54/2 = 27 — center marker on GPS point
            top: arrowPos.y - 27,
          }}
        >
          <ExplorerPainterMarker
            heading={compassHeading - mapHeading}
            isActive={isRunning}
          />
        </View>
      )}

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
  northButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  northButtonText: { fontSize: 16, fontWeight: '800', color: '#4285F4' },
  centeredArrow: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#4285F4',
    borderWidth: 2,
    borderColor: '#fff',
  },
  flagMarker: { alignItems: 'center', justifyContent: 'center' },
  flagMarkerText: { fontSize: 28 },
});
