import AsyncStorage from '@react-native-async-storage/async-storage';
import { Coordinate, RoadSegment } from '../types';

// ── Segment cache ─────────────────────────────────────────────────────────────
const CACHE_PREFIX = '@roamer/segs_v1_';
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function bboxCacheKey(south: number, west: number, north: number, east: number): string {
  // Round to 2 decimal places (~1 km grid) so nearby areas share the cache
  const r = (n: number) => Math.round(n * 100) / 100;
  return `${r(south)}_${r(west)}_${r(north)}_${r(east)}`;
}

async function readCache(key: string): Promise<RoadSegment[] | null> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_PREFIX + key);
    if (!raw) return null;
    const { segments, fetchedAt } = JSON.parse(raw);
    if (Date.now() - fetchedAt > CACHE_TTL_MS) return null;
    console.log('[Overpass] cache hit:', key);
    return segments as RoadSegment[];
  } catch { return null; }
}

async function writeCache(key: string, segments: RoadSegment[]): Promise<void> {
  try {
    await AsyncStorage.setItem(CACHE_PREFIX + key, JSON.stringify({ segments, fetchedAt: Date.now() }));
  } catch {}
}

function distanceKm(a: Coordinate, b: Coordinate): number {
  const R = 6371;
  const dLat = ((b.latitude - a.latitude) * Math.PI) / 180;
  const dLon = ((b.longitude - a.longitude) * Math.PI) / 180;
  const lat1 = (a.latitude * Math.PI) / 180;
  const lat2 = (b.latitude * Math.PI) / 180;
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.asin(Math.sqrt(x));
}

function clipSegmentToCircle(
  segment: RoadSegment,
  center: Coordinate,
  radiusKm: number,
): RoadSegment | null {
  const clipped = segment.coordinates.filter(
    (coord) => distanceKm(coord, center) <= radiusKm,
  );
  if (clipped.length < 2) return null;
  return { ...segment, coordinates: clipped };
}

const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
];

// Race all endpoints simultaneously — first successful response wins.
// If all fail, waits 2s and retries once before throwing.
async function fetchOverpass(query: string, timeoutMs: number): Promise<any> {
  const race = async (): Promise<any> => {
    const attempt = (url: string) =>
      Promise.race([
        fetch(`${url}?data=${encodeURIComponent(query)}`, { method: 'GET' }).then(res => {
          if (!res.ok) throw new Error(`HTTP ${res.status} from ${url}`);
          return res.json();
        }),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error(`Timeout from ${url}`)), timeoutMs),
        ),
      ]);

    const results = await Promise.allSettled(OVERPASS_ENDPOINTS.map(url => attempt(url)));
    const success = results.find((r): r is PromiseFulfilledResult<any> => r.status === 'fulfilled');
    if (success) return success.value;

    const errors = results
      .filter((r): r is PromiseRejectedResult => r.status === 'rejected')
      .map(r => r.reason?.message ?? String(r.reason))
      .join(' | ');
    throw new Error(`All Overpass endpoints failed: ${errors}`);
  };

  try {
    return await race();
  } catch (firstError) {
    console.warn('[Overpass] First attempt failed, retrying in 2s…', firstError);
    await new Promise(res => setTimeout(res, 2000));
    return await race(); // throws if second attempt also fails
  }
}

const WALKABLE_HIGHWAY = [
  'residential', 'living_street', 'pedestrian', 'footway',
  'path', 'tertiary', 'secondary', 'primary', 'unclassified',
];

export async function fetchSegmentsInArea(
  center: Coordinate,
  radiusM: number,
): Promise<RoadSegment[]> {
  const query = `
    [out:json][timeout:25];
    way["highway"~"^(${WALKABLE_HIGHWAY.join('|')})$"]
      (around:${radiusM},${center.latitude},${center.longitude});
    out geom;
  `;

  const json = await fetchOverpass(query, 20000);
  const radiusKm = radiusM / 1000;
  const segments: RoadSegment[] = (json.elements ?? [])
    .filter((el: any) => el.type === 'way' && el.geometry?.length >= 2)
    .map((el: any) => clipSegmentToCircle(
      {
        id: String(el.id),
        coordinates: el.geometry.map((pt: any) => ({
          latitude: pt.lat,
          longitude: pt.lon,
        })),
      },
      center,
      radiusKm,
    ))
    .filter((seg: RoadSegment | null): seg is RoadSegment => seg !== null);

  console.log(`[Overpass] fetchSegmentsInArea: ${segments.length} segments`);
  return segments;
}

