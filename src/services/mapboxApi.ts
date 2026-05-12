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

// Generates two random waypoints around the origin to form a loop route.
// radius = targetKm / (2π) approximates the radius of a circle with the target circumference.
function generateWaypoints(origin: Coordinate, targetKm: number): Coordinate[] {
  const radius = targetKm / (2 * Math.PI);
  const baseBearing = Math.random() * 360;

  const wp1 = offsetCoordinate(origin, baseBearing, radius * 1.2);
  const wp2 = offsetCoordinate(origin, baseBearing + 120 + Math.random() * 60, radius * 1.0);

  return [wp1, wp2];
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
