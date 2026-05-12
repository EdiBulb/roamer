import MapboxGL from '@rnmapbox/maps';
import { StyleSheet, View } from 'react-native';
import { MAPBOX_TOKEN, DEFAULT_ZOOM } from '../constants';
import { Coordinate, RunRoute } from '../types';

MapboxGL.setAccessToken(MAPBOX_TOKEN);

interface Props {
  location: Coordinate;
  route: RunRoute | null;
}

export function MapDisplay({ location, route }: Props) {
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

  return (
    <View style={styles.container}>
      <MapboxGL.MapView style={styles.map} styleURL={MapboxGL.StyleURL.Street}>
        <MapboxGL.Camera
          zoomLevel={DEFAULT_ZOOM}
          centerCoordinate={center}
          animationMode="flyTo"
          animationDuration={1000}
        />
        <MapboxGL.UserLocation visible androidRenderMode="gps" />

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
      </MapboxGL.MapView>
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
});
