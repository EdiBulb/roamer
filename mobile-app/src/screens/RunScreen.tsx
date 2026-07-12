import { Animated, KeyboardAvoidingView, Modal, Platform, PanResponder, ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';

const COLLAPSED_VISIBLE = 90;
const CARD_COLLAPSED_VISIBLE = 80;
import { useLocation } from '../hooks/useLocation';
import { useRoute } from '../hooks/useRoute';
import { MapDisplay } from '../components/MapDisplay';
import { DistancePicker } from '../components/DistancePicker';
import { RouteInfo } from '../components/RouteInfo';
import { RunningScreen } from '../components/RunningScreen';
import { RunSummaryScreen } from '../components/RunSummaryScreen';
import * as Speech from 'expo-speech';
import * as Location from 'expo-location';
import { Area, Coordinate, Difficulty, RouteMode, TargetDistance } from '../types';
import { ModePicker } from '../components/ModePicker';
import { DifficultyPicker } from '../components/DifficultyPicker';
import { DestinationPicker } from '../components/DestinationPicker';
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

function getRoutePosition(
  coord: Coordinate,
  routeCoords: Coordinate[],
  routeCumDist: number[],
  fromIdx: number,
  windowSize = 50
): { positionM: number; segIdx: number } {
  const toIdx = Math.min(fromIdx + windowSize, routeCoords.length - 1);
  const ref = routeCoords[fromIdx] ?? routeCoords[0];
  const metersPerLat = 111320;
  const metersPerLng = 111320 * Math.cos((ref.latitude * Math.PI) / 180);
  let bestDist = Infinity;
  let bestPosM = routeCumDist[fromIdx] ?? 0;
  let bestSegIdx = fromIdx;

  for (let i = fromIdx; i < toIdx; i++) {
    const A = routeCoords[i];
    const B = routeCoords[i + 1];
    const bx = (B.longitude - A.longitude) * metersPerLng;
    const by = (B.latitude - A.latitude) * metersPerLat;
    const px = (coord.longitude - A.longitude) * metersPerLng;
    const py = (coord.latitude - A.latitude) * metersPerLat;
    const lenSq = bx * bx + by * by;
    if (lenSq === 0) continue;
    const t = Math.max(0, Math.min(1, (px * bx + py * by) / lenSq));
    const distToProj = Math.sqrt((px - t * bx) ** 2 + (py - t * by) ** 2);
    if (distToProj < bestDist) {
      bestDist = distToProj;
      bestPosM = routeCumDist[i] + t * Math.sqrt(lenSq);
      bestSegIdx = i;
    }
  }
  return { positionM: bestPosM, segIdx: bestSegIdx };
}

export function RunScreen() {
  const { advance, isActive } = useTutorial();
  const { settings } = useSettings();
  const { history, refresh: refreshHistory } = useRunHistory();
  const historyRoutes = history
    .filter((r) => r.routeCoordinates?.length >= 2)
    .map((r) => r.routeCoordinates);

  const [areas, setAreas] = useState<Area[]>([]);
  const [activeArea, setActiveArea] = useState<Area | null>(null);
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
  const [selectedDistance, setSelectedDistance] = useState<TargetDistance>(5);
  const [routeMode, setRouteMode] = useState<RouteMode>('loop');
  const [destination, setDestination] = useState<Coordinate | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>('normal');
  const { route, status, generate, generateTight, clearRoute } = useRoute(location, selectedDistance, routeMode, destination, difficulty, activeArea);
  const [showDistanceModal, setShowDistanceModal] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [followMode, setFollowMode] = useState<FollowMode>('follow');
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

  const [coveredKm, setCoveredKm] = useState(0);
  const [freeWalkTrace, setFreeWalkTrace] = useState<Coordinate[]>([]);
  const [gpsTrace, setGpsTrace] = useState<Coordinate[]>([]);
  const [liveColoredIds, setLiveColoredIds] = useState<Set<string>>(new Set());
  const activeAreaRef = useRef<Area | null>(null);
  const segmentHitCountRef = useRef<Map<string, number>>(new Map());
  useEffect(() => { activeAreaRef.current = activeArea; }, [activeArea]);

  // Show modal when generated route is >30% longer than target
  useEffect(() => {
    if (route?.distanceWarning && !isRunning) {
      setShowDistanceModal(true);
    }
  }, [route]);
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
  const [currentTurnDistM, setCurrentTurnDistM] = useState<number | null>(null);
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
    if (!isRunning || !route) return;

    const steps = route.steps ?? [];
    const OFF_ROUTE_M = 45;
    const OFF_ROUTE_DEBOUNCE_MS = 6_000;
    const ON_ROUTE_DEBOUNCE_MS = 5_000;
    const TURN_PREVIEW_M = 200;
    const TURN_FINAL_M = settingsRef.current.announceDistanceM;
    const WP_PREVIEW_M = 150;
    const SILENCE_MS = 60_000;

    let prevCoord: Coordinate | null = null;
    let localCoveredM = 0;
    let lastAnnouncedKmMilestone = 0;
    const runStartTime = Date.now();
    let lastVoiceTime = 0;
    let routeSnapIdx = 0;
    let routePositionM = 0;
    let nextPreviewIdx = 1;
    let nextFinalIdx = 1;
    const wpPreviewed = new Set<number>();
    const totalM = route.distanceKm * 1000;
    const FINISH_MILESTONES = [1000, 500, 200].filter((m) => m <= totalM * 0.2);
    const announcedFinishMilestones = new Set<number>();
    let cancelled = false;
    let sub: Location.LocationSubscription | null = null;

    // Pre-compute each waypoint's cumulative distance along the route (monotonic search)
    const routeCoords = route.coordinates;
    const routeCumDist: number[] = [0];
    for (let i = 1; i < routeCoords.length; i++) {
      routeCumDist.push(routeCumDist[i - 1] + segmentKm(routeCoords[i - 1], routeCoords[i]) * 1000);
    }
    const wpDistancesFromStartM: number[] = [];
    let wpSearchFrom = 0;
    for (const wp of route.waypoints ?? []) {
      let bestIdx = wpSearchFrom;
      let bestDist = Infinity;
      for (let i = wpSearchFrom; i < routeCoords.length; i++) {
        const d = segmentKm(routeCoords[i], wp) * 1000;
        if (d < bestDist) { bestDist = d; bestIdx = i; }
      }
      wpDistancesFromStartM.push(routeCumDist[bestIdx]);
      wpSearchFrom = bestIdx;
    }

    const speak = (text: string) => {
      if (!settingsRef.current.voiceEnabled) return;
      Speech.stop();
      Speech.speak(text, { language: 'ko' });
      lastVoiceTime = Date.now();
    };

    const distText = route.distanceKm.toFixed(1).replace('.0', '') + '킬로미터';
    const firstStep = steps[0]?.instruction;
    speak(firstStep
      ? `${distText} 루트 시작합니다. ${firstStep}`
      : `${distText} 루트 시작합니다. 파이팅!`);

    Location.watchPositionAsync(
      { accuracy: Location.Accuracy.BestForNavigation, timeInterval: 2000, distanceInterval: 0 },
      (pos) => {
        if (isPausedRef.current || cancelled) return;

        const coord: Coordinate = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
        setSimulatedLocation(coord);
        setGpsTrace((prev) => [...prev, coord]);
        if (selectedDistance === 'free') setFreeWalkTrace((prev) => [...prev, coord]);

        // Real-time segment coloring
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

        // Update distance and bearing
        if (prevCoord) {
          localCoveredM += segmentKm(prevCoord, coord) * 1000;
          setCoveredKm(localCoveredM / 1000);
          setBearing(calcBearing(prevCoord, coord));
        }

        const snap = getRoutePosition(coord, routeCoords, routeCumDist, routeSnapIdx);
        routeSnapIdx = snap.segIdx;
        routePositionM = snap.positionM;

        if (nextPreviewIdx < steps.length) {
          const distToNext = steps[nextPreviewIdx].distanceFromStartM - routePositionM;
          if (distToNext > TURN_FINAL_M && distToNext <= TURN_PREVIEW_M) {
            setCurrentTurnDistM(Math.round(distToNext / 10) * 10);
          } else {
            setCurrentTurnDistM(null);
          }
        } else {
          setCurrentTurnDistM(null);
        }

        // Waypoint preview (150m) and arrival (30m) — distanceFromStart 기준
        const nextWpIdx = nextWaypointIndexRef.current;
        if (nextWpIdx < (route.waypoints?.length ?? 0)) {
          const wpDist = wpDistancesFromStartM[nextWpIdx];
          const totalWp = route.waypoints.length;
          if (routePositionM >= wpDist - 30) {
            const arrivedAt = nextWpIdx + 1;
            nextWaypointIndexRef.current += 1;
            setNextWaypointIndex(nextWaypointIndexRef.current);
            if (settingsRef.current.voiceFrequency !== 'minimal') {
              speak(arrivedAt === totalWp
                ? `체크포인트 ${arrivedAt} 도착! 출발지로 돌아갑니다.`
                : `체크포인트 ${arrivedAt} 도착! 체크포인트 ${arrivedAt + 1}로 향합니다.`);
            }
          } else if (!wpPreviewed.has(nextWpIdx) && routePositionM >= wpDist - WP_PREVIEW_M) {
            if (settingsRef.current.voiceFrequency !== 'minimal') {
              speak(nextWpIdx === totalWp - 1
                ? '곧 마지막 체크포인트에 도착합니다.'
                : `곧 체크포인트 ${nextWpIdx + 1}에 도착합니다.`);
            }
            wpPreviewed.add(nextWpIdx);
          }
        }

        // Finish countdown milestones (last 20% of route)
        const remainingM = totalM - routePositionM;
        for (const milestone of FINISH_MILESTONES) {
          if (remainingM <= milestone && !announcedFinishMilestones.has(milestone)) {
            announcedFinishMilestones.add(milestone);
            if (settingsRef.current.voiceFrequency !== 'minimal') {
              speak(milestone === 200
                ? '거의 다 왔어요! 200미터!'
                : `${milestone >= 1000 ? `${milestone / 1000}킬로미터` : `${milestone}미터`} 남았습니다! 조금만 더!`);
            }
          }
        }

        // Route completion
        const finishCoord = finishCoordRef.current;
        if (
          finishCoord &&
          !hasAutoFinishedRef.current &&
          routePositionM >= route.distanceKm * 1000 * 0.8 &&
          segmentKm(coord, finishCoord) * 1000 < 50
        ) {
          hasAutoFinishedRef.current = true;
          Speech.speak('완주했습니다! 수고하셨어요!', {
            language: 'ko',
            onDone: () => { setIsRunning(false); setIsPaused(false); setIsFinished(true); },
            onError: () => { setIsRunning(false); setIsPaused(false); setIsFinished(true); },
          });
          return;
        }

        // 2-stage turn instructions (distanceFromStartM 기준 — 지리적 거리 X)
        // 지리적 거리를 쓰면 루프 루트 귀환 구간이 출발지 근처에서 동시에 발화됨
        if (settingsRef.current.voiceEnabled) {
          // Preview: 200m 전에 예고
          while (nextPreviewIdx < steps.length && routePositionM >= steps[nextPreviewIdx].distanceFromStartM - TURN_PREVIEW_M) {
            if (routePositionM < steps[nextPreviewIdx].distanceFromStartM - TURN_FINAL_M) {
              if (settingsRef.current.voiceFrequency !== 'minimal') {
                const distToTurn = steps[nextPreviewIdx].distanceFromStartM - routePositionM;
                speak(`${Math.round(distToTurn / 10) * 10}미터 앞에서 ${steps[nextPreviewIdx].instruction}`);
                setCurrentInstruction(steps[nextPreviewIdx].instruction);
              }
            }
            nextPreviewIdx++;
          }

          // Final: 50m 직전 실행
          while (nextFinalIdx < steps.length && routePositionM >= steps[nextFinalIdx].distanceFromStartM - TURN_FINAL_M) {
            speak(steps[nextFinalIdx].instruction);
            setCurrentInstruction(steps[nextFinalIdx].instruction);
            nextFinalIdx = Math.max(nextFinalIdx + 1, nextPreviewIdx);
          }

          // KM milestone (chatty) — suppressed once finish countdown begins
          if (settingsRef.current.voiceFrequency === 'chatty') {
            const kmMilestone = Math.floor(routePositionM / 1000);
            const inFinishZone = FINISH_MILESTONES.length > 0 && remainingM <= FINISH_MILESTONES[0];
            if (kmMilestone > lastAnnouncedKmMilestone && kmMilestone > 0 && !inFinishZone) {
              const elapsedSec = (Date.now() - runStartTime) / 1000;
              const paceSecPerKm = elapsedSec / (localCoveredM / 1000);
              const paceMin = Math.floor(paceSecPerKm / 60);
              const paceSec = Math.round(paceSecPerKm % 60);
              speak(`${kmMilestone}킬로미터 통과! 페이스 ${paceMin}분 ${paceSec.toString().padStart(2, '0')}초`);
              lastAnnouncedKmMilestone = kmMilestone;
            }
          }

          // Silence filler: 60s 침묵 시 남은 거리 안내
          if (!isOffRouteRef.current && Date.now() - lastVoiceTime > SILENCE_MS) {
            const turnSoon = nextPreviewIdx < steps.length &&
              routePositionM >= steps[nextPreviewIdx].distanceFromStartM - TURN_PREVIEW_M - 100;
            if (!turnSoon && settingsRef.current.voiceFrequency !== 'minimal') {
              const remainingKm = Math.max(0, route.distanceKm - routePositionM / 1000);
              speak(`계속 달리세요. 남은 거리 ${remainingKm.toFixed(1)}킬로미터.`);
            }
          }
        }

        // Deviation detection
        if (!isMyWayModeRef.current) {
          let minDistM = Infinity;
          for (const c of route.coordinates) {
            const d = segmentKm(coord, c) * 1000;
            if (d < minDistM) minDistM = d;
          }

          if (minDistM > OFF_ROUTE_M) {
            if (onRouteTimerRef.current) { clearTimeout(onRouteTimerRef.current); onRouteTimerRef.current = null; }
            if (!offRouteTimerRef.current && !isOffRouteRef.current) {
              const capturedCoord = coord;
              const capturedBearing = prevCoord ? calcBearing(prevCoord, coord) : 0;
              offRouteTimerRef.current = setTimeout(() => {
                setIsOffRoute(true);
                isOffRouteRef.current = true;
                if (settingsRef.current.voiceEnabled) {
                  let nearestPt: Coordinate | null = null;
                  let minD = Infinity;
                  for (const c of route.coordinates) {
                    const d = segmentKm(capturedCoord, c) * 1000;
                    if (d < minD) { minD = d; nearestPt = c; }
                  }
                  const direction = (() => {
                    if (!nearestPt) return '';
                    const rel = ((calcBearing(capturedCoord, nearestPt) - capturedBearing + 360) % 360);
                    if (rel < 45 || rel > 315) return ' 앞쪽으로 돌아가세요.';
                    if (rel < 135) return ' 오른쪽으로 돌아가세요.';
                    if (rel < 225) return ' 뒤쪽으로 돌아가세요.';
                    return ' 왼쪽으로 돌아가세요.';
                  })();
                  speak(`루트를 벗어났습니다.${direction}`);
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
                speak('루트로 돌아왔습니다.');
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
    setFollowMode('follow');
    nextWaypointIndexRef.current = 0;
    setNextWaypointIndex(0);
    finishCoordRef.current = routeMode === 'loop' ? location : destination;
    hasAutoFinishedRef.current = false;
    setIsOffRoute(false);
    setIsMyWayMode(false);
    isOffRouteRef.current = false;
    isMyWayModeRef.current = false;
    cardSlideY.setValue(0);
    setFreeWalkTrace(location ? [location] : []);
    setGpsTrace(location ? [location] : []);
    setLiveColoredIds(new Set());
    segmentHitCountRef.current = new Map();
    setIsRunning(true);
  }

  function handlePause() {
    Speech.stop();
    setIsPaused(true);
    if (settingsRef.current.voiceEnabled) {
      Speech.speak('일시정지', { language: 'ko' });
    }
  }

  function handleResume() {
    setIsPaused(false);
    if (settingsRef.current.voiceEnabled) {
      if (route && selectedDistance !== 'free') {
        const remainingKm = Math.max(0, route.distanceKm - coveredKm).toFixed(1);
        Speech.speak(`다시 달립니다! 남은 거리 ${remainingKm}킬로미터`, { language: 'ko' });
      } else {
        Speech.speak('다시 달립니다!', { language: 'ko' });
      }
    }
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

  const freeWalkRoute: import('../types').RunRoute | null =
    selectedDistance === 'free' && freeWalkTrace.length >= 2
      ? { coordinates: freeWalkTrace, distanceKm: coveredKm, steps: [], streetNames: [], waypoints: [] }
      : null;

  if (isFinished && (route || freeWalkRoute)) {
    return (
      <RunSummaryScreen
        coveredKm={coveredKm}
        elapsedSeconds={elapsedSeconds}
        route={(route ?? freeWalkRoute)!}
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
            route={route}
            isRunning={isRunning}
            bearing={bearing}
            destinationPickerActive={routeMode === 'destination' && !isRunning}
            destination={destination}
            onMapPress={(coord) => setDestination(coord)}
            followMode={followMode}
            onUserDrag={() => setFollowMode('free')}
            onFollowModeChange={setFollowMode}
            nextWaypointIndex={nextWaypointIndex}
            isMyWayMode={isMyWayMode}
            historyRoutes={historyRoutes}
            areas={areas}
            activeAreaId={activeArea?.id ?? null}
            liveColoredIds={liveColoredIds}
          />
        )}

        {/* ── My Areas button (idle, not running) ── */}
        {!isRunning && displayLocation && (
          <TouchableOpacity
            style={styles.areaBtn}
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
            <Text style={styles.instructionOverlayText}>
              {currentInstruction}{currentTurnDistM ? `  —  ${currentTurnDistM}m` : ''}
            </Text>
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
            units={settings.units}
            onPause={handlePause}
            onResume={handleResume}
            onFinish={handleFinishRun}
          />
        </Animated.View>
      )}

{!isRunning && (
        <Animated.View
          style={[styles.card, { transform: [{ translateY: cardSlideY }] }]}
          onLayout={(e) => { cardNaturalHeightRef.current = e.nativeEvent.layout.height; }}
          {...cardPanResponder.panHandlers}
        >
          <View style={styles.cardHandle} />
          {routeMode === 'destination' && !destination ? (
          <>
          <Text style={styles.appTitle}>Roamer</Text>
          <ModePicker selected={routeMode} onSelect={(m) => { setRouteMode(m); setDestination(null); clearRoute(); cardSlideY.setValue(0); }} />
          {location && (
            <DestinationPicker
              userLocation={location}
              onSelect={(coord) => setDestination(coord)}
            />
          )}
          </>
          ) : (
          <>
          <Text style={styles.appTitle}>Roamer</Text>

          <ModePicker selected={routeMode} onSelect={(m) => { setRouteMode(m); setDestination(null); clearRoute(); cardSlideY.setValue(0); }} />

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
            units={settings.units}
          />

          {selectedDistance === 'free' ? (
            <TouchableOpacity style={styles.startRunButton} onPress={() => { handleStartRun(); if (isActive) advance(3); }} activeOpacity={0.8}>
              <Text style={styles.startRunButtonText}>▶  Start Coloring</Text>
            </TouchableOpacity>
          ) : status === 'success' ? (
            <>
              <TouchableOpacity style={styles.startRunButton} onPress={() => { handleStartRun(); if (isActive) advance(3); }} activeOpacity={0.8}>
                <Text style={styles.startRunButtonText}>▶  Start Coloring</Text>
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
          </>
          )}
        </Animated.View>
      )}
      {/* ── Distance warning modal ── */}
      <Modal
        visible={showDistanceModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDistanceModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.distanceModal}>
            <Text style={styles.distanceModalEmoji}>🗺️</Text>
            <Text style={styles.distanceModalTitle}>더 좋은 루트를 찾았어요</Text>
            <Text style={styles.distanceModalBody}>
              이 동네에서 {route?.distanceWarning?.targetKm}km 루트를 만들기 어려워{'\n'}
              더 넓게 도는 <Text style={styles.distanceModalKm}>{route?.distanceWarning?.actualKm?.toFixed(1)}km</Text> 루트가 훨씬 좋은 퀄리티예요
            </Text>
            <TouchableOpacity
              style={styles.distanceModalPrimary}
              onPress={() => setShowDistanceModal(false)}
              activeOpacity={0.85}
            >
              <Text style={styles.distanceModalPrimaryText}>이 루트로 달리기 ({route?.distanceWarning?.actualKm?.toFixed(1)}km)</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.distanceModalSecondary}
              onPress={() => {
                setShowDistanceModal(false);
                generateTight();
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.distanceModalSecondaryText}>{route?.distanceWarning?.targetKm}km에 가깝게 다시 생성</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  areaBtn: {
    position: 'absolute',
    top: 16,
    left: 16,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 28,
  },
  distanceModal: {
    backgroundColor: '#fff',
    borderRadius: 24,
    paddingVertical: 28,
    paddingHorizontal: 24,
    alignItems: 'center',
    gap: 12,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 12,
  },
  distanceModalEmoji: { fontSize: 40 },
  distanceModalTitle: { fontSize: 18, fontWeight: '800', color: '#1A1A1A', textAlign: 'center' },
  distanceModalBody: { fontSize: 14, color: '#555', textAlign: 'center', lineHeight: 22 },
  distanceModalKm: { fontWeight: '800', color: '#4CAF50' },
  distanceModalPrimary: {
    backgroundColor: '#4CAF50',
    borderRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: 24,
    width: '100%',
    alignItems: 'center',
    marginTop: 4,
  },
  distanceModalPrimaryText: { color: '#fff', fontSize: 15, fontWeight: '800' },
  distanceModalSecondary: {
    paddingVertical: 10,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  distanceModalSecondaryText: { color: '#888', fontSize: 13, fontWeight: '600' },
});

