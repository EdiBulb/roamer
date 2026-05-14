import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { useLocation } from './src/hooks/useLocation';
import { useRoute } from './src/hooks/useRoute';
import { MapDisplay } from './src/components/MapDisplay';
import { DistancePicker } from './src/components/DistancePicker';
import { RouteInfo } from './src/components/RouteInfo';
import { SplashScreen } from './src/components/SplashScreen';
import { RunningScreen } from './src/components/RunningScreen';
import { DEMO_MODE } from './src/constants';
import { Coordinate, TargetDistance } from './src/types';

function segmentKm(a: Coordinate, b: Coordinate): number {
  const R = 6371;
  const dLat = ((b.latitude - a.latitude) * Math.PI) / 180;
  const dLon = ((b.longitude - a.longitude) * Math.PI) / 180;
  const lat1 = (a.latitude * Math.PI) / 180;
  const lat2 = (b.latitude * Math.PI) / 180;
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.asin(Math.sqrt(x));
}

export default function App() {
  return <AppContent />;
}

function AppContent() {
  const { location, loading: locationLoading, error: locationError } = useLocation();
  const [selectedDistance, setSelectedDistance] = useState<TargetDistance>(5);
  const { route, status, generate } = useRoute(location, selectedDistance);
  const [showSplash, setShowSplash] = useState(true);
  const [isRunning, setIsRunning] = useState(false);
  const [coveredKm, setCoveredKm] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [simulatedLocation, setSimulatedLocation] = useState<Coordinate | null>(null);

  const isGenerating = status === 'loading';

  // Elapsed time counter
  useEffect(() => {
    if (!isRunning) return;
    const timer = setInterval(() => setElapsedSeconds((s) => s + 1), 1000);
    return () => clearInterval(timer);
  }, [isRunning]);

  // Demo mode: simulate position moving along route coordinates
  useEffect(() => {
    if (!isRunning || !DEMO_MODE || !route) return;
    const coords = route.coordinates;
    let index = 0;

    const interval = setInterval(() => {
      if (index >= coords.length - 1) return;
      const next = Math.min(index + 3, coords.length - 1);
      let added = 0;
      for (let i = index; i < next; i++) {
        added += segmentKm(coords[i], coords[i + 1]);
      }
      setSimulatedLocation(coords[next]);
      index = next;
      setCoveredKm((d) => d + added);
    }, 300);

    return () => clearInterval(interval);
  }, [isRunning, route]);

  function handleStartRun() {
    setCoveredKm(0);
    setElapsedSeconds(0);
    setSimulatedLocation(location);
    setIsRunning(true);
  }

  function handleStopRun() {
    setIsRunning(false);
    setSimulatedLocation(null);
  }

  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  const displayLocation = simulatedLocation ?? location;

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* Map area — always mounted so camera never resets on Start Run */}
      <View style={styles.mapArea}>
        {locationLoading && (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color="#4CAF50" />
            <Text style={styles.loadingText}>Getting your location...</Text>
          </View>
        )}
        {locationError && (
          <View style={styles.centered}>
            <Text style={styles.errorText}>{locationError}</Text>
          </View>
        )}
        {displayLocation && <MapDisplay location={displayLocation} route={route} />}
      </View>

      {/* Running stats card */}
      {isRunning ? (
        <RunningScreen
          coveredKm={coveredKm}
          elapsedSeconds={elapsedSeconds}
          onStop={handleStopRun}
        />
      ) : (
        /* Main card */
        <View style={styles.card}>
          <Text style={styles.appTitle}>Random Run</Text>

          <DistancePicker
            selected={selectedDistance}
            onSelect={(d) => setSelectedDistance(d)}
          />

          <RouteInfo
            status={status}
            distanceKm={route?.distanceKm ?? null}
            targetKm={selectedDistance}
          />

          {status === 'success' ? (
            <>
              {/* Primary CTA */}
              <TouchableOpacity
                style={styles.startRunButton}
                onPress={handleStartRun}
                activeOpacity={0.8}
              >
                <Text style={styles.startRunButtonText}>▶  Start Run</Text>
              </TouchableOpacity>

              {/* Secondary action — text link, not a competing button */}
              <TouchableOpacity onPress={generate} disabled={isGenerating} activeOpacity={0.6}>
                <Text style={styles.regenerateLink}>
                  {isGenerating ? 'Generating...' : '↺  Regenerate Route'}
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity
              style={[styles.generateButton, isGenerating && styles.generateButtonDisabled]}
              onPress={generate}
              disabled={isGenerating || !location}
              activeOpacity={0.8}
            >
              {isGenerating ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.generateButtonText}>Generate Route</Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  mapArea: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#666',
  },
  errorText: {
    fontSize: 14,
    color: '#E53935',
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  card: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    paddingBottom: 60,
    paddingHorizontal: 24,
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 8,
    alignItems: 'center',
  },
  appTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  startRunButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 16,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    minHeight: 54,
  },
  startRunButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  regenerateLink: {
    fontSize: 14,
    color: '#888',
    textDecorationLine: 'underline',
  },
  generateButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 14,
    paddingHorizontal: 48,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 180,
    minHeight: 50,
  },
  generateButtonDisabled: {
    backgroundColor: '#A5D6A7',
  },
  generateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
