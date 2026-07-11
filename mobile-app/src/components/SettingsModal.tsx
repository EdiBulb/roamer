import { Modal, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { AppSettings, AnnounceDistance, Units, VoiceFrequency } from '../hooks/useSettings';

interface Props {
  visible: boolean;
  settings: AppSettings;
  onUpdate: (patch: Partial<AppSettings>) => void;
  onClose: () => void;
}

function SectionTitle({ label }: { label: string }) {
  return <Text style={styles.sectionTitle}>{label}</Text>;
}

function SegmentedControl<T extends string | number>({
  options,
  value,
  onChange,
  labels,
}: {
  options: T[];
  value: T;
  onChange: (v: T) => void;
  labels?: string[];
}) {
  return (
    <View style={styles.segmented}>
      {options.map((opt, i) => (
        <TouchableOpacity
          key={String(opt)}
          style={[styles.segmentBtn, value === opt && styles.segmentBtnActive]}
          onPress={() => onChange(opt)}
          activeOpacity={0.7}
        >
          <Text style={[styles.segmentText, value === opt && styles.segmentTextActive]}>
            {labels ? labels[i] : String(opt)}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

export function SettingsModal({ visible, settings, onUpdate, onClose }: Props) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
      <View style={styles.sheet}>
        <View style={styles.handle} />
        <Text style={styles.title}>Settings</Text>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>

          {/* ── Voice ── */}
          <SectionTitle label="🔊  Voice" />

          <View style={styles.row}>
            <Text style={styles.rowLabel}>Voice guidance</Text>
            <Switch
              value={settings.voiceEnabled}
              onValueChange={(v) => onUpdate({ voiceEnabled: v })}
              trackColor={{ true: '#4CAF50' }}
              thumbColor="#fff"
            />
          </View>

          {settings.voiceEnabled && (
            <>
              <Text style={styles.rowLabel}>Frequency</Text>
              <SegmentedControl<VoiceFrequency>
                options={['minimal', 'normal', 'chatty']}
                value={settings.voiceFrequency}
                onChange={(v) => onUpdate({ voiceFrequency: v })}
                labels={['Minimal', 'Normal', 'Chatty']}
              />
              <Text style={styles.hint}>
                {settings.voiceFrequency === 'minimal' && 'Turn instructions + off-route alerts'}
                {settings.voiceFrequency === 'normal' && 'Turns + waypoint arrivals'}
                {settings.voiceFrequency === 'chatty' && 'Turns + waypoints + km milestones'}
              </Text>

              <Text style={styles.rowLabel}>Announce turns</Text>
              <SegmentedControl<AnnounceDistance>
                options={[30, 50, 100]}
                value={settings.announceDistanceM}
                onChange={(v) => onUpdate({ announceDistanceM: v })}
                labels={['30m', '50m', '100m']}
              />
            </>
          )}

          {/* ── General ── */}
          <SectionTitle label="⚙️  General" />

          <Text style={styles.rowLabel}>Units</Text>
          <SegmentedControl<Units>
            options={['km', 'miles']}
            value={settings.units}
            onChange={(v) => onUpdate({ units: v })}
            labels={['km', 'miles']}
          />

        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    paddingHorizontal: 24,
    paddingBottom: 48,
    maxHeight: '75%',
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E0E0E0',
    alignSelf: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  content: {
    gap: 12,
    paddingBottom: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#888',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginTop: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowLabel: {
    fontSize: 15,
    color: '#1A1A1A',
    fontWeight: '500',
  },
  segmented: {
    flexDirection: 'row',
    backgroundColor: '#F0F0F0',
    borderRadius: 10,
    padding: 3,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  segmentBtnActive: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  segmentText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#999',
  },
  segmentTextActive: {
    color: '#1A1A1A',
  },
  hint: {
    fontSize: 12,
    color: '#BDBDBD',
    marginTop: -4,
  },
});
