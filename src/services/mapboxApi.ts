import { MAPBOX_TOKEN } from '../constants';
import { Coordinate, RunRoute } from '../types';

const DIRECTIONS_URL = 'https://api.mapbox.com/directions/v5/mapbox/walking';

function toRad(deg: number) {
  return (deg * Math.PI) / 180;
}

function toDeg(rad: number) {
  return (rad * 180) / Math.PI;
}

// Returns the coordinate reached by travelling distanceKm from origin in the given bearing direction.
// Uses spherical trigonometry because the Earth is a sphere, not a flat plane.
function offsetCoordinate(origin: Coordinate, bearing: number, distanceKm: number): Coordinate {
  const R = 6371;
  const d = distanceKm / R;
  const lat1 = toRad(origin.latitude);
  const lon1 = toRad(origin.longitude);
  const brng = toRad(bearing);

  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(d) + Math.cos(lat1) * Math.sin(d) * Math.cos(brng)
  );
  const lon2 =
    lon1 +
    Math.atan2(
      Math.sin(brng) * Math.sin(d) * Math.cos(lat1),
      Math.cos(d) - Math.sin(lat1) * Math.sin(lat2)
    );

  return {
    latitude: toDeg(lat2),
    longitude: toDeg(lon2),
  };
}

// Places 3 waypoints at ~120° intervals around the origin to form a triangular loop.
// Dividing by 1.2 compensates for road detours making actual distance longer than straight lines.
function generateWaypoints(origin: Coordinate, targetKm: number): Coordinate[] {
  const radius = targetKm / (2 * Math.PI * 1.2);
  const baseBearing = Math.random() * 360;

  const bearingJitter = () => (Math.random() - 0.5) * 50;
  const distFactor = () => 0.8 + Math.random() * 0.4;

  return [
    offsetCoordinate(origin, baseBearing + bearingJitter(), radius * distFactor()),
    offsetCoordinate(origin, baseBearing + 120 + bearingJitter(), radius * distFactor()),
    offsetCoordinate(origin, baseBearing + 240 + bearingJitter(), radius * distFactor()),
  ];
}

// Calculates the bounding box (NE + SW corners) that contains all route coordinates.
// Used by MapDisplay to fit the camera to the full route after generation.
export function getBoundingBox(coordinates: Coordinate[]): {
  ne: [number, number];
  sw: [number, number];
} {
  const lats = coordinates.map((c) => c.latitude);
  const lngs = coordinates.map((c) => c.longitude);

  return {
    ne: [Math.max(...lngs), Math.max(...lats)],
    sw: [Math.min(...lngs), Math.min(...lats)],
  };
}

export async function fetchRandomRoute(origin: Coordinate, targetKm: number): Promise<RunRoute> {
  const waypoints = generateWaypoints(origin, targetKm);

  // Loop: origin → waypoint1 → waypoint2 → origin
  const allPoints = [origin, ...waypoints, origin];

  const coords = allPoints
    .map((c) => `${c.longitude},${c.latitude}`)
    .join(';');

  const url =
    `${DIRECTIONS_URL}/${coords}` +
    `?geometries=geojson&overview=full&access_token=${MAPBOX_TOKEN}`;

  const response = await fetch(url);
  if (!response.ok) throw new Error('Failed to fetch route from Mapbox.');

  const data = await response.json();
  const route = data.routes?.[0];
  if (!route) throw new Error('No route data returned.');

  // Mapbox returns coordinates as [longitude, latitude]; we convert to { latitude, longitude }
  const coordinates: Coordinate[] = route.geometry.coordinates.map(
    ([longitude, latitude]: [number, number]) => ({ latitude, longitude })
  );

  const distanceKm = Math.round((route.distance / 1000) * 10) / 10;

  return { coordinates, distanceKm };
}
