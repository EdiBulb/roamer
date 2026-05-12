export type TargetDistance = 3 | 5 | 10;

export interface Coordinate {
  latitude: number;
  longitude: number;
}

export interface RunRoute {
  coordinates: Coordinate[];
  distanceKm: number;
}

export type RouteStatus = 'idle' | 'loading' | 'success' | 'error';
