import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { MAPBOX_TOKEN } from '../constants';
import { useSavedPlaces } from '../hooks/useSavedPlaces';
import { Coordinate } from '../types';

interface SearchSuggestion {
  mapbox_id: string;
  name: string;
  place_formatted: string;
  full_address?: string;
}

interface Props {
  userLocation: Coordinate;
  onSelect: (coord: Coordinate, label: string) => void;
  onSavePrompt?: (coord: Coordinate, label: string) => void;
}

export function DestinationPicker({ userLocation, onSelect, onSavePrompt }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchSuggestion[]>([]);
  const [searching, setSearching] = useState(false);
  const [countryCode, setCountryCode] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sessionToken = useRef(`${Math.random().toString(36).slice(2)}-${Date.now()}`);
  const { places, remove } = useSavedPlaces();

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
        const url = `https://api.mapbox.com/search/searchbox/v1/suggest?q=${encodeURIComponent(trimmed)}&language=en&limit=7&proximity=${proximity}${countryParam}&session_token=${sessionToken.current}&access_token=${MAPBOX_TOKEN}`;
        const res = await fetch(url);
        const data = await res.json();
        setResults(data.suggestions ?? []);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 350);

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, userLocation, countryCode]);

  async function handleSuggestionSelect(suggestion: SearchSuggestion) {
    Keyboard.dismiss();
    setQuery('');
    setResults([]);
    try {
      const url = `https://api.mapbox.com/search/searchbox/v1/retrieve/${suggestion.mapbox_id}?session_token=${sessionToken.current}&access_token=${MAPBOX_TOKEN}`;
      const res = await fetch(url);
      const data = await res.json();
      const feature = data.features?.[0];
      if (!feature) return;
      const [longitude, latitude] = feature.geometry.coordinates;
      const label = suggestion.name;
      const coord: Coordinate = { latitude, longitude };
      onSelect(coord, label);
      const alreadySaved = places.some(p => p.coord.latitude === coord.latitude && p.coord.longitude === coord.longitude);
      if (!alreadySaved) onSavePrompt?.(coord, label);
    } catch {}
  }

  function handleConfirmDelete() {
    if (!deleteTarget) return;
    remove(deleteTarget);
    setDeleteTarget(null);
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
          {results.map((item) => (
            <TouchableOpacity
              key={item.mapbox_id}
              style={styles.resultRow}
              onPress={() => handleSuggestionSelect(item)}
              activeOpacity={0.7}
            >
              <Text style={styles.resultText} numberOfLines={1}>{item.name}</Text>
              {item.place_formatted ? (
                <Text style={styles.resultSub} numberOfLines={1}>{item.place_formatted}</Text>
              ) : null}
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Saved places chips */}
      {places.length > 0 && results.length === 0 && (
        <View style={styles.chipsRow}>
          {places.map((p) => (
            <TouchableOpacity
              key={p.label}
              style={styles.chip}
              onPress={() => { onSelect(p.coord, p.label); }}
              onLongPress={() => setDeleteTarget(p.label)}
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

      {/* Delete confirmation popover */}
      <Modal visible={!!deleteTarget} transparent animationType="fade" onRequestClose={() => setDeleteTarget(null)}>
        <Pressable style={styles.overlay} onPress={() => setDeleteTarget(null)}>
          <Pressable style={styles.popover} onPress={() => {}}>
            <Text style={styles.popoverTitle}>Remove "{deleteTarget}"?</Text>
            <Text style={styles.popoverSub}>This place will be removed from your saved list.</Text>
            <View style={styles.popoverActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setDeleteTarget(null)} activeOpacity={0.7}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.removeBtn} onPress={handleConfirmDelete} activeOpacity={0.8}>
                <Text style={styles.removeBtnText}>Remove</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
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
  resultSub: { fontSize: 12, color: '#888', marginTop: 2 },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    backgroundColor: '#F0F0F0',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  chipText: { fontSize: 13, fontWeight: '600', color: '#1A1A1A' },
  hint: { fontSize: 13, color: '#BDBDBD', textAlign: 'center', marginTop: 4 },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  popover: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    gap: 8,
  },
  popoverTitle: { fontSize: 16, fontWeight: '700', color: '#1A1A1A' },
  popoverSub: { fontSize: 13, color: '#888' },
  popoverActions: { flexDirection: 'row', gap: 10, marginTop: 8 },
  cancelBtn: {
    flex: 1,
    backgroundColor: '#F0F0F0',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelBtnText: { fontSize: 14, fontWeight: '600', color: '#1A1A1A' },
  removeBtn: {
    flex: 1,
    backgroundColor: '#FF5252',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  removeBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },
});
