import { TargetDistance } from '../types';

export const DISTANCE_OPTIONS: TargetDistance[] = [1, 3, 5, 10];

// Public access token loaded from EXPO_PUBLIC_MAPBOX_TOKEN in .env (never commit the actual token)
export const MAPBOX_TOKEN = process.env.EXPO_PUBLIC_MAPBOX_TOKEN ?? '';

export const DEFAULT_ZOOM = 14;

// Route classification colors
export const COLOR_NEW = '#FF6B6B';      // New territory (pink)
export const COLOR_OVERLAP = '#2E7D32';  // Revisited streets (dark green)
export const COLOR_OUTSIDE = '#42A5F5';  // Outside area boundary (blue)
export const COLOR_EXPLORED = '#A5D6A7'; // Previously explored streets (light green)
