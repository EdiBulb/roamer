export type RouteMode = 'loop' | 'destination';
export type Difficulty = 'easy' | 'normal' | 'hard';
export type TargetDistance = 1 | 3 | 5 | 10 | 'free';

export interface Coordinate {
  latitude: number;
  longitude: number;
}

export interface RouteStep {
  instruction: string;
  distanceFromStartM: number;
  streetName?: string;
  coordinates: Coordinate[];
  modifier?: string;
}

export interface RunRoute {
  coordinates: Coordinate[];
  distanceKm: number;
  steps: RouteStep[];
  streetNames: string[];
  waypoints: Coordinate[];
  distanceWarning?: { targetKm: number; actualKm: number };
}

export type RouteStatus = 'idle' | 'loading' | 'success' | 'error';

export interface RunRecord {
  id: string;
  name: string;
  date: string;
  distanceKm: number;
  elapsedSeconds: number;
  routeCoordinates: Coordinate[];
  newStreets: string[];
  newStreetSegments?: Coordinate[][];
  gpsTrace?: Coordinate[];
  areaId?: string;
  coloredSegmentIds?: string[];
  memo?: string;
}

export interface RoadSegment {
  id: string;
  coordinates: Coordinate[];
}

export interface Area {
  id: string;
  name: string;
  center: Coordinate;
  radiusKm: number;
  segments: RoadSegment[];
  coloredSegmentIds: string[];
  createdAt: string;
  conquered?: boolean;
}

export interface Badge {
  id: string;
  name: string;
  emoji: string;
  description: string;
  requiredStreets: number;
}
