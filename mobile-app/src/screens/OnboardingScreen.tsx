import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Dimensions,
  StatusBar,
} from 'react-native';
import { useRef, useState } from 'react';
import { requestForegroundPermissionsAsync } from 'expo-location';

const { width } = Dimensions.get('window');

const SLIDES = [
  {
    id: '1',
    headline: 'How many streets\nhave you discovered?',
    body: 'Most runners know how far they run.\nFew know how much of their city\nthey\'ve explored.',
    emoji: '🗺️',
    accent: '#4CAF50',
  },
  {
    id: '2',
    headline: 'Running the same\nroute gets boring.',
    body: 'The same streets.\nThe same intersections.\nThe same routine.',
    emoji: '😴',
    accent: '#FF9800',
  },
  {
    id: '3',
    headline: 'Generate.\nExplore. Discover.',
    body: 'Generate a new route.\nExplore unfamiliar streets.\nDiscover places you\'ve never visited.',
    emoji: '✨',
    accent: '#2196F3',
  },
  {
    id: '4',
    headline: 'Build your\nexploration map.',
    body: 'Discover new streets.\nEarn badges.\nTrack your exploration journey.',
    emoji: '🏅',
    accent: '#9C27B0',
  },
  {
    id: '5',
    headline: 'Ready to explore?',
    body: 'Roamer uses your location to generate\npersonalized running routes.\n\nNo account required.\nRuns stay on your device.',
    emoji: '🚀',
    accent: '#4CAF50',
  },
];

interface Props {
  onFinish: () => void;
}

export function OnboardingScreen({ onFinish }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const isLast = currentIndex === SLIDES.length - 1;

  async function handleEnableLocation() {
    await requestForegroundPermissionsAsync();
    onFinish();
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0a0a0a" />

      {/* Skip button — top right */}
      {!isLast && (
        <TouchableOpacity style={styles.skipButton} onPress={onFinish} activeOpacity={0.6}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      )}

      <FlatList
        ref={flatListRef}
        data={SLIDES}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        onMomentumScrollEnd={(e) => {
          const index = Math.round(e.nativeEvent.contentOffset.x / width);
          setCurrentIndex(index);
        }}
        renderItem={({ item }) => (
          <View style={styles.slide}>
            <View style={[styles.emojiContainer, { borderColor: item.accent + '33' }]}>
              <Text style={styles.emoji}>{item.emoji}</Text>
            </View>
            <Text style={styles.headline}>{item.headline}</Text>
            <Text style={styles.body}>{item.body}</Text>
          </View>
        )}
      />

      {/* Last screen CTA */}
      {isLast && (
        <View style={styles.lastScreenButtons}>
          <TouchableOpacity
            style={styles.enableLocationButton}
            onPress={handleEnableLocation}
            activeOpacity={0.8}
          >
            <Text style={styles.enableLocationText}>Enable Location</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onFinish} activeOpacity={0.6}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Dot indicators */}
      <View style={styles.dots}>
        {SLIDES.map((_, i) => (
          <View
            key={i}
            style={[styles.dot, i === currentIndex && styles.dotActive]}
          />
        ))}
      </View>

      {!isLast && <View style={styles.bottomSpacer} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    alignItems: 'center',
  },
  slide: {
    width,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 36,
    paddingTop: 60,
  },
  emojiContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
    backgroundColor: '#1a1a1a',
  },
  emoji: {
    fontSize: 44,
  },
  headline: {
    fontSize: 32,
    fontWeight: '800',
    color: '#f5f5f5',
    textAlign: 'center',
    lineHeight: 40,
    marginBottom: 24,
    letterSpacing: -0.5,
  },
  body: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
    lineHeight: 26,
  },
  dots: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#333',
  },
  dotActive: {
    width: 20,
    backgroundColor: '#4CAF50',
  },
  skipButton: {
    position: 'absolute',
    top: 56,
    right: 28,
    zIndex: 10,
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  skipText: {
    fontSize: 15,
    color: '#555',
    fontWeight: '500',
  },
  bottomSpacer: {
    height: 80,
  },
  lastScreenButtons: {
    width: '100%',
    alignItems: 'center',
    gap: 16,
  },
  enableLocationButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 16,
    borderRadius: 28,
    alignItems: 'center',
    width: '100%',
  },
  enableLocationText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '800',
  },
});
