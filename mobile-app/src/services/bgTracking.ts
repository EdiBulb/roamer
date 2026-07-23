import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { Area, Coordinate } from '../types';

export const LOCATION_TASK = 'roamer-location-task';

// AsyncStorage keys shared between background task context and React UI.
// Both contexts live in separate JS environments when backgrounded,
// so AsyncStorage is the only safe cross-context communication channel.
const K = {
  area:       '@roamer/bg_area',
  zoneHits:   '@roamer/bg_zone_hits',
  coloredIds: '@roamer/bg_colored_ids',
  gpsTrace:   '@roamer/bg_gps_trace',
  coveredM:   '@roamer/bg_covered_m',
  startTime:  '@roamer/bg_start_time',
  pausedMs:   '@roamer/bg_paused_ms',
  pauseStart: '@roamer/bg_pause_start',
  lastCoord:  '@roamer/bg_last_coord',
  isPaused:   '@roamer/bg_is_paused',
};

// Duplicated here so the background task context is self-contained
// (it can't import from RunScreen since that's a React component module)
function haversineKm(a: Coordinate, b: Coordinate): number {
  const R = 6371;
  const dLat = ((b.latitude - a.latitude) * Math.PI) / 180;
  const dLon = ((b.longitude - a.longitude) * Math.PI) / 180;
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.latitude * Math.PI) / 180) *
    Math.cos((b.latitude * Math.PI) / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.asin(Math.sqrt(x));
}

// Zone hit state per segment: f = front half touched, b = back half touched.
// Both must be true before a segment is colored.
type ZoneHit = { f: boolean; b: boolean };

async function processLocationUpdate(coord: Coordinate): Promise<void> {
  const results = await AsyncStorage.multiGet([
    K.area, K.zoneHits, K.coloredIds, K.gpsTrace,
    K.coveredM, K.lastCoord, K.isPaused,
  ]);
  const get = (key: string) => results.find(([k]) => k === key)?.[1] ?? null;

  if (get(K.isPaused) === 'true') return;

  const area: Area | null = get(K.area) ? JSON.parse(get(K.area)!) : null;
  const zoneHits: Record<string, ZoneHit> = get(K.zoneHits) ? JSON.parse(get(K.zoneHits)!) : {};
  const coloredSet = new Set<string>(get(K.coloredIds) ? JSON.parse(get(K.coloredIds)!) : []);
  const gpsTrace: Coordinate[] = get(K.gpsTrace) ? JSON.parse(get(K.gpsTrace)!) : [];
  let coveredM = get(K.coveredM) ? parseFloat(get(K.coveredM)!) : 0;
  const lastCoord: Coordinate | null = get(K.lastCoord) ? JSON.parse(get(K.lastCoord)!) : null;

  if (area?.segments.length) {
    const THRESHOLD_KM = 0.010;
    for (const seg of area.segments) {
      if (coloredSet.has(seg.id)) continue;

      const coords = seg.coordinates;

      // Segments with ≤ 2 coords are too short to split meaningfully —
      // a single proximity hit is enough to color them.
      if (coords.length <= 2) {
        for (const c of coords) {
          if (haversineKm(coord, c) <= THRESHOLD_KM) { coloredSet.add(seg.id); break; }
        }
        continue;
      }

      // Split into front half and back half by coordinate index.
      // Require at least one GPS hit in each half before coloring.
      const mid = Math.floor(coords.length / 2);
      const zones = zoneHits[seg.id] ?? { f: false, b: false };

      if (!zones.f) {
        for (let i = 0; i < mid; i++) {
          if (haversineKm(coord, coords[i]) <= THRESHOLD_KM) { zones.f = true; break; }
        }
      }
      if (!zones.b) {
        for (let i = mid; i < coords.length; i++) {
          if (haversineKm(coord, coords[i]) <= THRESHOLD_KM) { zones.b = true; break; }
        }
      }

      zoneHits[seg.id] = zones;
      if (zones.f && zones.b) coloredSet.add(seg.id);
    }
  }

  if (lastCoord) coveredM += haversineKm(lastCoord, coord) * 1000;

  gpsTrace.push(coord);
  if (gpsTrace.length > 2000) gpsTrace.splice(0, gpsTrace.length - 2000);

  await AsyncStorage.multiSet([
    [K.zoneHits,   JSON.stringify(zoneHits)],
    [K.coloredIds, JSON.stringify([...coloredSet])],
    [K.gpsTrace,   JSON.stringify(gpsTrace)],
    [K.coveredM,   String(coveredM)],
    [K.lastCoord,  JSON.stringify(coord)],
  ]);
}

