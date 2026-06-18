import { useState, useCallback } from 'react';
import { fetchRandomRoute, fetchDestinationRoute } from '../services/mapboxApi';
import { Area, Coordinate, Difficulty, RouteMode, RunRoute, RouteStatus, TargetDistance } from '../types';

interface UseRouteResult {
  route: RunRoute | null;
  status: RouteStatus;
  generate: () => void;
  clearRoute: () => void;
}

export function useRoute(
  origin: Coordinate | null,
  targetKm: TargetDistance,
  mode: RouteMode,
  destination: Coordinate | null,
  difficulty: Difficulty,
  activeArea?: Area | null,
): UseRouteResult {
  const [route, setRoute] = useState<RunRoute | null>(null);
  const [status, setStatus] = useState<RouteStatus>('idle');

  const generate = useCallback(async () => {
    if (!origin) return;
    if (mode === 'destination' && !destination) return;
    if (targetKm === 'free') return;

    setStatus('loading');
    setRoute(null);

    try {
      const result = mode === 'destination' && destination
        ? await fetchDestinationRoute(origin, destination, difficulty)
        : await fetchRandomRoute(origin, targetKm, activeArea);
      setRoute(result);
      setStatus('success');
    } catch {
      setStatus('error');
    }
  }, [origin, targetKm, mode, destination, difficulty, activeArea]);

  const clearRoute = useCallback(() => {
    setRoute(null);
    setStatus('idle');
  }, []);

  return { route, status, generate, clearRoute };
}
