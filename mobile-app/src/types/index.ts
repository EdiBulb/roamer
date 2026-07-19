export type RouteMode = 'loop' | 'destination';
export type Difficulty = 'easy' | 'normal' | 'hard';
export type TargetDistance = 1 | 3 | 5 | 10 | 'free';

export interface Coordinate {
  latitude: number; // 위도(남북)
  longitude: number; // 경도(동서)
}

export interface RouteStep {
  instruction: string; // 이동 지시사항
  distanceFromStartM: number; // 시작점으로부터의 거리(m)
  streetName?: string; // 도로 이름
  coordinates: Coordinate[];
  modifier?: string; // left, right, straight, u-turn, etc.
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

// 완주한 런 기록
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
  polygon?: Coordinate[];
  segments: RoadSegment[]; // Area 내의 모든 도로 구간
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
