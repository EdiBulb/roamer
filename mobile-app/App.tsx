import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { SplashScreen } from './src/components/SplashScreen';
import { OnboardingScreen } from './src/screens/OnboardingScreen';
import { TutorialOverlay } from './src/components/TutorialOverlay';
import { TutorialProvider } from './src/contexts/TutorialContext';
import { useState, useEffect } from 'react';
import { View } from 'react-native';
import { AppNavigator } from './src/navigation/AppNavigator';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ONBOARDING_KEY = 'onboardingCompleted';
const TUTORIAL_KEY = 'tutorialCompleted';

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    Promise.all([
      AsyncStorage.getItem(ONBOARDING_KEY),
      AsyncStorage.getItem(TUTORIAL_KEY),
    ]).then(([onboarding, tutorial]) => {
      if (!onboarding) setShowOnboarding(true);
      else if (!tutorial) setShowTutorial(true);
      setReady(true);
    });
  }, []);

  async function handleOnboardingFinish() {
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    setShowOnboarding(false);
    setShowTutorial(true);
  }

  async function handleTutorialFinish() {
    await AsyncStorage.setItem(TUTORIAL_KEY, 'true');
    setShowTutorial(false);
  }

  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  if (!ready) return null;

  if (showOnboarding) {
    return <OnboardingScreen onFinish={handleOnboardingFinish} />;
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <TutorialProvider active={showTutorial} onFinish={handleTutorialFinish}>
          <View style={{ flex: 1 }}>
            <AppNavigator />
            {showTutorial && <TutorialOverlay onComplete={handleTutorialFinish} />}
          </View>
        </TutorialProvider>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
