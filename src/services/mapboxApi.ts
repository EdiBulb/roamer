import { MAPBOX_TOKEN } from '../constants';
import { Coordinate, Difficulty, RouteStep, RunRoute } from '../types';

const DIRECTIONS_URL = 'https://api.mapbox.com/directions/v5/mapbox/walking';

function toRad(deg: number) {
  return (deg * Math.PI) / 180;
}

function toDeg(rad: number) {
  return (rad * 180) / Math.PI;
}

// Returns the coordinate reached by travelling distanceKm from origin in the given bearing direction.
// Uses spherical trigonometry because the Earth is a sphere, not a flat plane.
function offsetCoordinate(origin: Coordinate, bearing: number, distanceKm: number): Coordinate {
  const R = 6371;
  const d = distanceKm / R;
  const lat1 = toRad(origin.latitude);
  const lon1 = toRad(origin.longitude);
  const brng = toRad(bearing);

  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(d) + Math.cos(lat1) * Math.sin(d) * Math.cos(brng)
  );
  const lon2 =
    lon1 +
    Math.atan2(
      Math.sin(brng) * Math.sin(d) * Math.cos(lat1),
      Math.cos(d) - Math.sin(lat1) * Math.sin(lat2)
    );

  return {
    latitude: toDeg(lat2),
    longitude: toDeg(lon2),
  };
}

// Places 4 or 5 waypoints at even intervals around the origin for more varied loop shapes.
// Jitter is capped at 25% of the interval to preserve minimum angular separation between
// consecutive waypoints, which prevents Mapbox from routing back down the same road.
function generateWaypoints(origin: Coordinate, targetKm: number): Coordinate[] {
  const count = Math.random() < 0.5 ? 3 : 4;
  // Each step covers roughly equal share of total distance; +1 accounts for return leg
  const stepKm = (targetKm / (count + 1)) * (0.85 + Math.random() * 0.3);
  // Random initial direction
  let bearing = Math.random() * 360;
  let prev = origin;
  const waypoints: Coordinate[] = [];

  for (let i = 0; i < count; i++) {
    // Turn at most ±80° from the previous bearing to keep moving "forward"
    const turn = (Math.random() - 0.5) * 160;
    bearing = (bearing + turn + 360) % 360;
    prev = offsetCoordinate(prev, bearing, stepKm);
    waypoints.push(prev);
  }
  return waypoints;
}

// Calculates the bounding box (NE + SW corners) that contains all route coordinates.
// Used by MapDisplay to fit the camera to the full route after generation.
export function getBoundingBox(coordinates: Coordinate[]): {
  ne: [number, number];
  sw: [number, number];
} {
  const lats = coordinates.map((c) => c.latitude);
  const lngs = coordinates.map((c) => c.longitude);

  return {
    ne: [Math.max(...lngs), Math.max(...lats)],
    sw: [Math.min(...lngs), Math.min(...lats)],
  };
}

function hasUTurn(legs: any[]): boolean {
  for (const leg of legs) {
    for (const step of leg.steps ?? []) {
      const type = step.maneuver?.type;
      // depart/arrive steps have unreliable or missing bearing data — skip them
      if (type === 'depart' || type === 'arrive') continue;

      if (step.maneuver?.modifier === 'uturn') return true;

      const before: number | undefined = step.maneuver?.bearing_before;
      const after: number | undefined = step.maneuver?.bearing_after;
      if (before == null || after == null) continue;

      let diff = Math.abs(after - before);
      if (diff > 180) diff = 360 - diff;
      if (diff > 150) return true;
    }
  }
  return false;
}

