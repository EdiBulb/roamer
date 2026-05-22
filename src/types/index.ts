export type RouteMode = 'loop' | 'destination';
export type Difficulty = 'easy' | 'normal' | 'hard';
export type TargetDistance = 3 | 5 | 10;

export interface Coordinate {
  latitude: number;
  longitude: number;
}

export interface RouteStep {
  instruction: string;
  distanceFromStartM: number;
}

export interface RunRoute {
  coordinates: Coordinate[];
  distanceKm: number;
  steps: RouteStep[];
}

export type RouteStatus = 'idle' | 'loading' | 'success' | 'error';

export interface RunRecord {
  id: string;
  name: string;
  date: string;            // ISO timestamp
  distanceKm: number;
  elapsedSeconds: number;
  routeCoordinates: Coordinate[];
}
