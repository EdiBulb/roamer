import AsyncStorage from '@react-native-async-storage/async-storage';
import { Area, Coordinate } from '../types';
import { loadRunHistory, patchRunRecord } from './storage';
import { fetchSegmentsInPolygon, matchTraceToSegments } from './overpassApi';

function haversineKm(a: Coordinate, b: Coordinate): number {
  const R = 6371;
  const dLat = ((b.latitude - a.latitude) * Math.PI) / 180;
  const dLon = ((b.longitude - a.longitude) * Math.PI) / 180;
  const lat1 = (a.latitude * Math.PI) / 180;
  const lat2 = (b.latitude * Math.PI) / 180;
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.asin(Math.sqrt(x));
}

function cross2D(o: Coordinate, a: Coordinate, b: Coordinate): number {
  return (a.longitude - o.longitude) * (b.latitude - o.latitude) -
         (a.latitude - o.latitude) * (b.longitude - o.longitude);
}

function convexHull(points: Coordinate[]): Coordinate[] {
  if (points.length < 3) return [...points];
  const sorted = [...points].sort((a, b) =>
    a.longitude !== b.longitude ? a.longitude - b.longitude : a.latitude - b.latitude,
  );
  const lower: Coordinate[] = [];
  for (const p of sorted) {
    while (lower.length >= 2 && cross2D(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) lower.pop();
    lower.push(p);
  }
  const upper: Coordinate[] = [];
  for (let i = sorted.length - 1; i >= 0; i--) {
    const p = sorted[i];
    while (upper.length >= 2 && cross2D(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) upper.pop();
    upper.push(p);
  }
  lower.pop();
  upper.pop();
  return [...lower, ...upper];
}

export function areAreasAdjacent(a: Area, b: Area, thresholdKm = 0.3): boolean {
  const aVerts = a.polygon ?? [a.center];
  const bVerts = b.polygon ?? [b.center];
  for (const pa of aVerts) {
    for (const pb of bVerts) {
      if (haversineKm(pa, pb) <= thresholdKm) return true;
    }
  }
  return false;
}

export async function mergeAreas(areaA: Area, areaB: Area, newName: string): Promise<Area> {
  const allVertices = [...(areaA.polygon ?? [areaA.center]), ...(areaB.polygon ?? [areaB.center])];
  const hullPolygon = convexHull(allVertices);

  const newSegments = await fetchSegmentsInPolygon(hullPolygon);

  const allRuns = await loadRunHistory();
  const relevantRuns = allRuns.filter(r => r.areaId === areaA.id || r.areaId === areaB.id);

  const newColoredIds = new Set<string>();
  for (const run of relevantRuns) {
    if (run.gpsTrace && run.gpsTrace.length >= 2) {
      matchTraceToSegments(run.gpsTrace, newSegments).forEach(id => newColoredIds.add(id));
    }
  }

  const centerLat = hullPolygon.reduce((s, c) => s + c.latitude, 0) / hullPolygon.length;
  const centerLng = hullPolygon.reduce((s, c) => s + c.longitude, 0) / hullPolygon.length;
  const center: Coordinate = { latitude: centerLat, longitude: centerLng };
  const radiusKm = Math.max(...hullPolygon.map(p => haversineKm(center, p)));

  const newArea: Area = {
    id: String(Date.now()),
    name: newName,
    center,
    radiusKm: Math.round(radiusKm * 10) / 10,
    polygon: hullPolygon,
    segments: newSegments,
    coloredSegmentIds: Array.from(newColoredIds),
    createdAt: new Date().toISOString(),
    conquered: newSegments.length > 0 && newColoredIds.size >= newSegments.length * 0.8,
  };

  for (const run of relevantRuns) {
    const runColored = run.gpsTrace && run.gpsTrace.length >= 2
      ? matchTraceToSegments(run.gpsTrace, newSegments)
      : [];
    await patchRunRecord(run.id, { areaId: newArea.id, coloredSegmentIds: runColored });
  }

  await deleteArea(areaA.id);
  await deleteArea(areaB.id);
  await saveArea(newArea);

  return newArea;
}

const AREAS_KEY = '@randomrun/areas';

export async function loadAreas(): Promise<Area[]> {
  const raw = await AsyncStorage.getItem(AREAS_KEY);
  if (!raw) return [];
  return JSON.parse(raw) as Area[];
}

export async function saveArea(area: Area): Promise<void> {
  const existing = await loadAreas();
  const updated = [area, ...existing.filter((a) => a.id !== area.id)];
  await AsyncStorage.setItem(AREAS_KEY, JSON.stringify(updated));
}

export async function updateAreaColoredSegments(
  areaId: string,
  newColoredIds: string[],
): Promise<void> {
  const existing = await loadAreas();
  const updated = existing.map((a) => {
    if (a.id !== areaId) return a;
    const merged = Array.from(new Set([...a.coloredSegmentIds, ...newColoredIds]));
    return { ...a, coloredSegmentIds: merged };
  });
  await AsyncStorage.setItem(AREAS_KEY, JSON.stringify(updated));
}

export async function renameArea(id: string, newName: string): Promise<void> {
  const existing = await loadAreas();
  const updated = existing.map((a) => a.id === id ? { ...a, name: newName } : a);
  await AsyncStorage.setItem(AREAS_KEY, JSON.stringify(updated));
}

export async function deleteArea(id: string): Promise<void> {
  const existing = await loadAreas();
  await AsyncStorage.setItem(AREAS_KEY, JSON.stringify(existing.filter((a) => a.id !== id)));
}

export async function setAreaConquered(areaId: string): Promise<void> {
  const existing = await loadAreas();
  const updated = existing.map((a) => a.id === areaId ? { ...a, conquered: true } : a);
  await AsyncStorage.setItem(AREAS_KEY, JSON.stringify(updated));
}

export async function getTotalColoredSegmentCount(): Promise<number> {
  const areas = await loadAreas();
  const allIds = new Set<string>();
  for (const area of areas) {
    for (const id of area.coloredSegmentIds) {
      allIds.add(id);
    }
  }
  return allIds.size;
}

export async function recalculateAreaColoredSegments(areaId: string): Promise<void> {
  const [allAreas, allHistory] = await Promise.all([loadAreas(), loadRunHistory()]);
  const area = allAreas.find((a) => a.id === areaId);
  if (!area) return;

  const areaRuns = allHistory.filter((r) => r.areaId === areaId);
  const allColoredIds = new Set<string>();
  for (const run of areaRuns) {
    (run.coloredSegmentIds ?? []).forEach((id) => allColoredIds.add(id));
  }

  const updated = allAreas.map((a) =>
    a.id === areaId ? { ...a, coloredSegmentIds: Array.from(allColoredIds) } : a,
  );
  await AsyncStorage.setItem(AREAS_KEY, JSON.stringify(updated));
}
