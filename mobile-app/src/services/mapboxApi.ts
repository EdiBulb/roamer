import { MAPBOX_TOKEN } from '../constants';
import { Area, Coordinate, Difficulty, RouteStep, RoadSegment, RunRoute } from '../types';

const DIRECTIONS_URL = 'https://api.mapbox.com/directions/v5/mapbox/walking';

// ── math helpers ─────────────────────────────────────────────────────────────

function toRad(deg: number) { return (deg * Math.PI) / 180; }
function toDeg(rad: number) { return (rad * 180) / Math.PI; }

function offsetCoordinate(origin: Coordinate, bearing: number, distanceKm: number): Coordinate {
  const R = 6371;
  const d = distanceKm / R;
  const lat1 = toRad(origin.latitude);
  const lon1 = toRad(origin.longitude);
  const brng = toRad(bearing);
  const lat2 = Math.asin(Math.sin(lat1) * Math.cos(d) + Math.cos(lat1) * Math.sin(d) * Math.cos(brng));
  const lon2 = lon1 + Math.atan2(Math.sin(brng) * Math.sin(d) * Math.cos(lat1), Math.cos(d) - Math.sin(lat1) * Math.sin(lat2));
  return { latitude: toDeg(lat2), longitude: toDeg(lon2) };
}

function haversineKmInternal(a: Coordinate, b: Coordinate): number {
  const R = 6371;
  const dLat = ((b.latitude - a.latitude) * Math.PI) / 180;
  const dLon = ((b.longitude - a.longitude) * Math.PI) / 180;
  const lat1 = (a.latitude * Math.PI) / 180;
  const lat2 = (b.latitude * Math.PI) / 180;
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.asin(Math.sqrt(x));
}

export function haversineKm(a: Coordinate, b: Coordinate): number {
  return haversineKmInternal(a, b);
}

function bearingBetween(a: Coordinate, b: Coordinate): number {
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const y = Math.sin(dLon) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
  return ((Math.atan2(y, x) * 180 / Math.PI) + 360) % 360;
}

export function getBoundingBox(coordinates: Coordinate[]): { ne: [number, number]; sw: [number, number] } {
  const lats = coordinates.map((c) => c.latitude);
  const lngs = coordinates.map((c) => c.longitude);
  return { ne: [Math.max(...lngs), Math.max(...lats)], sw: [Math.min(...lngs), Math.min(...lats)] };
}

// ── Mapbox API ────────────────────────────────────────────────────────────────

