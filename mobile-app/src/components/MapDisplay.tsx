import MapboxGL from '@rnmapbox/maps';
import { useEffect, useRef, useState } from 'react';
import { Animated, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Magnetometer } from 'expo-sensors';
import { MAPBOX_TOKEN, DEFAULT_ZOOM } from '../constants';
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
  isFollowMode?: boolean;
  onUserDrag?: () => void;
  onFollowResume?: () => void;
  nextWaypointIndex?: number;
}

export function MapDisplay({
  location,
  route,
  isRunning = false,
  bearing = 0,
  destinationPickerActive = false,
  destination = null,
  onMapPress,
  isFollowMode = true,
  onUserDrag,
  onFollowResume,
  nextWaypointIndex = 0,
}: Props) {
  const center: [number, number] = [location.longitude, location.latitude];
  const cameraRef = useRef<MapboxGL.Camera>(null);

  const [compassHeading, setCompassHeading] = useState(0);
  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0, duration: 100, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  useEffect(() => {
    if (!isRunning || !isFollowMode) return;
    cameraRef.current?.setCamera({
      centerCoordinate: [location.longitude, location.latitude],
      zoomLevel: 18,
      heading: bearing,
      pitch: 45,
      animationDuration: 400,
      animationMode: 'easeTo',
    });
  }, [location, bearing, isFollowMode, isRunning]);

  useEffect(() => {
    Magnetometer.setUpdateInterval(100);
    const sub = Magnetometer.addListener(({ x, y }) => {
      let angle = Math.atan2(y, x) * (180 / Math.PI);
      angle = angle + 90;
      if (angle > 360) angle -= 360;
      if (angle < 0) angle += 360;
      setCompassHeading(Math.round(angle));
    });
    return () => sub.remove();
  }, []);

  // Use GPS bearing when moving during a run, otherwise use device compass
  const effectiveBearing = isRunning && bearing !== 0 ? bearing : compassHeading;

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
        onRegionIsChanging={(feature) => {
          if (isRunning && feature.properties?.isUserInteraction) {
            onUserDrag?.();
          }
        }}
      >
        {isRunning ? (
          <MapboxGL.Camera ref={cameraRef} />
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
          <View style={[styles.arrowWrapper, { transform: [{ rotate: `${effectiveBearing}deg` }] }]}>
            <View style={styles.arrowOuter} />
            <View style={styles.arrowInner} />
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
              features: route.waypoints
                .filter((_, i) => !isRunning || i !== nextWaypointIndex)
                .map((wp, i) => ({
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

        {isRunning && route?.waypoints?.[nextWaypointIndex] && (
          <MapboxGL.PointAnnotation
            id="next-waypoint"
            coordinate={[
              route.waypoints[nextWaypointIndex].longitude,
              route.waypoints[nextWaypointIndex].latitude,
            ]}
          >
            <View style={styles.nextWpContainer}>
              <Animated.View
                style={[
                  styles.nextWpPulse,
                  {
                    opacity: pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [0.5, 0] }),
                    transform: [{ scale: pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 2.8] }) }],
                  },
                ]}
              />
              <View style={styles.nextWpDot} />
            </View>
          </MapboxGL.PointAnnotation>
        )}
      </MapboxGL.MapView>

      {isRunning && (
        <TouchableOpacity
          style={[styles.followButton, isFollowMode ? styles.followButtonActive : styles.followButtonInactive]}
          onPress={onFollowResume}
          activeOpacity={0.8}
        >
          <Image
            source={isFollowMode
              ? require('../../assets/icons/follow-active.png')
              : require('../../assets/icons/follow-inactive.png')
            }
            style={styles.followIcon}
            resizeMode="contain"
          />
        </TouchableOpacity>
      )}

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
  arrowWrapper: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowOuter: {
    position: 'absolute',
    width: 0,
    height: 0,
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderBottomWidth: 24,
    borderStyle: 'solid',
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#fff',
  },
  arrowInner: {
    position: 'absolute',
    width: 0,
    height: 0,
    borderLeftWidth: 7,
    borderRightWidth: 7,
    borderBottomWidth: 18,
    borderStyle: 'solid',
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#4285F4',
    marginTop: 3,
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
  followButton: {
    position: 'absolute',
    bottom: 110,
    right: 8,
    borderRadius: 40,
  },
  followButtonActive: {
    borderWidth: 2.5,
    borderColor: '#4285F4',
  },
  followButtonInactive: {
    borderWidth: 2.5,
    borderColor: '#aaa',
  },
  followIcon: {
    width: 50,
    height: 50,
  },
  nextWpContainer: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextWpPulse: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#4285F4',
  },
  nextWpDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#4285F4',
    borderWidth: 3,
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
