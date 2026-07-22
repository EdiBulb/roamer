import * as Sentry from '@sentry/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { SplashScreen } from './src/components/SplashScreen';
import { OnboardingScreen } from './src/screens/OnboardingScreen';
import { useState, useEffect } from 'react';
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
    AsyncStorage.getItem(ONBOARDING_KEY).then((onboarding) => {
      if (!onboarding) setShowOnboarding(true);
      setReady(true);
    });
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
