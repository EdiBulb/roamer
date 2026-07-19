import { useState, useEffect } from 'react';
import * as Location from 'expo-location';
import { Coordinate } from '../types';
interface UseLocationResult {
  location: Coordinate | null;
  loading: boolean;
  error: string | null;
}

export function useLocation(): UseLocationResult {
  const [location, setLocation] = useState<Coordinate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // cancelled flag prevents setState calls after the component unmounts
    let cancelled = false;

    async function fetchLocation() {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();

        // 폰 위치 권한 거부 시 에러 메시지 표시
        if (status !== 'granted') {
          if (!cancelled) setError('Location permission is required to use this app.');
          return;
        }

        const result = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });

        if (!cancelled) {
          setLocation({
            latitude: result.coords.latitude,
            longitude: result.coords.longitude,
          });
        }
      } catch (e) {
        if (!cancelled) setError('Failed to get your location. Please try again.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchLocation();

    return () => {
      cancelled = true;
    };
  }, []);

  return { location, loading, error };
}
