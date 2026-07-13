import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { MAPBOX_TOKEN } from '../constants';
import { useSavedPlaces } from '../hooks/useSavedPlaces';
import { Coordinate } from '../types';

interface GeocodingFeature {
  id: string;
  place_name: string;
  center: [number, number];
}

interface Props {
  userLocation: Coordinate;
  onSelect: (coord: Coordinate, label: string) => void;
  onSavePrompt?: (coord: Coordinate, label: string) => void;
}

export function DestinationPicker({ userLocation, onSelect, onSavePrompt }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GeocodingFeature[]>([]);
  const [searching, setSearching] = useState(false);
  const [countryCode, setCountryCode] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { places, remove } = useSavedPlaces();

  // Reverse geocode once to get user's country code for search restriction
  useEffect(() => {
    async function fetchCountry() {
      try {
        const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${userLocation.longitude},${userLocation.latitude}.json?types=country&access_token=${MAPBOX_TOKEN}`;
        const res = await fetch(url);
        const data = await res.json();
        const code: string | undefined = data.features?.[0]?.properties?.short_code;
        if (code) setCountryCode(code);
      } catch {}
    }
    fetchCountry();
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const trimmed = query.trim();
    if (trimmed.length < 2) { setResults([]); return; }

    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const proximity = `${userLocation.longitude},${userLocation.latitude}`;
        const countryParam = countryCode ? `&country=${countryCode}` : '';
        const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(trimmed)}.json?proximity=${proximity}&types=place,address,poi&limit=5${countryParam}&access_token=${MAPBOX_TOKEN}`;
        const res = await fetch(url);
        const data = await res.json();
        setResults(data.features ?? []);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 350);

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, userLocation, countryCode]);

  function handleSelect(coord: Coordinate, label: string) {
    Keyboard.dismiss();
    setQuery('');
    setResults([]);
    onSelect(coord, label);
    const alreadySaved = places.some(p => p.coord.latitude === coord.latitude && p.coord.longitude === coord.longitude);
    if (!alreadySaved) onSavePrompt?.(coord, label);
  }

  function handleSavedPlacePress(coord: Coordinate, label: string) {
    onSelect(coord, label);
  }

  function handleLongPressSaved(label: string) {
    Alert.alert(label, 'Remove this saved place?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => remove(label) },
    ]);
  }

  return (
    <View style={styles.container}>
      {/* Search bar */}
      <View style={styles.searchRow}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.input}
          placeholder="Search destination..."
          placeholderTextColor="#BDBDBD"
          value={query}
          onChangeText={setQuery}
          autoCorrect={false}
          returnKeyType="search"
        />
        {searching && <ActivityIndicator size="small" color="#4CAF50" style={styles.spinner} />}
        {query.length > 0 && !searching && (
          <TouchableOpacity onPress={() => { setQuery(''); setResults([]); }}>
            <Text style={styles.clearBtn}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Autocomplete results */}
      {results.length > 0 && (
        <View style={styles.resultsList}>
          {results.map((item) => {
            const coord: Coordinate = { latitude: item.center[1], longitude: item.center[0] };
            return (
              <TouchableOpacity
                key={item.id}
                style={styles.resultRow}
                onPress={() => handleSelect(coord, item.place_name)}
                activeOpacity={0.7}
              >
                <Text style={styles.resultText} numberOfLines={1}>{item.place_name}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}


{/* Saved places chips */}
      {places.length > 0 && results.length === 0 && (
        <View style={styles.chipsRow}>
          {places.map((p) => (
            <TouchableOpacity
              key={p.label}
              style={styles.chip}
              onPress={() => handleSavedPlacePress(p.coord, p.label)}
              onLongPress={() => handleLongPressSaved(p.label)}
              activeOpacity={0.7}
            >
              <Text style={styles.chipText}>{p.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Tap hint */}
      {results.length === 0 && (
        <Text style={styles.hint}>— or tap the map —</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%', gap: 10 },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  searchIcon: { fontSize: 16 },
  input: { flex: 1, fontSize: 15, color: '#1A1A1A' },
  spinner: { marginLeft: 4 },
  clearBtn: { fontSize: 14, color: '#BDBDBD', paddingHorizontal: 4 },
  resultsList: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    overflow: 'hidden',
  },
  resultRow: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  resultText: { fontSize: 14, color: '#1A1A1A' },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    backgroundColor: '#F0F0F0',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  chipText: { fontSize: 13, fontWeight: '600', color: '#1A1A1A' },
  hint: { fontSize: 13, color: '#BDBDBD', textAlign: 'center', marginTop: 4 },
});
