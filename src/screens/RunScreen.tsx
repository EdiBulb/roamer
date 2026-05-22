import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import { useLocation } from '../hooks/useLocation';
import { useRoute } from '../hooks/useRoute';
import { MapDisplay } from '../components/MapDisplay';
import { DistancePicker } from '../components/DistancePicker';
import { RouteInfo } from '../components/RouteInfo';
import { RunningScreen } from '../components/RunningScreen';
import { RunSummaryScreen } from '../components/RunSummaryScreen';
import * as Speech from 'expo-speech';
import { DEMO_MODE } from '../constants';
import { Coordinate, Difficulty, RouteMode, TargetDistance } from '../types';
import { ModePicker } from '../components/ModePicker';
import { DifficultyPicker } from '../components/DifficultyPicker';

function segmentKm(a: Coordinate, b: Coordinate): number {
  const R = 6371;
  const dLat = ((b.latitude - a.latitude) * Math.PI) / 180;
  const dLon = ((b.longitude - a.longitude) * Math.PI) / 180;
  const lat1 = (a.latitude * Math.PI) / 180;
  const lat2 = (b.latitude * Math.PI) / 180;
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.asin(Math.sqrt(x));
}

function calcBearing(a: Coordinate, b: Coordinate): number {
  const lat1 = (a.latitude * Math.PI) / 180;
  const lat2 = (b.latitude * Math.PI) / 180;
  const dLon = ((b.longitude - a.longitude) * Math.PI) / 180;
  const y = Math.sin(dLon) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

export function RunScreen() {
  const { location, loading: locationLoading, error: locationError } = useLocation();
  const [selectedDistance, setSelectedDistance] = useState<TargetDistance>(5);
  const [routeMode, setRouteMode] = useState<RouteMode>('loop');
  const [destination, setDestination] = useState<Coordinate | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>('normal');
  const { route, status, generate } = useRoute(location, selectedDistance, routeMode, destination, difficulty);
  const [isRunning, setIsRunning] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const isPausedRef = useRef(false);
  const [coveredKm, setCoveredKm] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [simulatedLocation, setSimulatedLocation] = useState<Coordinate | null>(null);
  const [currentInstruction, setCurrentInstruction] = useState<string | null>(null);
  const [bearing, setBearing] = useState(0);

  const isGenerating = status === 'loading';

  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  useEffect(() => {
    if (!isRunning || isPaused) return;
    const timer = setInterval(() => setElapsedSeconds((s) => s + 1), 1000);
    return () => clearInterval(timer);
  }, [isRunning, isPaused]);

  useEffect(() => {
    if (!isRunning || !DEMO_MODE || !route) return;
    const coords = route.coordinates;
    const steps = route.steps ?? [];

    const cumDist: number[] = [0];
    for (let i = 1; i < coords.length; i++) {
      cumDist.push(cumDist[i - 1] + segmentKm(coords[i - 1], coords[i]) * 1000);
    }
    const totalM = cumDist[cumDist.length - 1];

    const SPEED_M_PER_TICK = 12;
    const ANNOUNCE_BEFORE_M = 100;
    const MIN_GAP_M = 80;

    let localCoveredM = 0;
    let stepIdx = 0;

    Speech.speak('Starting your run. Good luck!', { language: 'en' });

    const interval = setInterval(() => {
      if (isPausedRef.current) return;

      localCoveredM = Math.min(localCoveredM + SPEED_M_PER_TICK, totalM);

      let coordIdx = cumDist.findIndex((d) => d >= localCoveredM);
      if (coordIdx === -1) coordIdx = coords.length - 1;

      setSimulatedLocation(coords[coordIdx]);
      setCoveredKm(localCoveredM / 1000);

      const lookAhead = Math.min(coordIdx + 5, coords.length - 1);
      if (lookAhead > coordIdx) setBearing(calcBearing(coords[coordIdx], coords[lookAhead]));

      if (localCoveredM >= totalM) {
        Speech.speak('You have completed the route!', { language: 'en' });
        return;
      }

      if (stepIdx < steps.length && localCoveredM >= steps[stepIdx].distanceFromStartM - ANNOUNCE_BEFORE_M) {
        Speech.speak(steps[stepIdx].instruction, { language: 'en' });
        setCurrentInstruction(steps[stepIdx].instruction);
        const announcedAt = steps[stepIdx].distanceFromStartM;
        stepIdx += 1;
        while (stepIdx < steps.length && steps[stepIdx].distanceFromStartM - announcedAt < MIN_GAP_M) {
          stepIdx += 1;
        }
      }
    }, 500);

    return () => {
      clearInterval(interval);
      Speech.stop();
    };
  }, [isRunning, route]);

  function handleStartRun() {
    setCoveredKm(0);
    setElapsedSeconds(0);
    setCurrentInstruction(null);
    setSimulatedLocation(location);
    setIsPaused(false);
    setIsRunning(true);
  }

  function handlePause() {
    Speech.stop();
    setIsPaused(true);
  }

  function handleResume() {
    setIsPaused(false);
  }

  function handleFinishRun() {
    Speech.stop();
    setIsRunning(false);
    setIsPaused(false);
    setIsFinished(true);
  }

  function handleHome() {
    setIsFinished(false);
    setSimulatedLocation(null);
    setCoveredKm(0);
    setElapsedSeconds(0);
    setCurrentInstruction(null);
    setBearing(0);
  }

  if (isFinished && route) {
    return (
      <RunSummaryScreen
        coveredKm={coveredKm}
        elapsedSeconds={elapsedSeconds}
        route={route}
        onHome={handleHome}
      />
    );
  }

  const displayLocation = simulatedLocation ?? location;

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

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
        {displayLocation && (
          <MapDisplay
            location={displayLocation}
            route={route}
            isRunning={isRunning}
            bearing={bearing}
            destinationPickerActive={routeMode === 'destination' && !isRunning}
            destination={destination}
            onMapPress={(coord) => setDestination(coord)}
          />
        )}
      </View>

      {isRunning ? (
        <RunningScreen
          coveredKm={coveredKm}
          elapsedSeconds={elapsedSeconds}
          totalKm={route?.distanceKm ?? 0}
          instruction={currentInstruction}
          isPaused={isPaused}
          onPause={handlePause}
          onResume={handleResume}
          onFinish={handleFinishRun}
        />
      ) : routeMode === 'destination' && !destination ? (
        <View style={styles.cardMinimal}>
          <Text style={styles.appTitle}>Random Run</Text>
          <ModePicker selected={routeMode} onSelect={(m) => { setRouteMode(m); setDestination(null); }} />
        </View>
      ) : (
        <View style={styles.card}>
          <Text style={styles.appTitle}>Random Run</Text>

          <ModePicker selected={routeMode} onSelect={(m) => { setRouteMode(m); setDestination(null); }} />

          {routeMode === 'loop' ? (
            <DistancePicker selected={selectedDistance} onSelect={(d) => setSelectedDistance(d)} />
          ) : (
            destination && (
              <DifficultyPicker selected={difficulty} onSelect={setDifficulty} />
            )
          )}

          <RouteInfo
            status={status}
            distanceKm={route?.distanceKm ?? null}
            targetKm={selectedDistance}
          />

          {status === 'success' ? (
            <>
              <TouchableOpacity style={styles.startRunButton} onPress={handleStartRun} activeOpacity={0.8}>
                <Text style={styles.startRunButtonText}>▶  Start Run</Text>
              </TouchableOpacity>
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
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  mapArea: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { fontSize: 14, color: '#666' },
  errorText: { fontSize: 14, color: '#E53935', textAlign: 'center', paddingHorizontal: 24 },
  card: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    paddingBottom: 100,
    paddingHorizontal: 24,
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 8,
    alignItems: 'center',
  },
  appTitle: { fontSize: 22, fontWeight: 'bold', color: '#1A1A1A' },
  startRunButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 16,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    minHeight: 54,
  },
  startRunButtonText: { color: '#fff', fontSize: 18, fontWeight: '800', letterSpacing: 0.5 },
  regenerateLink: { fontSize: 14, color: '#888', textDecorationLine: 'underline' },
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
  generateButtonDisabled: { backgroundColor: '#A5D6A7' },
  generateButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  cardMinimal: {
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
});
