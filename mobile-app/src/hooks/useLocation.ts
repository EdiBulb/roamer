import { useState, useEffect } from 'react';
import * as Location from 'expo-location';
import { Coordinate } from '../types';
import { DEMO_MODE, DEMO_LOCATION } from '../constants';

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
    if (DEMO_MODE) {
      setLocation(DEMO_LOCATION);
      setLoading(false);
      return;
    }

    // cancelled flag prevents setState calls after the component unmounts
    let cancelled = false;

    async function fetchLocation() {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();

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
