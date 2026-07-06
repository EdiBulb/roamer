import { useState, useCallback } from 'react';
import { fetchRandomRoute, fetchRandomRouteTight, fetchDestinationRoute } from '../services/mapboxApi';
import { Area, Coordinate, Difficulty, RouteMode, RunRoute, RouteStatus, TargetDistance } from '../types';

interface UseRouteResult {
  route: RunRoute | null;
  status: RouteStatus;
  generate: () => void;
  generateTight: () => void;
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

  // Not memoized — always a fresh closure so origin/activeArea are never stale.
  // useCallback here caused stale captures when activeArea changed reference mid-session.
  const generate = async () => {
    if (!origin) return;
    if (mode === 'destination' && !destination) return;
    if (targetKm === 'free') return;

    setStatus('loading');
    setRoute(null);

    try {
      const result = mode === 'destination' && destination
        ? await fetchDestinationRoute(origin, destination, difficulty)
        : await fetchRandomRoute(origin, targetKm as number, activeArea);
      setRoute(result);
      setStatus('success');
    } catch {
      setStatus('error');
    }
  };

  // Called when user declines an over-distance route and wants a shorter one
  const generateTight = async () => {
    if (!origin) return;
    if (targetKm === 'free') return;

    setStatus('loading');
    setRoute(null);

    try {
      const result = await fetchRandomRouteTight(origin, targetKm as number, activeArea);
      setRoute(result);
      setStatus('success');
    } catch {
      setStatus('error');
    }
  };

  const clearRoute = useCallback(() => {
    setRoute(null);
    setStatus('idle');
  }, []);

  return { route, status, generate, generateTight, clearRoute };
}