async function fetchRawRoute(points: Coordinate[]): Promise<{ route: any; snappedWaypoints: Coordinate[] }> {
  const coords = points.map((c) => `${c.longitude},${c.latitude}`).join(';');
  const url = `${DIRECTIONS_URL}/${coords}?geometries=geojson&overview=full&steps=true&exclude=ferry&continue_straight=true&language=ko&access_token=${MAPBOX_TOKEN}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error('Failed to fetch route from Mapbox.');
  const data = await response.json();
  const route = data.routes?.[0];
  if (!route) throw new Error('No route data returned.');
  const snappedWaypoints: Coordinate[] = (data.waypoints ?? [])
    .slice(1, -1)
    .map((wp: any) => ({ latitude: wp.location[1], longitude: wp.location[0] }));
  return { route, snappedWaypoints };
}

function hasUTurn(legs: any[]): boolean {
  for (const leg of legs) {
    for (const step of leg.steps ?? []) {
      const type = step.maneuver?.type;
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

// ── [C] Distance-scaled waypoint count ───────────────────────────────────────

function waypointCount(targetKm: number): number {
  if (targetKm <= 3) return Math.random() < 0.5 ? 2 : 3;
  if (targetKm <= 6) return Math.random() < 0.5 ? 3 : 4;
  if (targetKm <= 8) return Math.random() < 0.5 ? 4 : 5;
  return Math.random() < 0.5 ? 5 : 6;
}

// ── [B] Nearest-neighbor with minimum spacing ────────────────────────────────
// minSpacing prevents all waypoints from clustering in one small area

function nearestNeighborOrder(
  candidates: Coordinate[],
  origin: Coordinate,
  count: number,
  minSpacingKm: number,
): Coordinate[] {
  const pool = [...candidates];
  const result: Coordinate[] = [];
  let cursor = origin;

  for (let i = 0; i < count && pool.length > 0; i++) {
    // Prefer candidates that are far enough from already-picked points
    let bestIdx = -1;
    let bestDist = Infinity;
    for (let j = 0; j < pool.length; j++) {
      const d = haversineKmInternal(cursor, pool[j]);
      const tooClose = result.some((r) => haversineKmInternal(r, pool[j]) < minSpacingKm);
      if (!tooClose && d < bestDist) { bestDist = d; bestIdx = j; }
    }
    // Fallback: if all candidates are too close, just pick nearest
    if (bestIdx === -1) {
      for (let j = 0; j < pool.length; j++) {
        const d = haversineKmInternal(cursor, pool[j]);
        if (d < bestDist) { bestDist = d; bestIdx = j; }
      }
    }
    if (bestIdx === -1) break;
    result.push(pool[bestIdx]);
    cursor = pool[bestIdx];
    pool.splice(bestIdx, 1);
  }
  return result;
}

// ── Waypoint generators ───────────────────────────────────────────────────────

// [ARC] Arc-based waypoint placement.
// Waypoints are placed within a ~160° arc instead of full 360°.
// This forces a proper loop shape (go one way, return another) rather than
// a cloverleaf/star pattern where waypoints scatter all around origin.
function generateWaypoints(origin: Coordinate, targetKm: number, scaleFactor = 0.65): Coordinate[] {
  const count = waypointCount(targetKm);
  const radius = (targetKm / count) * scaleFactor;
  const arcCenter = Math.random() * 360;
  const arcSpan = 160;
  const startAngle = arcCenter - arcSpan / 2;
  const angleStep = count > 1 ? arcSpan / (count - 1) : 0;
  return Array.from({ length: count }, (_, i) => {
    const jitter = (Math.random() - 0.5) * Math.max(angleStep, 30) * 0.25;
    const angle = (startAngle + i * angleStep + jitter + 360) % 360;
    const r = radius * (0.8 + Math.random() * 0.4);
    return offsetCoordinate(origin, angle, r);
  });
}

// [B][C] Nearest-neighbor ordered with minimum spacing; expanded reach radius
function generateExplorationWaypoints(
  origin: Coordinate,
  targetKm: number,
  uncoloredSegments: RoadSegment[],
  scaleFactor = 0.65,
): Coordinate[] {
  const maxReachKm = targetKm * 0.75;
  const allCandidates: Coordinate[] = [];
  for (const seg of uncoloredSegments) {
    const mid = seg.coordinates[Math.floor(seg.coordinates.length / 2)];
    if (haversineKmInternal(origin, mid) <= maxReachKm) allCandidates.push(mid);
  }
  if (allCandidates.length < 2) return generateWaypoints(origin, targetKm, scaleFactor);

  const count = waypointCount(targetKm);
  const minSpacing = (targetKm / (count + 1)) * 0.4;

  // Random shuffle first — nearestNeighborOrder is deterministic (always picks
  // nearest to origin = same result every time), so we must randomise SELECTION,
  // then use nearest-neighbor only for path ordering.
  const shuffled = allCandidates.slice().sort(() => Math.random() - 0.5);
  const selected: Coordinate[] = [];
  for (const wp of shuffled) {
    if (selected.length >= count) break;
    const tooClose = selected.some((s) => haversineKmInternal(s, wp) < minSpacing);
    if (!tooClose) selected.push(wp);
  }
  // Fallback: fill remaining slots ignoring spacing constraint
  for (const wp of shuffled) {
    if (selected.length >= count) break;
    if (!selected.includes(wp)) selected.push(wp);
  }

  // Re-order selected waypoints into an efficient traversal path
  return nearestNeighborOrder(selected, origin, count, 0);
}

// ── [D] Route scoring ─────────────────────────────────────────────────────────

// Measures what fraction of the route covers unique ~33m grid cells.
// A back-and-forth route re-visits cells → low score. A proper loop → high score.
function uniqueRatioScore(route: any): number {
  const coords: [number, number][] = route.geometry?.coordinates ?? [];
  if (coords.length < 4) return 0.5;
  const CELL = 0.0003; // ~33m per cell
  const visited = new Map<string, number>();
  for (let i = 0; i < coords.length; i += 6) {
    const [lng, lat] = coords[i];
    const key = `${Math.round(lat / CELL)},${Math.round(lng / CELL)}`;
    visited.set(key, (visited.get(key) ?? 0) + 1);
  }
  let unique = 0;
  for (const count of visited.values()) if (count === 1) unique++;
  return unique / Math.max(visited.size, 1);
}

function scoreRoute(route: any, targetKm: number, uncoloredSegments: RoadSegment[]): number {
  const actualKm = route.distance / 1000;

  const distanceAccuracy = 1 - Math.min(Math.abs(actualKm - targetKm) / targetKm, 1);

  // Penalise routes that re-trace the same streets (back-and-forth penalty)
  const uniqueRatio = uniqueRatioScore(route);

  const streetNames = new Set<string>();
  for (const leg of route.legs ?? []) {
    for (const step of leg.steps ?? []) {
      if (step.name?.trim()) streetNames.add(step.name.trim());
    }
  }
  const streetVariety = Math.min(streetNames.size / 8, 1);

  let explorationScore = 0.5;
  if (uncoloredSegments.length > 0) {
    const routeCoords: Coordinate[] = (route.geometry?.coordinates ?? [])
      .filter((_: any, i: number) => i % 8 === 0)
      .map(([lng, lat]: [number, number]) => ({ longitude: lng, latitude: lat }));
    let covered = 0;
    for (const seg of uncoloredSegments) {
      const mid = seg.coordinates[Math.floor(seg.coordinates.length / 2)];
      if (routeCoords.some((c) => haversineKmInternal(c, mid) < 0.08)) covered++;
    }
    explorationScore = covered / uncoloredSegments.length;
  }

  return distanceAccuracy * 0.40 + uniqueRatio * 0.30 + explorationScore * 0.20 + streetVariety * 0.10;
}

// ── [A] Single candidate with distance feedback loop ─────────────────────────

async function fetchRouteCandidateLoop(
  origin: Coordinate,
  targetKm: number,
  uncoloredSegments: RoadSegment[],
  tightMode = false,
): Promise<{ route: any; waypoints: Coordinate[] } | null> {
  // tightMode: prioritise hitting distance target over quality (U-turns allowed)
  // Used when user declines an over-distance route and wants a shorter one instead.
  let scaleFactor = tightMode ? 0.44 : 0.65;
  const MAX_ATTEMPTS = 6;
  let bestResult: { route: any; waypoints: Coordinate[] } | null = null;
  let bestScore = -Infinity;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const waypoints = tightMode
      ? generateWaypoints(origin, targetKm, scaleFactor)
      : (uncoloredSegments.length >= 2
        ? generateExplorationWaypoints(origin, targetKm, uncoloredSegments, scaleFactor)
        : generateWaypoints(origin, targetKm, scaleFactor));

    try {
      const result = await fetchRawRoute([origin, ...waypoints, origin]);
      const route = result.route;
      const actualKm = route.distance / 1000;
      const distErr = Math.abs(actualKm - targetKm) / targetKm;

      const snappedWaypoints = result.snappedWaypoints;

      // Always update bestResult so we have a fallback even if quality checks fail
      const score = scoreRoute(route, targetKm, uncoloredSegments);
      if (score > bestScore) { bestScore = score; bestResult = { route, waypoints: snappedWaypoints }; }

      // Skip early-return path if any waypoint snapped >300m from intended (off-road placement)
      const badSnap = waypoints.some((wp: Coordinate, i: number) =>
        snappedWaypoints[i] && haversineKmInternal(snappedWaypoints[i], wp) > 0.30,
      );
      if (badSnap) continue;

      if (distErr > (tightMode ? 0.15 : 0.25)) {
        scaleFactor = Math.min(
          Math.max(scaleFactor * (targetKm / actualKm), 0.25),
          tightMode ? 0.60 : 0.90,
        );
        continue;
      }

      // In tight mode skip U-turn check — distance accuracy matters more than quality
      if (!tightMode && hasUTurn(route.legs ?? [])) continue;

      return { route, waypoints: snappedWaypoints };
    } catch {
      continue;
    }
  }

  return bestResult;
}

// ── Shared route parser ───────────────────────────────────────────────────────

function parseRouteToRunRoute(route: any, usedWaypoints: Coordinate[]): RunRoute {
  const coordinates: Coordinate[] = route.geometry.coordinates.map(
    ([longitude, latitude]: [number, number]) => ({ latitude, longitude }),
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
      const streetName: string | undefined = step?.name?.trim() || undefined;
      if (streetName) streetNameSet.add(streetName);
      if (type === 'depart') { stepStartM += step.distance ?? 0; continue; }
      const stepCoords: Coordinate[] = (step.geometry?.coordinates ?? []).map(
        ([longitude, latitude]: [number, number]) => ({ latitude, longitude }),
      );
      if (type === 'arrive' && !isLastLeg) {
        steps.push({ instruction: '방향을 바꿔 되돌아가세요.', distanceFromStartM: Math.round(stepStartM), streetName, coordinates: stepCoords, modifier: 'uturn' });
        stepStartM += step.distance ?? 0;
        continue;
      }
      steps.push({ instruction: step.maneuver.instruction, distanceFromStartM: Math.round(stepStartM), streetName, coordinates: stepCoords, modifier: step.maneuver?.modifier });
      stepStartM += step.distance ?? 0;
    }
    legStartM += leg.distance ?? 0;
  }

  return { coordinates, distanceKm, steps, streetNames: Array.from(streetNameSet), waypoints: usedWaypoints };
}

// ── Public API ────────────────────────────────────────────────────────────────

// Generates 3 candidates in parallel, picks the best-scoring route.
// Sets distanceWarning if the result is >30% longer than target.
export async function fetchRandomRoute(origin: Coordinate, targetKm: number, activeArea?: Area | null): Promise<RunRoute> {
  const uncoloredSegments = activeArea
    ? activeArea.segments.filter((s) => !activeArea.coloredSegmentIds.includes(s.id))
    : [];

  const [candidateA, candidateB, candidateC] = await Promise.all([
    fetchRouteCandidateLoop(origin, targetKm, uncoloredSegments),
    fetchRouteCandidateLoop(origin, targetKm, uncoloredSegments),
    fetchRouteCandidateLoop(origin, targetKm, uncoloredSegments),
  ]);

  const valid = [candidateA, candidateB, candidateC].filter(Boolean) as { route: any; waypoints: Coordinate[] }[];
  if (valid.length === 0) throw new Error('Failed to generate a valid route. Please try again.');

  const best = valid.reduce((a, b) =>
    scoreRoute(a.route, targetKm, uncoloredSegments) >= scoreRoute(b.route, targetKm, uncoloredSegments) ? a : b,
  );

  const route = parseRouteToRunRoute(best.route, best.waypoints);

  // Warn user when terrain forces route significantly over target distance
  if (route.distanceKm > targetKm * 1.30) {
    route.distanceWarning = { targetKm, actualKm: route.distanceKm };
  }

  return route;
}

// Tight mode: called when user declines an over-distance route.
// Prioritises hitting the target distance over route quality.
export async function fetchRandomRouteTight(origin: Coordinate, targetKm: number, activeArea?: Area | null): Promise<RunRoute> {
  const uncoloredSegments = activeArea
    ? activeArea.segments.filter((s) => !activeArea.coloredSegmentIds.includes(s.id))
    : [];

  const [candidateA, candidateB] = await Promise.all([
    fetchRouteCandidateLoop(origin, targetKm, uncoloredSegments, true),
    fetchRouteCandidateLoop(origin, targetKm, uncoloredSegments, true),
  ]);

  const valid = [candidateA, candidateB].filter(Boolean) as { route: any; waypoints: Coordinate[] }[];
  if (valid.length === 0) throw new Error('Failed to generate a route. Please try again.');

  const best = valid.reduce((a, b) =>
    scoreRoute(a.route, targetKm, uncoloredSegments) >= scoreRoute(b.route, targetKm, uncoloredSegments) ? a : b,
  );

  // No distanceWarning here — avoid infinite decline loop
  return parseRouteToRunRoute(best.route, best.waypoints);
}

// ── Destination route (unchanged logic, uses shared parser) ───────────────────

function generateDestinationWaypoints(origin: Coordinate, destination: Coordinate, difficulty: Difficulty): Coordinate[] {
  const directKm = haversineKm(origin, destination);
  const directBearing = bearingBetween(origin, destination);
  const perpSide = (directBearing + (Math.random() < 0.5 ? 90 : 270)) % 360;
  const oppSide = (perpSide + 180) % 360;
  const jitter = () => (Math.random() - 0.5) * 0.3 * directKm;
  const distFactor = () => 0.85 + Math.random() * 0.3;
  const offsets: Record<Difficulty, number> = { easy: directKm * 0.25, normal: directKm * 0.5, hard: directKm * 0.8 };
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
  const quarter = directKm / 4;
  const p1 = offsetCoordinate(offsetCoordinate(origin, directBearing, quarter + jitter()), perpSide, offset);
  const p2 = offsetCoordinate(offsetCoordinate(origin, directBearing, quarter * 2 + jitter()), oppSide, offset);
  const p3 = offsetCoordinate(offsetCoordinate(origin, directBearing, quarter * 3 + jitter()), perpSide, offset * 0.5);
  return [p1, p2, p3];
}

export async function fetchDestinationRoute(origin: Coordinate, destination: Coordinate, difficulty: Difficulty): Promise<RunRoute> {
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

  return parseRouteToRunRoute(route, usedWaypoints);
}
