import { useMemo, useRef, useState } from 'react';
import { Alert, Image, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { captureRef } from 'react-native-view-shot';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import { MAPBOX_TOKEN } from '../constants';
import { Area, Badge, Coordinate } from '../types';

interface Props {
  visible: boolean;
  onClose: () => void;
  area: Area;
  todayColoredIds: string[];
  coveredKm: number;
  earnedBadge?: Badge | null;
}

const CARD_W = 300;
const CARD_H = Math.round(CARD_W * 16 / 9); // 533
const MAP_H = Math.round(CARD_H * 0.55);    // 293

function sampleCoords(coords: Coordinate[], max = 10): [number, number][] {
  if (coords.length <= max) return coords.map(c => [c.longitude, c.latitude]);
  const step = Math.floor(coords.length / max);
  const pts = coords.filter((_, i) => i % step === 0);
  if (pts[pts.length - 1] !== coords[coords.length - 1]) pts.push(coords[coords.length - 1]);
  return pts.slice(0, max).map(c => [c.longitude, c.latitude]);
}

function buildMapUrl(area: Area, todayIdSet: Set<string>, token: string): string {
  const existingIds = new Set(area.coloredSegmentIds);
  const existingSegs = area.segments
    .filter(s => existingIds.has(s.id) && !todayIdSet.has(s.id) && s.coordinates.length >= 2)
    .slice(0, 60);
  const todaySegs = area.segments
    .filter(s => todayIdSet.has(s.id) && s.coordinates.length >= 2)
    .slice(0, 40);

  const features = [
    ...existingSegs.map(s => ({
      type: 'Feature' as const,
      properties: { stroke: '#4CAF50', 'stroke-width': 3 },
      geometry: { type: 'LineString' as const, coordinates: sampleCoords(s.coordinates) },
    })),
    ...todaySegs.map(s => ({
      type: 'Feature' as const,
      properties: { stroke: '#FF6B6B', 'stroke-width': 4 },
      geometry: { type: 'LineString' as const, coordinates: sampleCoords(s.coordinates) },
    })),
  ];

  if (features.length === 0) return '';

  let geoJSON = JSON.stringify({ type: 'FeatureCollection', features });
  let encoded = encodeURIComponent(geoJSON);

  if (encoded.length > 6500) {
    const half = features.slice(0, Math.ceil(features.length / 2));
    geoJSON = JSON.stringify({ type: 'FeatureCollection', features: half });
    encoded = encodeURIComponent(geoJSON);
  }

  return `https://api.mapbox.com/styles/v1/mapbox/dark-v11/static/geojson(${encoded})/auto/600x330@2x?padding=40&access_token=${token}`;
}

export function ShareCardModal({ visible, onClose, area, todayColoredIds, coveredKm, earnedBadge }: Props) {
  const cardRef = useRef<View>(null);
  const [busy, setBusy] = useState(false);

  const todayIdSet = useMemo(() => new Set(todayColoredIds), [todayColoredIds]);
  const existingSet = useMemo(() => new Set(area.coloredSegmentIds), [area]);

  const totalExplored = useMemo(
    () => new Set([...area.coloredSegmentIds, ...todayColoredIds]).size,
    [area, todayColoredIds],
  );

  const totalSegments = area.segments.length;
  const pct = totalSegments > 0 ? Math.round((totalExplored / totalSegments) * 100) : 0;
  const newToday = useMemo(
    () => todayColoredIds.filter(id => !existingSet.has(id)).length,
    [todayColoredIds, existingSet],
  );
  const existingPct = totalSegments > 0 ? Math.round(((totalExplored - newToday) / totalSegments) * 100) : 0;
  const todayPct = Math.max(pct - existingPct, 0);

  const mapUrl = useMemo(() => buildMapUrl(area, todayIdSet, MAPBOX_TOKEN), [area, todayIdSet]);
  const dateStr = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  async function doCapture(): Promise<string | null> {
    try {
      return await captureRef(cardRef, { format: 'png', quality: 1 });
    } catch {
      Alert.alert('Error', 'Could not capture card.');
      return null;
    }
  }

  async function handleSave() {
    setBusy(true);
    const uri = await doCapture();
    if (!uri) { setBusy(false); return; }
    const { granted } = await MediaLibrary.requestPermissionsAsync();
    if (!granted) {
      Alert.alert('Permission required', 'Please allow access to your photo library.');
      setBusy(false);
      return;
    }
    await MediaLibrary.saveToLibraryAsync(uri);
    Alert.alert('Saved! 🎉', 'Share card saved to your camera roll.');
    setBusy(false);
  }

  async function handleShare() {
    setBusy(true);
    const uri = await doCapture();
    if (!uri) { setBusy(false); return; }
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: 'Share your Roamer run!' });
    }
    setBusy(false);
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose}>
      <View style={styles.screen}>

        <View style={styles.topBar}>
          <Text style={styles.heading}>Share your run</Text>
          <TouchableOpacity onPress={onClose} activeOpacity={0.7} style={styles.closeBtn}>
            <Text style={styles.closeBtnText}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Card preview — only this View is captured */}
        <View style={styles.cardWrapper}>
          <View ref={cardRef} style={styles.card} collapsable={false}>

            {/* Map */}
            <View style={styles.mapWrap}>
              {mapUrl ? (
                <Image source={{ uri: mapUrl }} style={styles.mapImg} resizeMode="cover" />
              ) : (
                <View style={styles.mapImg} />
              )}
              <View style={styles.mapFade} pointerEvents="none" />
              <View style={styles.legend}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendLine, { backgroundColor: '#4CAF50' }]} />
                  <Text style={styles.legendText}>EXPLORED</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendLine, { backgroundColor: '#FF6B6B' }]} />
                  <Text style={styles.legendText}>TODAY</Text>
                </View>
              </View>
            </View>

            {/* Body */}
            <View style={styles.body}>
              <View>
                <Text style={styles.areaLabel}>{area.name.toUpperCase()}</Text>
                <Text style={styles.countText}>{totalExplored} streets{'\n'}explored</Text>

                <View style={styles.progressRow}>
                  <Text style={styles.progressLabel}>{pct}% of area completed</Text>
                  {newToday > 0 && <Text style={styles.newTodayLabel}>+{newToday} new</Text>}
                </View>
                <View style={styles.progressBar}>
                  <View style={{ width: `${existingPct}%`, height: 3, backgroundColor: '#4CAF50' }} />
                  {todayPct > 0 && <View style={{ width: `${todayPct}%`, height: 3, backgroundColor: '#FF6B6B' }} />}
                </View>
                <Text style={styles.dateText}>{coveredKm.toFixed(1)} km today · {dateStr}</Text>
              </View>

              <View style={styles.footer}>
                {earnedBadge && (
                  <View style={styles.badgePill}>
                    <Text style={styles.badgePillText}>{earnedBadge.emoji} {earnedBadge.name}</Text>
                    <Text style={styles.earnedLabel}> EARNED</Text>
                  </View>
                )}
                <Text style={styles.logoText}>ROAMER</Text>
              </View>
            </View>

          </View>
        </View>

        {/* Action buttons */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={busy} activeOpacity={0.8}>
            <Text style={styles.saveBtnText}>💾  Save to Gallery</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.shareBtn} onPress={handleShare} disabled={busy} activeOpacity={0.8}>
            <Text style={styles.shareBtnText}>Share  →</Text>
          </TouchableOpacity>
        </View>

      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#0a0a0b' },
  topBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16,
  },
  heading: { fontSize: 16, fontWeight: '700', color: '#fff' },
  closeBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },
  closeBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  cardWrapper: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  card: {
    width: CARD_W,
    height: CARD_H,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#0a0a0b',
  },
  mapWrap: { height: MAP_H, position: 'relative' },
  mapImg: { width: '100%', height: '100%', backgroundColor: '#111' },
  mapFade: {
    position: 'absolute', bottom: 0, left: 0, right: 0, height: 64,
    backgroundColor: 'rgba(10,10,11,0.88)',
  },
  legend: { position: 'absolute', top: 12, left: 12, flexDirection: 'row', gap: 10 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendLine: { width: 10, height: 2, borderRadius: 1 },
  legendText: { fontSize: 8, fontWeight: '500', letterSpacing: 0.8, color: 'rgba(255,255,255,0.44)' },
  body: { flex: 1, padding: 16, paddingTop: 10, justifyContent: 'space-between' },
  areaLabel: { fontSize: 8.5, fontWeight: '500', letterSpacing: 2.5, color: 'rgba(255,255,255,0.38)', textTransform: 'uppercase' },
  countText: { fontSize: 26, fontWeight: '800', letterSpacing: -0.5, color: '#fff', lineHeight: 29, marginTop: 6 },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  progressLabel: { fontSize: 9, color: 'rgba(255,255,255,0.52)', letterSpacing: 0.2 },
  newTodayLabel: { fontSize: 9, color: '#4CAF50', fontWeight: '600' },
  progressBar: {
    flexDirection: 'row', height: 3,
    backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 2, overflow: 'hidden', marginTop: 5,
  },
  dateText: { fontSize: 9.5, color: 'rgba(255,255,255,0.46)', marginTop: 8 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  badgePill: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,107,107,0.42)', borderRadius: 999,
    paddingVertical: 4, paddingHorizontal: 9,
  },
  badgePillText: { fontSize: 9.5, fontWeight: '600', color: '#FF6B6B' },
  earnedLabel: { fontSize: 8, color: 'rgba(255,255,255,0.34)', letterSpacing: 0.5 },
  logoText: { fontSize: 10, fontWeight: '800', letterSpacing: 3.5, color: '#fff' },
  actions: { paddingHorizontal: 20, paddingBottom: 40, gap: 10 },
  saveBtn: { backgroundColor: '#fff', borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  saveBtnText: { fontSize: 15, fontWeight: '700', color: '#0a0a0b' },
  shareBtn: {
    backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 14, paddingVertical: 14,
    alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)',
  },
  shareBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});
