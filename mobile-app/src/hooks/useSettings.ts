import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'app_settings';

export type VoiceFrequency = 'minimal' | 'normal' | 'chatty';
export type AnnounceDistance = 30 | 50 | 100;
export type Units = 'km' | 'miles';

export interface AppSettings {
  voiceEnabled: boolean;
  voiceFrequency: VoiceFrequency;
  announceDistanceM: AnnounceDistance;
  units: Units;
}

export const DEFAULT_SETTINGS: AppSettings = {
  voiceEnabled: true,
  voiceFrequency: 'normal',
  announceDistanceM: 50,
  units: 'km',
};

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (raw) setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(raw) });
    });
  }, []);

  const update = useCallback(async (patch: Partial<AppSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  return { settings, update };
}