// defineTask MUST be called at module load time (not inside a component or function).
// When this file is imported by App.tsx, this line runs before any component mounts,
// registering the task with the OS so it can fire even when the app is backgrounded.
TaskManager.defineTask(LOCATION_TASK, async ({ data, error }: TaskManager.TaskManagerTaskBody) => {
  if (error) { console.error('[BG] location task error:', error.message); return; }
  const { locations } = data as { locations: Location.LocationObject[] };
  for (const loc of locations) {
    await processLocationUpdate({
      latitude: loc.coords.latitude,
      longitude: loc.coords.longitude,
    });
  }
});

// ── Public API ────────────────────────────────────────────────────────────────

export async function startBackgroundTracking(area: Area, firstCoord: Coordinate): Promise<void> {
  await AsyncStorage.multiSet([
    [K.area,       JSON.stringify(area)],
    [K.zoneHits,   '{}'],
    [K.coloredIds, '[]'],
    [K.gpsTrace,   JSON.stringify([firstCoord])],
    [K.coveredM,   '0'],
    [K.startTime,  String(Date.now())],
    [K.pausedMs,   '0'],
    [K.lastCoord,  JSON.stringify(firstCoord)],
    [K.isPaused,   'false'],
  ]);

  // Android 10+ / iOS 13+ require explicit background location permission
  // (separate from foreground permission)
  const { granted } = await Location.requestBackgroundPermissionsAsync();
  if (!granted) throw new Error('background-permission-denied');

  await Location.startLocationUpdatesAsync(LOCATION_TASK, {
    accuracy: Location.Accuracy.BestForNavigation,
    timeInterval: 2000,
    distanceInterval: 0,
    showsBackgroundLocationIndicator: true,
    // Android requires a foreground service notification to keep the process alive.
    // Without this the OS kills the task within seconds of the screen turning off.
    foregroundService: {
      notificationTitle: 'Roamer is tracking your run',
      notificationBody: 'Tap to return to the app',
      notificationColor: '#4CAF50',
    },
  });
}

export async function pauseBackgroundTracking(): Promise<void> {
  await AsyncStorage.multiSet([
    [K.isPaused,   'true'],
    [K.pauseStart, String(Date.now())],
  ]);
}

export async function resumeBackgroundTracking(): Promise<void> {
  const [pauseStartRaw, pausedMsRaw] = await Promise.all([
    AsyncStorage.getItem(K.pauseStart),
    AsyncStorage.getItem(K.pausedMs),
  ]);
  const pausedSoFar = pausedMsRaw ? parseInt(pausedMsRaw) : 0;
  const additionalPause = pauseStartRaw ? Date.now() - parseInt(pauseStartRaw) : 0;
  await AsyncStorage.multiSet([
    [K.pausedMs, String(pausedSoFar + additionalPause)],
    [K.isPaused, 'false'],
  ]);
}

export async function stopBackgroundTracking(): Promise<void> {
  try {
    const isRunning = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK);
    if (isRunning) await Location.stopLocationUpdatesAsync(LOCATION_TASK);
  } catch {
    // Safe to ignore — task may not have started (e.g. permission denied)
  }
}

export interface BgState {
  coloredIds: Set<string>;
  gpsTrace: Coordinate[];
  coveredKm: number;
  elapsedSeconds: number;
}

export async function readBgState(): Promise<BgState> {
  const results = await AsyncStorage.multiGet([
    K.coloredIds, K.gpsTrace, K.coveredM, K.startTime, K.pausedMs,
  ]);
  const get = (key: string) => results.find(([k]) => k === key)?.[1] ?? null;

  const coloredIds = new Set<string>(get(K.coloredIds) ? JSON.parse(get(K.coloredIds)!) : []);
  const gpsTrace: Coordinate[] = get(K.gpsTrace) ? JSON.parse(get(K.gpsTrace)!) : [];
  const coveredKm = get(K.coveredM) ? parseFloat(get(K.coveredM)!) / 1000 : 0;
  const startTime = get(K.startTime) ? parseInt(get(K.startTime)!) : Date.now();
  const pausedMs = get(K.pausedMs) ? parseInt(get(K.pausedMs)!) : 0;
  const elapsedSeconds = Math.max(0, Math.floor((Date.now() - startTime - pausedMs) / 1000));

  return { coloredIds, gpsTrace, coveredKm, elapsedSeconds };
}

export async function clearBgState(): Promise<void> {
  await AsyncStorage.multiRemove(Object.values(K));
}
