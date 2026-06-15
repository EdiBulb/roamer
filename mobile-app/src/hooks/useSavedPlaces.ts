import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Coordinate } from '../types';

const STORAGE_KEY = 'saved_places';

export interface SavedPlace {
  label: string;
  coord: Coordinate;
}

export function useSavedPlaces() {
  const [places, setPlaces] = useState<SavedPlace[]>([]);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (raw) setPlaces(JSON.parse(raw));
    });
  }, []);

  async function persist(updated: SavedPlace[]) {
    setPlaces(updated);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }

  const add = useCallback(async (label: string, coord: Coordinate) => {
    setPlaces((prev) => {
      const filtered = prev.filter((p) => p.label.toLowerCase() !== label.toLowerCase());
      const updated = [...filtered, { label, coord }];
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const remove = useCallback(async (label: string) => {
    setPlaces((prev) => {
      const updated = prev.filter((p) => p.label.toLowerCase() !== label.toLowerCase());
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  return { places, add, remove };
}
