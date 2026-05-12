import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { useLocation } from './src/hooks/useLocation';
import { useRoute } from './src/hooks/useRoute';
import { MapDisplay } from './src/components/MapDisplay';
import { DistancePicker } from './src/components/DistancePicker';
import { RouteInfo } from './src/components/RouteInfo';
import { TargetDistance } from './src/types';

export default function App() {
  const { location, loading: locationLoading, error: locationError } = useLocation();
  const [selectedDistance, setSelectedDistance] = useState<TargetDistance>(5);
  const { route, status, generate } = useRoute(location, selectedDistance);

  const isGenerating = status === 'loading';

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* 지도 영역 */}
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
        {location && <MapDisplay location={location} route={route} />}
      </View>

      {/* 하단 카드 */}
      <View style={styles.card}>
        <Text style={styles.appTitle}>Random Run</Text>

        <DistancePicker
          selected={selectedDistance}
          onSelect={(d) => {
            setSelectedDistance(d);
          }}
        />

        <RouteInfo
          status={status}
          distanceKm={route?.distanceKm ?? null}
          targetKm={selectedDistance}
        />

        {/* 루트 생성 / 재생성 버튼 */}
        <TouchableOpacity
          style={[styles.generateButton, isGenerating && styles.generateButtonDisabled]}
          onPress={generate}
          disabled={isGenerating || !location}
          activeOpacity={0.8}
        >
          {isGenerating ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.generateButtonText}>
              {status === 'success' ? 'Regenerate Route' : 'Generate Route'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
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
    paddingBottom: 36,
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
