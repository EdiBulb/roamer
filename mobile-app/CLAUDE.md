# Roamer — Claude Code Project Brief

## 프로젝트 개요
도시 탐험형 러닝 앱. 랜덤 루트를 생성하고, 처음 달린 거리(street)를 추적하며, 뱃지로 탐험 동기를 부여한다.

**North Star**: "How many streets have you discovered?"

## 기술 스택
- React Native + Expo SDK 54 (Dev Client 빌드)
- TypeScript
- Mapbox (`@rnmapbox/maps`, Mapbox Directions API, Static Map API)
- AsyncStorage (run history, explored streets 영구 저장)
- expo-location (실제 GPS)
- expo-speech (음성 내비게이션)
- expo-sensors (Magnetometer — 나침반)
- EAS Build (클라우드 빌드, Android APK 배포)

## 디렉토리 구조
```
src/
  components/    # UI 컴포넌트 (MapDisplay, RunCard, RunSummaryScreen 등)
  screens/       # 탭 스크린 (RunScreen, HomeScreen, CalendarScreen)
  services/      # 비즈니스 로직 (mapboxApi, streetTracker, badges, storage)
  hooks/         # 커스텀 훅 (useLocation, useRoute, useRunHistory)
  types/         # TypeScript 타입 (index.ts)
  constants/     # 앱 상수 (index.ts — MAPBOX_TOKEN, DEMO_MODE 등)
  navigation/    # 탭 네비게이터 (AppNavigator.tsx)
```

## 보안 규칙 (절대 어기지 말 것)
- **토큰을 코드나 git에 절대 커밋하지 않는다**
- `EXPO_PUBLIC_MAPBOX_TOKEN` (pk.) → `.env` 파일에만 보관
- `RNMAPBOX_MAPS_DOWNLOAD_TOKEN` (sk.) → `.env` 파일에만 보관
- EAS 빌드용 env variable → `npx eas-cli env:create`로만 등록 (eas.json에 값 직접 작성 금지)
- `.env`는 `.gitignore`에 있음 — 커밋 대상 아님

## 앱 실행 방법 (개발 환경)
```powershell
# 1. Metro 서버 시작 (별도 터미널)
npx expo start

# 2. ADB 연결 (폰 USB 연결 후)
& "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe" devices
& "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe" reverse tcp:8081 tcp:8081

# 3. 앱 실행 (deep link)
& "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe" -s R3CX906K9ZL shell am start -a android.intent.action.VIEW -d "exp+random-run://expo-development-client/?url=http%3A%2F%2F127.0.0.1%3A8081" com.anonymous.randomrun
```

## EAS 클라우드 빌드 (독립 실행 APK)
```powershell
npx eas-cli build --platform android --profile preview --non-interactive
```
- Expo 계정: gnsqud24 (qudgns246@gmail.com)
- EAS 프로젝트: @gnsqud24/random-run
- Windows 경로 제한(260자) 문제로 로컬 빌드 불가 → EAS 빌드만 사용

## DEMO_MODE
- `src/constants/index.ts`에 위치
- `true`: Auckland 고정 좌표 + 시뮬레이션 이동 (데모/영상 촬영용)
- `false`: 실제 GPS (기본값, 현재 설정)
- **변경 시 반드시 사용자에게 확인 후 진행**

## 핵심 아키텍처 결정사항
- **Street tracking**: Mapbox step.name 기반 (이름 없는 도로 제외)
- **탐험한 거리는 영구 누적**: 런 기록 삭제해도 explored_streets는 유지
- **웨이포인트 생성**: 체인 방식 (이전 포인트 기준으로 다음 포인트 생성, ±80° 이내 전환)
- **U-turn 감지**: `maneuver.modifier === 'uturn'` + bearing 차이 150° 초과 → 최대 3회 재시도
- **expo-linear-gradient 미사용**: APK 재빌드 필요 없는 rgba overlay로 대체

## 코드 컨벤션
- 컴포넌트/스크린은 named export (`export function Foo()`)
- 스타일은 항상 `StyleSheet.create()` 사용
- 새 파일 생성 시 커밋에 반드시 포함 (git add 누락 주의)
- 커밋 전 `git diff --stat HEAD`로 변경 파일 확인

## 하지 말 것
- `eas.json`에 토큰 값 직접 작성
- `DEMO_MODE`를 사용자 확인 없이 변경
- `expo-linear-gradient` 추가 (native rebuild 필요)
- 소셜 기능(피드, 팔로우, 채팅, 리더보드) 구현 — 현재 단계에서 의도적으로 제외
- 커밋 시 `git add -A` 또는 `git add .` 사용 (민감 파일 포함 위험)

## 향후 로드맵
1. 실제 GPS 테스트 및 검증
2. Closed Beta (5명, APK 배포)
3. Landing Page
4. Monthly Discovery Challenge
5. Discovery Heatmap (OpenStreetMap 연동 필요 — 대규모 작업)
