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

    let sub: Location.LocationSubscription | null = null;

    async function startWatching() {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          if (!cancelled) setError('Location permission is required to use this app.');
          if (!cancelled) setLoading(false);
          return;
        }

        sub = await Location.watchPositionAsync(
          { accuracy: Location.Accuracy.High, timeInterval: 3000, distanceInterval: 5 },
          (pos) => {
            if (cancelled) return;
            setLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
            setLoading(false);
          },
        );
      } catch (e) {
        if (!cancelled) setError('Failed to get your location. Please try again.');
        if (!cancelled) setLoading(false);
      }
    }

    startWatching();

    return () => {
      cancelled = true;
      sub?.remove();
    };
  }, []);

  return { location, loading, error };
}
