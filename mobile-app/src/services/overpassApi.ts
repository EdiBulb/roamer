import { Coordinate, RoadSegment } from '../types';

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
  'https://overpass.kumi.systems/api/interpreter',
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
  'https://overpass-api.de/api/interpreter',
];

const WALKABLE_HIGHWAY = [
  'residential', 'living_street', 'pedestrian', 'footway',
  'path', 'tertiary', 'secondary', 'primary', 'unclassified',
];

export async function fetchSegmentsInArea(
  center: Coordinate,
  radiusM: number,
): Promise<RoadSegment[]> {
  const query = `
    [out:json][timeout:30];
    way["highway"~"^(${WALKABLE_HIGHWAY.join('|')})$"]
      (around:${radiusM},${center.latitude},${center.longitude});
    out geom;
  `;

  const fetchWithTimeout = (url: string, timeoutMs: number) =>
    Promise.race([
      fetch(`${url}?data=${encodeURIComponent(query)}`, { method: 'GET' }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`Timeout after ${timeoutMs}ms`)), timeoutMs),
      ),
    ]);

  let lastError: unknown;
  for (const url of OVERPASS_ENDPOINTS) {
    try {
      console.log(`[Overpass] Trying ${url}`);
      const res = await fetchWithTimeout(url, 10000);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();

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

      console.log(`[Overpass] Success: ${segments.length} segments from ${url}`);
      return segments;
    } catch (e) {
      console.warn(`[Overpass] Failed ${url}:`, e);
      lastError = e;
    }
  }

  throw lastError ?? new Error('All Overpass endpoints failed');
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

export function matchTraceToSegments(
  trace: Coordinate[],
  segments: RoadSegment[],
  toleranceM = 15,
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
