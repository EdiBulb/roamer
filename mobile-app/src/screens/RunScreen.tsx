import { Animated, KeyboardAvoidingView, Platform, PanResponder, ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';

const COLLAPSED_VISIBLE = 90;
const CARD_COLLAPSED_VISIBLE = 80;

import { useLocation } from '../hooks/useLocation';
import { MapDisplay } from '../components/MapDisplay';
import { RunningScreen } from '../components/RunningScreen';
import { RunSummaryScreen } from '../components/RunSummaryScreen';
import * as Location from 'expo-location';
import { Area, Coordinate } from '../types';
import { useSettings } from '../hooks/useSettings';
import { useTutorial } from '../contexts/TutorialContext';
import { useRunHistory } from '../hooks/useRunHistory';
import { CreateAreaModal } from '../components/CreateAreaModal';
import { MyAreasSheet } from '../components/MyAreasSheet';
import { FollowMode } from '../components/MapDisplay';
import { loadAreas } from '../services/areaStorage';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';

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
  const insets = useSafeAreaInsets();
  const { advance, isActive } = useTutorial();
  const { settings } = useSettings();
  const { history, refresh: refreshHistory } = useRunHistory();

  // ── Area state ──
  const [areas, setAreas] = useState<Area[]>([]);
  const [activeArea, setActiveArea] = useState<Area | null>(null);
  const historyRoutes = history
    .filter((r) => r.routeCoordinates?.length >= 2 && (!activeArea || r.areaId === activeArea.id))
    .map((r) => r.routeCoordinates);
  const [showCreateArea, setShowCreateArea] = useState(false);
  const [showMyAreas, setShowMyAreas] = useState(false);
  const activeAreaIdRef = useRef<string | null>(null);

  function selectArea(area: Area) {
    setActiveArea(area);
    activeAreaIdRef.current = area.id;
  }

  useFocusEffect(useCallback(() => {
    refreshHistory();
    loadAreas().then((loaded) => {
      setAreas(loaded);
      if (loaded.length === 0) { setActiveArea(null); return; }
      const preferred = activeAreaIdRef.current
        ? loaded.find((a) => a.id === activeAreaIdRef.current) ?? loaded[0]
        : loaded[0];
      setActiveArea(preferred);
      activeAreaIdRef.current = preferred.id;
    });
  }, []));

  const settingsRef = useRef(settings);
  useEffect(() => { settingsRef.current = settings; }, [settings]);

  const { location, loading: locationLoading, error: locationError } = useLocation();

  // ── Run state ──
  const [isRunning, setIsRunning] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const isPausedRef = useRef(false);
  const [followMode, setFollowMode] = useState<FollowMode>('follow');

  const [coveredKm, setCoveredKm] = useState(0);
  const [gpsTrace, setGpsTrace] = useState<Coordinate[]>([]);
  const gpsTraceRef = useRef<Coordinate[]>([]);
  const [liveColoredIds, setLiveColoredIds] = useState<Set<string>>(new Set());
  const activeAreaRef = useRef<Area | null>(null);
  const segmentHitCountRef = useRef<Map<string, number>>(new Map());
  useEffect(() => { activeAreaRef.current = activeArea; }, [activeArea]);

  // ── Slide-up panel animation ──
  const panelNaturalHeightRef = useRef(0);
  const slideY = useRef(new Animated.Value(0)).current;
  const slideStartRef = useRef(0);
  const cardNaturalHeightRef = useRef(0);
  const cardSlideY = useRef(new Animated.Value(0)).current;
  const cardSlideStartRef = useRef(0);

  const cardPanResponder = useRef(PanResponder.create({
    onMoveShouldSetPanResponder: (_, { dy }) => Math.abs(dy) > 5,
    onPanResponderGrant: () => {
      cardSlideY.stopAnimation();
      cardSlideStartRef.current = (cardSlideY as any)._value;
    },
    onPanResponderMove: (_, { dy }) => {
      const maxSlide = Math.max(0, cardNaturalHeightRef.current - CARD_COLLAPSED_VISIBLE);
      cardSlideY.setValue(Math.max(0, Math.min(maxSlide, cardSlideStartRef.current + dy)));
    },
    onPanResponderRelease: (_, { dy, vy }) => {
      const maxSlide = Math.max(0, cardNaturalHeightRef.current - CARD_COLLAPSED_VISIBLE);
      const currentVal = cardSlideStartRef.current + dy;
      const collapsed = Math.abs(vy) > 0.3 ? vy > 0 : currentVal > maxSlide / 2;
      Animated.spring(cardSlideY, {
        toValue: collapsed ? maxSlide : 0,
        useNativeDriver: false,
        bounciness: 4,
        speed: 14,
      }).start();
    },
  })).current;

  const panResponder = useRef(PanResponder.create({
    onMoveShouldSetPanResponder: (_, { dy }) => Math.abs(dy) > 5,
    onPanResponderGrant: () => {
      slideY.stopAnimation();
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
  const elapsedSecondsRef = useRef(0);
  useEffect(() => { elapsedSecondsRef.current = elapsedSeconds; }, [elapsedSeconds]);

  const [simulatedLocation, setSimulatedLocation] = useState<Coordinate | null>(null);
  const [bearing, setBearing] = useState(0);

  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  // ── Timer: counts up while running and not paused ──
  useEffect(() => {
    if (!isRunning || isPaused) return;
    const timer = setInterval(() => setElapsedSeconds((s) => s + 1), 1000);
    return () => clearInterval(timer);
  }, [isRunning, isPaused]);

  // ── GPS tracking: segment coloring + distance + bearing ──
  useEffect(() => {
    if (!isRunning) return;

    let prevCoord: Coordinate | null = null;
    let localCoveredM = 0;
    let cancelled = false;
    let sub: Location.LocationSubscription | null = null;

    Location.watchPositionAsync(
      { accuracy: Location.Accuracy.BestForNavigation, timeInterval: 2000, distanceInterval: 0 },
      (pos) => {
        if (isPausedRef.current || cancelled) return;

        const coord: Coordinate = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
        setSimulatedLocation(coord);
        gpsTraceRef.current.push(coord);

        // Color segments the user passes through
        const area = activeAreaRef.current;
        if (area && area.segments.length > 0) {
          const THRESHOLD_KM = 0.010;
          const MIN_HITS = 2;
          const newlyColored: string[] = [];
          for (const seg of area.segments) {
            let hit = false;
            for (const segCoord of seg.coordinates) {
              if (segmentKm(coord, segCoord) <= THRESHOLD_KM) { hit = true; break; }
            }
            if (hit) {
              const count = (segmentHitCountRef.current.get(seg.id) ?? 0) + 1;
              segmentHitCountRef.current.set(seg.id, count);
              if (count === MIN_HITS) newlyColored.push(seg.id);
            }
          }
          if (newlyColored.length > 0) {
            setLiveColoredIds((prev) => {
              const next = new Set(prev);
              newlyColored.forEach((id) => next.add(id));
              return next;
            });
          }
        }

        // Update covered distance and map bearing
        if (prevCoord) {
          localCoveredM += segmentKm(prevCoord, coord) * 1000;
          setCoveredKm(localCoveredM / 1000);
          setBearing(calcBearing(prevCoord, coord));
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
    };
  }, [isRunning]);

  function handleStartRun() {
    setCoveredKm(0);
    setElapsedSeconds(0);
    setSimulatedLocation(location);
    setIsPaused(false);
    slideY.setValue(0);
    setFollowMode('follow');
    cardSlideY.setValue(0);
    gpsTraceRef.current = location ? [location] : [];
    setGpsTrace([]);
    setLiveColoredIds(new Set());
    segmentHitCountRef.current = new Map();
    setIsRunning(true);
  }

  function handlePause() {
    setIsPaused(true);
  }

  function handleResume() {
    setIsPaused(false);
  }

  function handleFinishRun() {
    setGpsTrace([...gpsTraceRef.current]);
    setIsRunning(false);
    setIsPaused(false);
    setIsFinished(true);
  }

  function handleHome() {
    setIsFinished(false);
    setSimulatedLocation(null);
    setCoveredKm(0);
    setElapsedSeconds(0);
    setBearing(0);
  }

  if (isFinished && gpsTrace.length >= 2) {
    const runRoute = {
      coordinates: gpsTrace,
      distanceKm: coveredKm,
      steps: [],
      streetNames: [],
      waypoints: [],
    };
    return (
      <RunSummaryScreen
        coveredKm={coveredKm}
        elapsedSeconds={elapsedSeconds}
        route={runRoute}
        onHome={handleHome}
        activeArea={activeArea}
        gpsTrace={gpsTrace}
        liveColoredIds={liveColoredIds}
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
            route={null}
            isRunning={isRunning}
            bearing={bearing}
            destinationPickerActive={false}
            destination={null}
            onMapPress={() => {}}
            followMode={followMode}
            onUserDrag={() => setFollowMode('free')}
            onFollowModeChange={setFollowMode}
            nextWaypointIndex={0}
            isMyWayMode={false}
            historyRoutes={historyRoutes}
            areas={areas}
            activeAreaId={activeArea?.id ?? null}
            liveColoredIds={liveColoredIds}
            routeClassification={undefined}
            legendBottom={CARD_COLLAPSED_VISIBLE + 16}
          />
        )}

        {/* My Areas button — only shown when not running */}
        {!isRunning && displayLocation && (
          <TouchableOpacity
            style={[styles.areaBtn, { top: insets.top + 8 }]}
            onPress={() => setShowMyAreas(true)}
            activeOpacity={0.85}
          >
            <Text style={styles.areaBtnText}>My Areas</Text>
            {activeArea && (
              <Text style={styles.areaBtnSub}>
                {activeArea.name} · {Math.round((activeArea.coloredSegmentIds.length / Math.max(activeArea.segments.length, 1)) * 100)}% explored
              </Text>
            )}
          </TouchableOpacity>
        )}

        <MyAreasSheet
          visible={showMyAreas}
          areas={areas}
          activeAreaId={activeArea?.id ?? null}
          onSelect={(area) => selectArea(area)}
          onCreateNew={() => setShowCreateArea(true)}
          onClose={() => setShowMyAreas(false)}
          onRenamed={(id, newName) => {
            setAreas((prev) => prev.map((a) => a.id === id ? { ...a, name: newName } : a));
            setActiveArea((prev) => prev?.id === id ? { ...prev, name: newName } : prev);
          }}
          onDeleted={(id) => {
            setAreas((prev) => {
              const next = prev.filter((a) => a.id !== id);
              if (activeAreaIdRef.current === id) {
                const fallback = next[0] ?? null;
                setActiveArea(fallback);
                activeAreaIdRef.current = fallback?.id ?? null;
              }
              return next;
            });
          }}
        />

        <CreateAreaModal
          visible={showCreateArea}
          location={displayLocation ?? { latitude: 0, longitude: 0 }}
          onClose={() => setShowCreateArea(false)}
          onCreated={(area) => {
            setAreas((prev) => [area, ...prev.filter((a) => a.id !== area.id)]);
            selectArea(area);
            setShowCreateArea(false);
          }}
        />
      </View>

      {/* Running panel — slides up from bottom during run */}
      {isRunning && (
        <Animated.View
          style={[styles.runningPanel, { transform: [{ translateY: slideY }] }]}
          onLayout={(e) => { panelNaturalHeightRef.current = e.nativeEvent.layout.height; }}
          {...panResponder.panHandlers}
        >
          <RunningScreen
            coveredKm={coveredKm}
            elapsedSeconds={elapsedSeconds}
            totalKm={0}
            isPaused={isPaused}
            units={settings.units}
            onPause={handlePause}
            onResume={handleResume}
            onFinish={handleFinishRun}
          />
        </Animated.View>
      )}

      {/* Bottom card — shown when not running */}
      {!isRunning && (
        <Animated.View
          style={[styles.card, { transform: [{ translateY: cardSlideY }] }]}
          onLayout={(e) => { cardNaturalHeightRef.current = e.nativeEvent.layout.height; }}
          {...cardPanResponder.panHandlers}
        >
          <View style={styles.cardHandle} />
          <Text style={styles.appTitle}>Roamer</Text>
          <TouchableOpacity
            style={styles.startRunButton}
            onPress={() => { handleStartRun(); if (isActive) advance(3); }}
            activeOpacity={0.8}
          >
            <Text style={styles.startRunButtonText}>▶  Start Run</Text>
          </TouchableOpacity>
        </Animated.View>
      )}
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
  areaBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 4,
  },
  areaBtnText: { fontSize: 14, fontWeight: '700', color: '#1A1A1A' },
  areaBtnSub: { fontSize: 11, color: '#4CAF50', fontWeight: '600', marginTop: 2 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { fontSize: 14, color: '#666' },
  errorText: { fontSize: 14, color: '#E53935', textAlign: 'center', paddingHorizontal: 24 },
  card: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
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
  cardHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E0E0E0',
    alignSelf: 'center',
    marginBottom: 4,
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
});
