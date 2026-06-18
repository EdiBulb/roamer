import AsyncStorage from '@react-native-async-storage/async-storage';
import { Area } from '../types';

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

export async function deleteArea(id: string): Promise<void> {
  const existing = await loadAreas();
  await AsyncStorage.setItem(AREAS_KEY, JSON.stringify(existing.filter((a) => a.id !== id)));
}
