import { Coordinate, RoadSegment } from '../types';

const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';

// Road types suitable for walking/running
const WALKABLE_HIGHWAY = [
  'residential', 'living_street', 'pedestrian', 'footway',
  'path', 'cycleway', 'service', 'tertiary', 'secondary',
  'primary', 'unclassified', 'track',
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

  const res = await fetch(OVERPASS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `data=${encodeURIComponent(query)}`,
  });

  if (!res.ok) throw new Error(`Overpass error: ${res.status}`);

  const json = await res.json();

  const segments: RoadSegment[] = (json.elements ?? [])
    .filter((el: any) => el.type === 'way' && el.geometry?.length >= 2)
    .map((el: any) => ({
      id: String(el.id),
      coordinates: el.geometry.map((pt: any) => ({
        latitude: pt.lat,
        longitude: pt.lon,
      })),
    }));

  return segments;
}

// Check if a GPS point is within distance (meters) of a segment
function pointToSegmentDistanceM(
  point: Coordinate,
  segA: Coordinate,
  segB: Coordinate,
): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;

  const lat1 = toRad(segA.latitude);
  const lon1 = toRad(segA.longitude);
  const lat2 = toRad(segB.latitude);
  const lon2 = toRad(segB.longitude);
  const lat0 = toRad(point.latitude);
  const lon0 = toRad(point.longitude);

  // Project point onto segment, clamp to [0,1]
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

// Returns segment IDs that the GPS trace passed through (within 15m tolerance)
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