async function fetchRawRoute(points: Coordinate[]): Promise<{ route: any; snappedWaypoints: Coordinate[] }> {
  const coords = points.map((c) => `${c.longitude},${c.latitude}`).join(';');
  const url = `${DIRECTIONS_URL}/${coords}?geometries=geojson&overview=full&steps=true&access_token=${MAPBOX_TOKEN}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error('Failed to fetch route from Mapbox.');
  const data = await response.json();
  const route = data.routes?.[0];
  if (!route) throw new Error('No route data returned.');
  // Exclude first (origin) and last (destination) — keep only intermediate waypoints
  const snappedWaypoints: Coordinate[] = (data.waypoints ?? [])
    .slice(1, -1)
    .map((wp: any) => ({ latitude: wp.location[1], longitude: wp.location[0] }));
  return { route, snappedWaypoints };
}

export async function fetchRandomRoute(origin: Coordinate, targetKm: number): Promise<RunRoute> {
  const MAX_ATTEMPTS = 3;
  let route: any = null;
  let usedWaypoints: Coordinate[] = [];

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    usedWaypoints = generateWaypoints(origin, targetKm);
    const result = await fetchRawRoute([origin, ...usedWaypoints, origin]);
    route = result.route;
    usedWaypoints = result.snappedWaypoints;
    if (!hasUTurn(route.legs ?? [])) break;
  }

  // Mapbox returns coordinates as [longitude, latitude]; we convert to { latitude, longitude }
  const coordinates: Coordinate[] = route.geometry.coordinates.map(
    ([longitude, latitude]: [number, number]) => ({ latitude, longitude })
  );

  const distanceKm = Math.round((route.distance / 1000) * 10) / 10;

  // Compute distanceFromStartM using Mapbox's own step distances — accurate and loop-safe.
  // Each step.distance is the distance from that step's maneuver point to the next step's maneuver point.
  const legs = route.legs ?? [];
  const steps: RouteStep[] = [];
  const streetNameSet = new Set<string>();
  let legStartM = 0;
  for (let legIdx = 0; legIdx < legs.length; legIdx++) {
    const leg = legs[legIdx];
    const isLastLeg = legIdx === legs.length - 1;
    let stepStartM = legStartM;
    for (const step of leg.steps ?? []) {
      const type = step?.maneuver?.type;
      const streetName: string | undefined = step?.name && step.name.trim() ? step.name.trim() : undefined;
      if (streetName) streetNameSet.add(streetName);
      if (type === 'depart') {
        stepStartM += step.distance ?? 0;
        continue;
      }
      const stepCoords: Coordinate[] = (step.geometry?.coordinates ?? []).map(
        ([longitude, latitude]: [number, number]) => ({ latitude, longitude })
      );
      if (type === 'arrive' && !isLastLeg) {
        steps.push({ instruction: 'Turn around and head back.', distanceFromStartM: Math.round(stepStartM), streetName, coordinates: stepCoords });
        stepStartM += step.distance ?? 0;
        continue;
      }
      steps.push({ instruction: step.maneuver.instruction, distanceFromStartM: Math.round(stepStartM), streetName, coordinates: stepCoords });
      stepStartM += step.distance ?? 0;
    }
    legStartM += leg.distance ?? 0;
  }

  return { coordinates, distanceKm, steps, streetNames: Array.from(streetNameSet), waypoints: usedWaypoints };
}

// Straight-line distance between two coordinates in km
export function haversineKm(a: Coordinate, b: Coordinate): number {
  const R = 6371;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.latitude)) * Math.cos(toRad(b.latitude)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.asin(Math.sqrt(x));
}

// Bearing from a to b in degrees (0 = north)
function bearingBetween(a: Coordinate, b: Coordinate): number {
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const y = Math.sin(dLon) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

// Generates waypoints that deviate perpendicularly from the direct path based on difficulty.
function generateDestinationWaypoints(origin: Coordinate, destination: Coordinate, difficulty: Difficulty): Coordinate[] {
  const directKm = haversineKm(origin, destination);
  const directBearing = bearingBetween(origin, destination);

  // Randomly pick left or right of the direct path — fixes the +180/-180 equivalence bug
  const perpSide = (directBearing + (Math.random() < 0.5 ? 90 : 270)) % 360;
  const oppSide = (perpSide + 180) % 360;

  // Add jitter so repeated generates produce different routes
  const jitter = () => (Math.random() - 0.5) * 0.3 * directKm;
  const distFactor = () => 0.85 + Math.random() * 0.3;

  const offsets: Record<Difficulty, number> = {
    easy:   directKm * 0.25,
    normal: directKm * 0.5,
    hard:   directKm * 0.8,
  };
  const offset = offsets[difficulty] * distFactor();

  if (difficulty === 'easy') {
    const mid = offsetCoordinate(origin, directBearing, directKm / 2 + jitter());
    return [offsetCoordinate(mid, perpSide, offset)];
  }
  if (difficulty === 'normal') {
    const third = directKm / 3;
    const p1 = offsetCoordinate(offsetCoordinate(origin, directBearing, third + jitter()), perpSide, offset);
    const p2 = offsetCoordinate(offsetCoordinate(origin, directBearing, third * 2 + jitter()), oppSide, offset * 0.6);
    return [p1, p2];
  }
  // hard: 3 waypoints, zigzag
  const quarter = directKm / 4;
  const p1 = offsetCoordinate(offsetCoordinate(origin, directBearing, quarter + jitter()), perpSide, offset);
  const p2 = offsetCoordinate(offsetCoordinate(origin, directBearing, quarter * 2 + jitter()), oppSide, offset);
  const p3 = offsetCoordinate(offsetCoordinate(origin, directBearing, quarter * 3 + jitter()), perpSide, offset * 0.5);
  return [p1, p2, p3];
}

export async function fetchDestinationRoute(
  origin: Coordinate,
  destination: Coordinate,
  difficulty: Difficulty
): Promise<RunRoute> {
  const MAX_ATTEMPTS = 3;
  let route: any = null;
  let usedWaypoints: Coordinate[] = [];

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    usedWaypoints = generateDestinationWaypoints(origin, destination, difficulty);
    const result = await fetchRawRoute([origin, ...usedWaypoints, destination]);
    route = result.route;
    usedWaypoints = result.snappedWaypoints;
    if (!hasUTurn(route.legs ?? [])) break;
  }

  const coordinates: Coordinate[] = route.geometry.coordinates.map(
    ([longitude, latitude]: [number, number]) => ({ latitude, longitude })
  );

  const distanceKm = Math.round((route.distance / 1000) * 10) / 10;

  const legs = route.legs ?? [];
  const steps: RouteStep[] = [];
  const streetNameSet = new Set<string>();
  let legStartM = 0;
  for (let legIdx = 0; legIdx < legs.length; legIdx++) {
    const leg = legs[legIdx];
    const isLastLeg = legIdx === legs.length - 1;
    let stepStartM = legStartM;
    for (const step of leg.steps ?? []) {
      const type = step?.maneuver?.type;
      const streetName: string | undefined = step?.name && step.name.trim() ? step.name.trim() : undefined;
      if (streetName) streetNameSet.add(streetName);
      const stepCoords: Coordinate[] = (step.geometry?.coordinates ?? []).map(
        ([longitude, latitude]: [number, number]) => ({ latitude, longitude })
      );
      if (type === 'depart') { stepStartM += step.distance ?? 0; continue; }
      if (type === 'arrive' && !isLastLeg) { stepStartM += step.distance ?? 0; continue; }
      steps.push({ instruction: step.maneuver.instruction, distanceFromStartM: Math.round(stepStartM), streetName, coordinates: stepCoords });
      stepStartM += step.distance ?? 0;
    }
    legStartM += leg.distance ?? 0;
  }

  return { coordinates, distanceKm, steps, streetNames: Array.from(streetNameSet), waypoints: usedWaypoints };
}