function pointToSegmentDistanceM(
  point: Coordinate,
  segA: Coordinate,
  segB: Coordinate,
): number {
  const R = 6371000;
  const toRad = (d: number): number => (d * Math.PI) / 180;

  const lat1 = toRad(segA.latitude);
  const lon1 = toRad(segA.longitude);
  const lat2 = toRad(segB.latitude);
  const lon2 = toRad(segB.longitude);
  const lat0 = toRad(point.latitude);
  const lon0 = toRad(point.longitude);

  const dx = lon2 - lon1;
  const dy = lat2 - lat1;
  const len2 = dx * dx + dy * dy;
  let t = len2 === 0 ? 0 : ((lon0 - lon1) * dx + (lat0 - lat1) * dy) / len2;
  t = Math.max(0, Math.min(1, t));

  const nearLat = lat1 + t * (lat2 - lat1);
  const nearLon = lon1 + t * (lon2 - lon1);

  const dLat = lat0 - nearLat;
  const dLon = (lon0 - nearLon) * Math.cos((lat0 + nearLat) / 2);
  return Math.sqrt(dLat * dLat + dLon * dLon) * R;
}

export function isPointInPolygon(point: Coordinate, polygon: Coordinate[]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].longitude, yi = polygon[i].latitude;
    const xj = polygon[j].longitude, yj = polygon[j].latitude;
    const intersect =
      yi > point.latitude !== yj > point.latitude &&
      point.longitude < ((xj - xi) * (point.latitude - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

export async function fetchSegmentsInPolygon(polygon: Coordinate[]): Promise<RoadSegment[]> {
  const lats = polygon.map((c) => c.latitude);
  const lngs = polygon.map((c) => c.longitude);
  const south = Math.min(...lats);
  const north = Math.max(...lats);
  const west = Math.min(...lngs);
  const east = Math.max(...lngs);

  const cacheKey = bboxCacheKey(south, west, north, east);
  const cached = await readCache(cacheKey);

  let allSegments: RoadSegment[];

  if (cached) {
    allSegments = cached;
  } else {
    // bbox query is faster server-side than poly; filter to polygon client-side
    const query = `
      [out:json][timeout:25];
      way["highway"~"^(${WALKABLE_HIGHWAY.join('|')})$"]
        (${south},${west},${north},${east});
      out geom;
    `;
    const json = await fetchOverpass(query, 20000);
    allSegments = (json.elements ?? [])
      .filter((el: any) => el.type === 'way' && el.geometry?.length >= 2)
      .map((el: any) => ({
        id: String(el.id),
        coordinates: el.geometry.map((pt: any) => ({
          latitude: pt.lat,
          longitude: pt.lon,
        })),
      }));
    await writeCache(cacheKey, allSegments);
    console.log(`[Overpass] fetched ${allSegments.length} segments, cached as ${cacheKey}`);
  }

  const segments = allSegments
    .map((seg) => ({
      ...seg,
      coordinates: seg.coordinates.filter((c) => isPointInPolygon(c, polygon)),
    }))
    .filter((seg) => seg.coordinates.length >= 2);

  console.log(`[Overpass] fetchSegmentsInPolygon: ${segments.length} segments in polygon`);
  return segments;
}

export function matchTraceToSegments(
  trace: Coordinate[],
  segments: RoadSegment[],
  toleranceM = 20,
): string[] {
  const colored = new Set<string>();

  for (const seg of segments) {
    outer: for (const point of trace) {
      for (let i = 0; i < seg.coordinates.length - 1; i++) {
        const dist = pointToSegmentDistanceM(
          point,
          seg.coordinates[i],
          seg.coordinates[i + 1],
        );
        if (dist <= toleranceM) {
          colored.add(seg.id);
          break outer;
        }
      }
    }
  }

  return Array.from(colored);
}
