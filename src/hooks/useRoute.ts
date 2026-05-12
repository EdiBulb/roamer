import { useState, useCallback } from 'react';
import { fetchRandomRoute } from '../services/mapboxApi';
import { Coordinate, RunRoute, RouteStatus, TargetDistance } from '../types';

interface UseRouteResult {
  route: RunRoute | null;
  status: RouteStatus;
  generate: () => void;
}

export function useRoute(origin: Coordinate | null, targetKm: TargetDistance): UseRouteResult {
  const [route, setRoute] = useState<RunRoute | null>(null);
  const [status, setStatus] = useState<RouteStatus>('idle');

  const generate = useCallback(async () => {
    if (!origin) return; // 위치 없으면 실행 안함

    setStatus('loading');
    setRoute(null);

    try {
      const result = await fetchRandomRoute(origin, targetKm);
      setRoute(result);
      setStatus('success');
    } catch {
      setStatus('error');
    }
  }, [origin, targetKm]);

  return { route, status, generate };
}
