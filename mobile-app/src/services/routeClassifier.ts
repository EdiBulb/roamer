import { Coordinate, RoadSegment } from '../types';

const OVERLAP_THRESHOLD_KM = 0.035; // 35 meters

export interface RouteClassification {
  overlapLines: Coordinate[][];
  newLines: Coordinate[][];
  outsideLines: Coordinate[][];
}

// Point-to-line-segment distance (planar approximation, valid for small distances)
function distanceToSegmentKm(pt: Coordinate, a: Coordinate, b: Coordinate): number {
  const R = 6371;
  const lat0 = ((a.latitude + b.latitude) / 2) * Math.PI / 180;
  const px = (pt.longitude - a.longitude) * Math.PI / 180 * R * Math.cos(lat0);
  const py = (pt.latitude - a.latitude) * Math.PI / 180 * R;
  const bx = (b.longitude - a.longitude) * Math.PI / 180 * R * Math.cos(lat0);
  const by = (b.latitude - a.latitude) * Math.PI / 180 * R;
  const lenSq = bx * bx + by * by;
  if (lenSq === 0) return Math.sqrt(px * px + py * py);
  const t = Math.max(0, Math.min(1, (px * bx + py * by) / lenSq));
  const dx = px - t * bx;
  const dy = py - t * by;
  return Math.sqrt(dx * dx + dy * dy);
}

function isNearExplored(pt: Coordinate, exploredSegments: RoadSegment[]): boolean {
  return exploredSegments.some(seg => {
    for (let i = 0; i < seg.coordinates.length - 1; i++) {
      if (distanceToSegmentKm(pt, seg.coordinates[i], seg.coordinates[i + 1]) < OVERLAP_THRESHOLD_KM) {
        return true;
      }
    }
    return false;
  });
}

function haversineKm(a: Coordinate, b: Coordinate): number {
  const R = 6371;
  const dLat = ((b.latitude - a.latitude) * Math.PI) / 180;
  const dLon = ((b.longitude - a.longitude) * Math.PI) / 180;
  const lat1 = (a.latitude * Math.PI) / 180;
  const lat2 = (b.latitude * Math.PI) / 180;
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.asin(Math.sqrt(x));
}

export function classifyRouteCoordinates(
  routeCoords: Coordinate[],
  exploredSegments: RoadSegment[],
  areaCenter?: Coordinate,
  areaRadiusKm?: number,
): RouteClassification {
  if (routeCoords.length === 0) return { overlapLines: [], newLines: [], outsideLines: [] };
  if (exploredSegments.length === 0 && !areaCenter) {
    return { overlapLines: [], newLines: [routeCoords], outsideLines: [] };
  }

  type Tag = 'overlap' | 'new' | 'outside';
  const rawTags: Tag[] = routeCoords.map(pt => {
    if (areaCenter && areaRadiusKm !== undefined && haversineKm(pt, areaCenter) > areaRadiusKm) {
      return 'outside';
    }
    return isNearExplored(pt, exploredSegments) ? 'overlap' : 'new';
  });

  // Smooth out short 'new' gaps (≤3 points) flanked by 'overlap' on both sides
  const tags = [...rawTags];
  const SMOOTH_SPAN = 5;
  for (let i = 1; i < tags.length - 1; i++) {
    if (tags[i] !== 'new') continue;
    let end = i;
    while (end < tags.length && tags[end] === 'new') end++;
    const spanLen = end - i;
    if (spanLen <= SMOOTH_SPAN && tags[i - 1] === 'overlap' && tags[end] === 'overlap') {
      for (let k = i; k < end; k++) tags[k] = 'overlap';
    }
  }

  const overlapLines: Coordinate[][] = [];
  const newLines: Coordinate[][] = [];
  const outsideLines: Coordinate[][] = [];

  let i = 0;
  while (i < routeCoords.length) {
    const tag = tags[i];
    const line: Coordinate[] = [routeCoords[i]];
    let j = i + 1;
    while (j < routeCoords.length && tags[j] === tag) {
      line.push(routeCoords[j]);
      j++;
    }
    // Include one boundary point from the next segment so lines connect
    if (j < routeCoords.length) line.push(routeCoords[j]);

    if (tag === 'overlap') overlapLines.push(line);
    else if (tag === 'new') newLines.push(line);
    else outsideLines.push(line);
    i = j;
  }

  return { overlapLines, newLines, outsideLines };
}
