import MapboxGL from '@rnmapbox/maps';
import { StyleSheet, Text, View } from 'react-native';
import { MAPBOX_TOKEN, DEFAULT_ZOOM, DEMO_MODE } from '../constants';
import { getBoundingBox } from '../services/mapboxApi';
import { Coordinate, RunRoute } from '../types';

MapboxGL.setAccessToken(MAPBOX_TOKEN);

interface Props {
  location: Coordinate;
  route: RunRoute | null;
  isRunning?: boolean;
  bearing?: number;
  destinationPickerActive?: boolean;
  destination?: Coordinate | null;
  onMapPress?: (coord: Coordinate) => void;
}

export function MapDisplay({
  location,
  route,
  isRunning = false,
  bearing = 0,
  destinationPickerActive = false,
  destination = null,
  onMapPress,
}: Props) {
  const center: [number, number] = [location.longitude, location.latitude];

  const routeGeoJSON: GeoJSON.Feature<GeoJSON.LineString> | null = route
    ? {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: route.coordinates.map((c) => [c.longitude, c.latitude]),
        },
      }
    : null;

  function handlePress(feature: GeoJSON.Feature) {
    if (!destinationPickerActive || !onMapPress) return;
    const [longitude, latitude] = (feature.geometry as GeoJSON.Point).coordinates;
    onMapPress({ latitude, longitude });
  }

  return (
    <View style={styles.container}>
      <MapboxGL.MapView
        style={styles.map}
        styleURL={MapboxGL.StyleURL.Street}
        onPress={handlePress}
      >
        {isRunning ? (
          <MapboxGL.Camera
            centerCoordinate={center}
            zoomLevel={18}
            heading={bearing}
            pitch={45}
            animationMode="easeTo"
            animationDuration={400}
          />
        ) : route ? (
          <MapboxGL.Camera
            bounds={{
              ...getBoundingBox(route.coordinates),
              paddingTop: 100,
              paddingBottom: 100,
              paddingLeft: 40,
              paddingRight: 40,
            }}
            animationMode="flyTo"
            animationDuration={1000}
          />
        ) : (
          <MapboxGL.Camera
            zoomLevel={DEFAULT_ZOOM}
            centerCoordinate={center}
            animationMode="flyTo"
            animationDuration={1000}
          />
        )}

        <MapboxGL.PointAnnotation id="user-location" coordinate={center}>
          <View style={styles.markerOuter}>
            <View style={styles.markerInner} />
          </View>
        </MapboxGL.PointAnnotation>

        {destination && (
          <MapboxGL.PointAnnotation
            id="destination-pin"
            coordinate={[destination.longitude, destination.latitude]}
          >
            <View style={styles.destinationOuter}>
              <View style={styles.destinationInner} />
            </View>
          </MapboxGL.PointAnnotation>
        )}

        {routeGeoJSON && (
          <MapboxGL.ShapeSource id="route-source" shape={routeGeoJSON}>
            <MapboxGL.LineLayer
              id="route-line"
              style={{
                lineColor: '#4CAF50',
                lineWidth: 4,
                lineJoin: 'round',
                lineCap: 'round',
              }}
            />
          </MapboxGL.ShapeSource>
        )}

        {route?.waypoints && route.waypoints.length > 0 && (
          <MapboxGL.ShapeSource
            id="waypoints-source"
            shape={{
              type: 'FeatureCollection',
              features: route.waypoints.map((wp, i) => ({
                type: 'Feature',
                id: String(i),
                properties: {},
                geometry: { type: 'Point', coordinates: [wp.longitude, wp.latitude] },
              })),
            }}
          >
            <MapboxGL.CircleLayer
              id="waypoints-layer"
              style={{ circleRadius: 6, circleColor: '#000', circleStrokeWidth: 2, circleStrokeColor: '#fff' }}
            />
          </MapboxGL.ShapeSource>
        )}
      </MapboxGL.MapView>

      {destinationPickerActive && (
        <View style={styles.tapHint} pointerEvents="none">
          <View style={styles.tapHintBadge}>
            <Text style={styles.tapHintText}>📍  Tap the map to set destination</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
  },
  map: {
    flex: 1,
  },
  markerOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(66, 133, 244, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4285F4',
    borderWidth: 2,
    borderColor: '#fff',
  },
  destinationOuter: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(229, 57, 53, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  destinationInner: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#E53935',
    borderWidth: 2,
    borderColor: '#fff',
  },
  tapHint: {
    position: 'absolute',
    top: 16,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  tapHintBadge: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  tapHintText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
});
