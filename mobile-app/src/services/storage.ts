import AsyncStorage from '@react-native-async-storage/async-storage';
import { RunRecord } from '../types';

const HISTORY_KEY = '@randomrun/history';

export async function loadRunHistory(): Promise<RunRecord[]> {
  const raw = await AsyncStorage.getItem(HISTORY_KEY);
  if (!raw) return [];
  return JSON.parse(raw) as RunRecord[];
}

export async function saveRunRecord(record: RunRecord): Promise<void> {
  const existing = await loadRunHistory();
  const updated = [record, ...existing];
  await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
}

export async function deleteRunRecord(id: string): Promise<void> {
  const existing = await loadRunHistory();
  const updated = existing.filter((r) => r.id !== id);
  await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
}

export async function updateRunRecord(id: string, name: string): Promise<void> {
  const existing = await loadRunHistory();
  const updated = existing.map((r) => r.id === id ? { ...r, name } : r);
  await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
}
