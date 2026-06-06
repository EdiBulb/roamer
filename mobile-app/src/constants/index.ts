import { TargetDistance, Coordinate } from '../types';

export const DISTANCE_OPTIONS: TargetDistance[] = [3, 5, 10];

// Public access token loaded from EXPO_PUBLIC_MAPBOX_TOKEN in .env (never commit the actual token)
export const MAPBOX_TOKEN = process.env.EXPO_PUBLIC_MAPBOX_TOKEN ?? '';

export const DEFAULT_ZOOM = 14;

// Set to true to use a fixed demo location instead of real GPS (e.g. for LinkedIn recordings)
export const DEMO_MODE = false;

export const DEMO_LOCATION: Coordinate = {
  latitude: -36.8485,
  longitude: 174.7633,
};
