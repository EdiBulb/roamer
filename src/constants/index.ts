import { TargetDistance } from '../types';

export const DISTANCE_OPTIONS: TargetDistance[] = [3, 5, 10];

// Public access token loaded from EXPO_PUBLIC_MAPBOX_TOKEN in .env (never commit the actual token)
export const MAPBOX_TOKEN = process.env.EXPO_PUBLIC_MAPBOX_TOKEN ?? '';

export const DEFAULT_ZOOM = 14;
