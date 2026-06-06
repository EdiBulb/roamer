import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { RouteMode } from '../types';

interface Props {
  selected: RouteMode;
  onSelect: (mode: RouteMode) => void;
}

export function ModePicker({ selected, onSelect }: Props) {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.tab, selected === 'loop' && styles.tabActive]}
        onPress={() => onSelect('loop')}
        activeOpacity={0.7}
      >
        <Text style={[styles.tabText, selected === 'loop' && styles.tabTextActive]}>
          🔄  Loop
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.tab, selected === 'destination' && styles.tabActive]}
        onPress={() => onSelect('destination')}
        activeOpacity={0.7}
      >
        <Text style={[styles.tabText, selected === 'destination' && styles.tabTextActive]}>
          📍  Destination
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#F0F0F0',
    borderRadius: 12,
    padding: 4,
    width: '100%',
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#999',
  },
  tabTextActive: {
    color: '#1A1A1A',
  },
});
