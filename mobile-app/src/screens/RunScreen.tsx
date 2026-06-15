import { Animated, KeyboardAvoidingView, Platform, PanResponder, ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';

const COLLAPSED_VISIBLE = 90;
import { useLocation } from '../hooks/useLocation';
import { useRoute } from '../hooks/useRoute';
import { MapDisplay } from '../components/MapDisplay';
import { DistancePicker } from '../components/DistancePicker';
import { RouteInfo } from '../components/RouteInfo';
import { RunningScreen } from '../components/RunningScreen';
import { RunSummaryScreen } from '../components/RunSummaryScreen';
import * as Speech from 'expo-speech';
import * as Location from 'expo-location';
import { DEMO_MODE } from '../constants';
import { Coordinate, Difficulty, RouteMode, TargetDistance } from '../types';
import { ModePicker } from '../components/ModePicker';
import { DifficultyPicker } from '../components/DifficultyPicker';
import { DestinationPicker } from '../components/DestinationPicker';
import { useTutorial } from '../contexts/TutorialContext';

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
  const { advance, isActive } = useTutorial();
  const { location, loading: locationLoading, error: locationError } = useLocation();
  const [selectedDistance, setSelectedDistance] = useState<TargetDistance>(5);
  const [routeMode, setRouteMode] = useState<RouteMode>('loop');
  const [destination, setDestination] = useState<Coordinate | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>('normal');
  const { route, status, generate, clearRoute } = useRoute(location, selectedDistance, routeMode, destination, difficulty);
  const [isRunning, setIsRunning] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isFollowMode, setIsFollowMode] = useState(true);
  const [nextWaypointIndex, setNextWaypointIndex] = useState(0);
  const [isOffRoute, setIsOffRoute] = useState(false);
  const [isMyWayMode, setIsMyWayMode] = useState(false);
  const nextWaypointIndexRef = useRef(0);
  const finishCoordRef = useRef<Coordinate | null>(null);
  const hasAutoFinishedRef = useRef(false);
  const isPausedRef = useRef(false);
  const isOffRouteRef = useRef(false);
  const isMyWayModeRef = useRef(false);
  const offRouteTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onRouteTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastDeviationVoiceRef = useRef<number>(0);
  const [coveredKm, setCoveredKm] = useState(0);
  const panelNaturalHeightRef = useRef(0);
  const slideY = useRef(new Animated.Value(0)).current;
  const slideStartRef = useRef(0);

  const panResponder = useRef(PanResponder.create({
    onMoveShouldSetPanResponder: (_, { dy }) => Math.abs(dy) > 5,
    onPanResponderGrant: () => {
      slideY.stopAnimation();
      // _value는 Animated.Value의 현재값을 동기적으로 읽는 가장 신뢰할 수 있는 방법
      slideStartRef.current = (slideY as any)._value;
    },
    onPanResponderMove: (_, { dy }) => {
      const maxSlide = Math.max(0, panelNaturalHeightRef.current - COLLAPSED_VISIBLE);
      slideY.setValue(Math.max(0, Math.min(maxSlide, slideStartRef.current + dy)));
    },
    onPanResponderRelease: (_, { dy, vy }) => {
      const maxSlide = Math.max(0, panelNaturalHeightRef.current - COLLAPSED_VISIBLE);
      const currentVal = slideStartRef.current + dy;
      const collapsed = Math.abs(vy) > 0.3 ? vy > 0 : currentVal > maxSlide / 2;
      Animated.spring(slideY, {
        toValue: collapsed ? maxSlide : 0,
        useNativeDriver: false,
        bounciness: 4,
        speed: 14,
      }).start();
    },
  })).current;
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

      const nextWp = route.waypoints?.[nextWaypointIndexRef.current];
      if (nextWp && segmentKm(coords[coordIdx], nextWp) * 1000 < 30) {
        nextWaypointIndexRef.current += 1;
        setNextWaypointIndex(nextWaypointIndexRef.current);
      }

      const lookAhead = Math.min(coordIdx + 5, coords.length - 1);
      if (lookAhead > coordIdx) setBearing(calcBearing(coords[coordIdx], coords[lookAhead]));

      const finishCoord = finishCoordRef.current;
      if (
        finishCoord &&
        !hasAutoFinishedRef.current &&
        localCoveredM >= totalM * 0.8 &&
        segmentKm(coords[coordIdx], finishCoord) * 1000 < 50
      ) {
        hasAutoFinishedRef.current = true;
        Speech.speak('You have completed the route! Great job!', {
          language: 'en',
          onDone: () => { setIsRunning(false); setIsPaused(false); setIsFinished(true); },
          onError: () => { setIsRunning(false); setIsPaused(false); setIsFinished(true); },
        });
        return;
      }

      if (localCoveredM >= totalM) {
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

  useEffect(() => {
    if (!isRunning || DEMO_MODE || !route) return;

    const steps = route.steps ?? [];
    const ANNOUNCE_BEFORE_M = 50;
    const OFF_ROUTE_M = 30;
    const OFF_ROUTE_DEBOUNCE_MS = 10_000;
    const ON_ROUTE_DEBOUNCE_MS = 5_000;
    const VOICE_COOLDOWN_MS = 60_000;

    let prevCoord: Coordinate | null = null;
    let localCoveredM = 0;
    const announcedSteps = new Set<number>();
    let cancelled = false;
    let sub: Location.LocationSubscription | null = null;

    Speech.speak('Starting your run. Good luck!', { language: 'en' });

    Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.BestForNavigation,
        timeInterval: 2000,
        distanceInterval: 3,
      },
      (pos) => {
        if (isPausedRef.current || cancelled) return;

        const coord: Coordinate = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        };

        setSimulatedLocation(coord);

        const nextWp = route.waypoints?.[nextWaypointIndexRef.current];
        if (nextWp && segmentKm(coord, nextWp) * 1000 < 30) {
          const arrivedAt = nextWaypointIndexRef.current + 1;
          const total = route.waypoints.length;
          nextWaypointIndexRef.current += 1;
          setNextWaypointIndex(nextWaypointIndexRef.current);
          Speech.stop();
          const msg = arrivedAt === total
            ? `Checkpoint ${arrivedAt} reached. Heading to the finish!`
            : `Checkpoint ${arrivedAt} reached. Heading to checkpoint ${arrivedAt + 1}.`;
          Speech.speak(msg, { language: 'en' });
        }

        const finishCoord = finishCoordRef.current;
        if (
          finishCoord &&
          !hasAutoFinishedRef.current &&
          localCoveredM >= route.distanceKm * 1000 * 0.8 &&
          segmentKm(coord, finishCoord) * 1000 < 50
        ) {
          hasAutoFinishedRef.current = true;
          Speech.speak('You have completed the route! Great job!', {
            language: 'en',
            onDone: () => { setIsRunning(false); setIsPaused(false); setIsFinished(true); },
            onError: () => { setIsRunning(false); setIsPaused(false); setIsFinished(true); },
          });
          return;
        }

        if (prevCoord) {
          const segM = segmentKm(prevCoord, coord) * 1000;
          localCoveredM += segM;
          setCoveredKm(localCoveredM / 1000);
          setBearing(calcBearing(prevCoord, coord));
        }

        // 현재 위치 기반: step 꺾이는 지점까지 직선거리로 안내 타이밍 결정
        for (let i = 0; i < steps.length; i++) {
          if (announcedSteps.has(i)) continue;
          const turnPoint = steps[i].coordinates?.[0];
          if (!turnPoint) continue;
          const distToTurn = segmentKm(coord, turnPoint) * 1000;
          if (distToTurn < ANNOUNCE_BEFORE_M) {
            Speech.speak(steps[i].instruction, { language: 'en' });
            setCurrentInstruction(steps[i].instruction);
            announcedSteps.add(i);
            break;
          }
        }

        // ── deviation detection ──────────────────────────────────────────────
        if (!isMyWayModeRef.current) {
          let minDistM = Infinity;
          for (const c of route.coordinates) {
            const d = segmentKm(coord, c) * 1000;
            if (d < minDistM) minDistM = d;
          }

          if (minDistM > OFF_ROUTE_M) {
            if (onRouteTimerRef.current) { clearTimeout(onRouteTimerRef.current); onRouteTimerRef.current = null; }
            if (!offRouteTimerRef.current && !isOffRouteRef.current) {
              offRouteTimerRef.current = setTimeout(() => {
                setIsOffRoute(true);
                isOffRouteRef.current = true;
                const now = Date.now();
                if (now - lastDeviationVoiceRef.current > VOICE_COOLDOWN_MS) {
                  Speech.speak("You've left the route.", { language: 'en' });
                  lastDeviationVoiceRef.current = now;
                }
                offRouteTimerRef.current = null;
              }, OFF_ROUTE_DEBOUNCE_MS);
            }
          } else {
            if (offRouteTimerRef.current) { clearTimeout(offRouteTimerRef.current); offRouteTimerRef.current = null; }
            if (isOffRouteRef.current && !onRouteTimerRef.current) {
              onRouteTimerRef.current = setTimeout(() => {
                setIsOffRoute(false);
                isOffRouteRef.current = false;
                Speech.speak('Back on track.', { language: 'en' });
                onRouteTimerRef.current = null;
              }, ON_ROUTE_DEBOUNCE_MS);
            }
          }
        }

        prevCoord = coord;
      }
    ).then((s) => {
      if (cancelled) s.remove();
      else sub = s;
    });

    return () => {
      cancelled = true;
      sub?.remove();
      Speech.stop();
      if (offRouteTimerRef.current) { clearTimeout(offRouteTimerRef.current); offRouteTimerRef.current = null; }
      if (onRouteTimerRef.current) { clearTimeout(onRouteTimerRef.current); onRouteTimerRef.current = null; }
    };
  }, [isRunning, route]);

  function handleStartRun() {
    setCoveredKm(0);
    setElapsedSeconds(0);
    setCurrentInstruction(null);
    setSimulatedLocation(location);
    setIsPaused(false);
    slideY.setValue(0);
    setIsFollowMode(true);
    nextWaypointIndexRef.current = 0;
    setNextWaypointIndex(0);
    finishCoordRef.current = routeMode === 'loop' ? location : destination;
    hasAutoFinishedRef.current = false;
    setIsOffRoute(false);
    setIsMyWayMode(false);
    isOffRouteRef.current = false;
    isMyWayModeRef.current = false;
    setIsRunning(true);
  }

  function handlePause() {
    Speech.stop();
    setIsPaused(true);
  }

  function handleResume() {
    setIsPaused(false);
  }

  function handleMyWay() {
    setIsOffRoute(false);
    setIsMyWayMode(true);
    isOffRouteRef.current = false;
    isMyWayModeRef.current = true;
    if (offRouteTimerRef.current) { clearTimeout(offRouteTimerRef.current); offRouteTimerRef.current = null; }
    if (onRouteTimerRef.current) { clearTimeout(onRouteTimerRef.current); onRouteTimerRef.current = null; }
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
    setIsOffRoute(false);
    setIsMyWayMode(false);
    isOffRouteRef.current = false;
    isMyWayModeRef.current = false;
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
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
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
            isFollowMode={isFollowMode}
            onUserDrag={() => setIsFollowMode(false)}
            onFollowResume={() => setIsFollowMode(true)}
            nextWaypointIndex={nextWaypointIndex}
            isMyWayMode={isMyWayMode}
          />
        )}
        {isRunning && isOffRoute && (
          <View style={styles.offRouteBanner}>
            <Text style={styles.offRouteBannerText}>Off route</Text>
            <TouchableOpacity style={styles.myWayBtn} onPress={handleMyWay} activeOpacity={0.8}>
              <Text style={styles.myWayBtnText}>My Way</Text>
            </TouchableOpacity>
          </View>
        )}
        {isRunning && isMyWayMode && (
          <View style={styles.myWayBadge}>
            <Text style={styles.myWayBadgeText}>My Way 🏃</Text>
          </View>
        )}
        {isRunning && currentInstruction && !isOffRoute && !isMyWayMode && (
          <View style={styles.instructionOverlay}>
            <Text style={styles.instructionOverlayText}>{currentInstruction}</Text>
          </View>
        )}
      </View>

      {isRunning && (
        <Animated.View
          style={[styles.runningPanel, { transform: [{ translateY: slideY }] }]}
          onLayout={(e) => { panelNaturalHeightRef.current = e.nativeEvent.layout.height; }}
          {...panResponder.panHandlers}
        >
          <RunningScreen
            coveredKm={coveredKm}
            elapsedSeconds={elapsedSeconds}
            totalKm={route?.distanceKm ?? 0}
            isPaused={isPaused}
            onPause={handlePause}
            onResume={handleResume}
            onFinish={handleFinishRun}
          />
        </Animated.View>
      )}

      {!isRunning && (routeMode === 'destination' && !destination ? (
        <View style={styles.card}>
          <Text style={styles.appTitle}>Roamer</Text>
          <ModePicker selected={routeMode} onSelect={(m) => { setRouteMode(m); setDestination(null); clearRoute(); }} />
          {location && (
            <DestinationPicker
              userLocation={location}
              onSelect={(coord) => setDestination(coord)}
            />
          )}
        </View>
      ) : (
        <View style={styles.card}>
          <Text style={styles.appTitle}>Roamer</Text>

          <ModePicker selected={routeMode} onSelect={(m) => { setRouteMode(m); setDestination(null); clearRoute(); }} />

          {routeMode === 'loop' ? (
            <DistancePicker selected={selectedDistance} onSelect={(d) => { setSelectedDistance(d); if (isActive) advance(1); }} />
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
              <TouchableOpacity style={styles.startRunButton} onPress={() => { handleStartRun(); if (isActive) advance(3); }} activeOpacity={0.8}>
                <Text style={styles.startRunButtonText}>▶  Start Run</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.regenerateButton, isGenerating && styles.regenerateButtonDisabled]}
                onPress={generate}
                disabled={isGenerating}
                activeOpacity={0.7}
              >
                <Text style={styles.regenerateButtonText}>
                  {isGenerating ? 'Generating...' : '↺  Regenerate Route'}
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity
              style={[styles.generateButton, isGenerating && styles.generateButtonDisabled]}
              onPress={() => { generate(); if (isActive) advance(2); }}
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
      ))}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  mapArea: { flex: 1 },
  runningPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  instructionOverlay: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    backgroundColor: '#1A1A2E',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 18,
    zIndex: 10,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  offRouteBanner: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    backgroundColor: '#E53935',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 10,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  offRouteBannerText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  myWayBtn: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  myWayBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  myWayBadge: {
    position: 'absolute',
    top: 16,
    left: 16,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 14,
    zIndex: 10,
    elevation: 10,
  },
  myWayBadgeText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  instructionOverlayText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
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
  regenerateButton: {
    borderWidth: 1.5,
    borderColor: '#ccc',
    borderRadius: 24,
    paddingVertical: 10,
    paddingHorizontal: 28,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  regenerateButtonDisabled: { borderColor: '#e0e0e0' },
  regenerateButtonText: { fontSize: 14, color: '#555', fontWeight: '600' },
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
});

