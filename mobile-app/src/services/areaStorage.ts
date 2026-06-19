import AsyncStorage from '@react-native-async-storage/async-storage';
import { Area } from '../types';
import { loadRunHistory } from './storage';

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

export async function recalculateAreaColoredSegments(areaId: string): Promise<void> {
  const [allAreas, allHistory] = await Promise.all([loadAreas(), loadRunHistory()]);
  const area = allAreas.find((a) => a.id === areaId);
  if (!area) return;

  const areaRuns = allHistory.filter((r) => r.areaId === areaId);
  console.log(`[Recalc] area: ${areaId}, remaining runs: ${areaRuns.length}`);
  const allColoredIds = new Set<string>();
  for (const run of areaRuns) {
    (run.coloredSegmentIds ?? []).forEach((id) => allColoredIds.add(id));
  }
  console.log(`[Recalc] final colored: ${allColoredIds.size}`);

  const updated = allAreas.map((a) =>
    a.id === areaId ? { ...a, coloredSegmentIds: Array.from(allColoredIds) } : a,
  );
  await AsyncStorage.setItem(AREAS_KEY, JSON.stringify(updated));
}
