import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { DISTANCE_OPTIONS, COLOR_NEW } from '../constants';
import { TargetDistance } from '../types';

interface Props {
  selected: TargetDistance;
  onSelect: (distance: TargetDistance) => void;
}

export function DistancePicker({ selected, onSelect }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Target Distance</Text>
      <View style={styles.buttons}>
        {DISTANCE_OPTIONS.map((distance) => (
          <TouchableOpacity
            key={distance}
            style={[styles.button, selected === distance && styles.buttonSelected]}
            onPress={() => onSelect(distance)}
            activeOpacity={0.8}
          >
            <Text style={[styles.buttonText, selected === distance && styles.buttonTextSelected]}>
              {distance}km
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <TouchableOpacity
        style={[styles.button, styles.freeButton, selected === 'free' && styles.freeButtonSelected]}
        onPress={() => onSelect('free')}
        activeOpacity={0.8}
      >
        <Text style={[styles.buttonText, styles.freeButtonText, selected === 'free' && styles.freeButtonTextSelected]}>
          Free Walk
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#444',
  },
  buttons: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#4CAF50',
    backgroundColor: '#fff',
  },
  buttonSelected: {
    backgroundColor: '#4CAF50',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#4CAF50',
  },
  buttonTextSelected: {
    color: '#fff',
  },
  freeButton: {
    borderColor: COLOR_NEW,
  },
  freeButtonSelected: {
    backgroundColor: COLOR_NEW,
  },
  freeButtonText: {
    color: COLOR_NEW,
  },
  freeButtonTextSelected: {
    color: '#fff',
  },
});
