import AsyncStorage from '@react-native-async-storage/async-storage';

const STREETS_KEY = '@roamer/explored_streets';

export async function getExploredStreets(): Promise<string[]> {
  const raw = await AsyncStorage.getItem(STREETS_KEY);
  if (!raw) return [];
  return JSON.parse(raw) as string[];
}

export async function findNewStreets(currentStreets: string[]): Promise<string[]> {
  const explored = await getExploredStreets();
  const exploredSet = new Set(explored);
  return currentStreets.filter((s) => !exploredSet.has(s));
}

export async function saveNewStreets(newStreets: string[]): Promise<void> {
  if (newStreets.length === 0) return;
  const explored = await getExploredStreets();
  const merged = Array.from(new Set([...explored, ...newStreets]));
  await AsyncStorage.setItem(STREETS_KEY, JSON.stringify(merged));
}

export async function getTotalExploredCount(): Promise<number> {
  const explored = await getExploredStreets();
  return explored.length;
}
