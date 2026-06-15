import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
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
}

export function DestinationPicker({ userLocation, onSelect }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GeocodingFeature[]>([]);
  const [searching, setSearching] = useState(false);
  const [savingFor, setSavingFor] = useState<{ coord: Coordinate; label: string } | null>(null);
  const [saveInput, setSaveInput] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { places, add, remove } = useSavedPlaces();

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const trimmed = query.trim();
    if (trimmed.length < 2) { setResults([]); return; }

    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const proximity = `${userLocation.longitude},${userLocation.latitude}`;
        const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(trimmed)}.json?proximity=${proximity}&types=place,address,poi&limit=5&access_token=${MAPBOX_TOKEN}`;
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
  }, [query, userLocation]);

  function handleSelect(coord: Coordinate, label: string) {
    Keyboard.dismiss();
    setQuery('');
    setResults([]);
    onSelect(coord, label);
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

  function promptSave(coord: Coordinate, label: string) {
    setSavingFor({ coord, label });
    setSaveInput(label.length <= 12 ? label : '');
  }

  async function confirmSave() {
    if (!savingFor || !saveInput.trim()) return;
    await add(saveInput.trim(), savingFor.coord);
    setSavingFor(null);
    setSaveInput('');
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
              <View key={item.id} style={styles.resultRow}>
                <TouchableOpacity
                  style={styles.resultMain}
                  onPress={() => handleSelect(coord, item.place_name)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.resultText} numberOfLines={1}>{item.place_name}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.saveBtn}
                  onPress={() => promptSave(coord, item.place_name)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.saveBtnText}>＋</Text>
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
      )}

      {/* Save label input */}
      {savingFor && (
        <View style={styles.saveLabelRow}>
          <TextInput
            style={styles.saveLabelInput}
            value={saveInput}
            onChangeText={setSaveInput}
            placeholder="Label (e.g. Home)"
            placeholderTextColor="#BDBDBD"
            autoFocus
            maxLength={20}
            returnKeyType="done"
            onSubmitEditing={confirmSave}
          />
          <TouchableOpacity style={styles.saveLabelConfirm} onPress={confirmSave} activeOpacity={0.8}>
            <Text style={styles.saveLabelConfirmText}>Save</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.saveLabelCancel} onPress={() => setSavingFor(null)}>
            <Text style={styles.saveLabelCancelText}>✕</Text>
          </TouchableOpacity>
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
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  resultMain: { flex: 1, paddingVertical: 12, paddingHorizontal: 14 },
  resultText: { fontSize: 14, color: '#1A1A1A' },
  saveBtn: { paddingHorizontal: 14, paddingVertical: 12 },
  saveBtnText: { fontSize: 18, color: '#4CAF50', fontWeight: '700' },
  saveLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  saveLabelInput: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    paddingVertical: 9,
    paddingHorizontal: 12,
    fontSize: 14,
    color: '#1A1A1A',
  },
  saveLabelConfirm: {
    backgroundColor: '#4CAF50',
    borderRadius: 10,
    paddingVertical: 9,
    paddingHorizontal: 14,
  },
  saveLabelConfirmText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  saveLabelCancel: { paddingHorizontal: 4 },
  saveLabelCancelText: { fontSize: 16, color: '#BDBDBD' },
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
