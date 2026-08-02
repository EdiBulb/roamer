import * as Sentry from '@sentry/react-native';
// This import must happen before any component mounts so that TaskManager.defineTask
// runs at module load time and the background location task is registered with the OS.
import './src/services/bgTracking';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { SplashScreen } from './src/components/SplashScreen';
import { OnboardingScreen } from './src/screens/OnboardingScreen';
import { useState, useEffect } from 'react';
import { PermissionsAndroid, Platform } from 'react-native';
import { AppNavigator } from './src/navigation/AppNavigator';
import AsyncStorage from '@react-native-async-storage/async-storage';

Sentry.init({
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
  environment: __DEV__ ? 'development' : 'production',
});

const ONBOARDING_KEY = 'onboardingCompleted';

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    async function init() {
      // Android 13+ requires POST_NOTIFICATIONS runtime permission for foreground service
      // notifications. Request it early so the user sees the prompt before starting a run.
      if (Platform.OS === 'android' && Platform.Version >= 33) {
        await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
      }
      const onboarding = await AsyncStorage.getItem(ONBOARDING_KEY);
      if (!onboarding) setShowOnboarding(true);
      setReady(true);
    }
    init();
  }, []);

  async function handleOnboardingFinish() {
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    setShowOnboarding(false);
  }

  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  if (!ready) return null;

  return (
    <SafeAreaProvider>
      {showOnboarding ? (
        <OnboardingScreen onFinish={handleOnboardingFinish} />
      ) : (
        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>
      )}
    </SafeAreaProvider>
  );
}
