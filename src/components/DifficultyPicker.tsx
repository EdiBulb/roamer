import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Difficulty } from '../types';

interface Props {
  selected: Difficulty;
  onSelect: (d: Difficulty) => void;
}

const DIFFICULTIES: Difficulty[] = ['easy', 'normal', 'hard'];

const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  easy:   'Easy',
  normal: 'Normal',
  hard:   'Hard',
};

export function DifficultyPicker({ selected, onSelect }: Props) {
  return (
    <View style={styles.row}>
      {DIFFICULTIES.map((d) => {
        const isSelected = selected === d;
        return (
          <TouchableOpacity
            key={d}
            style={[styles.button, isSelected && styles.buttonActive]}
            onPress={() => onSelect(d)}
            activeOpacity={0.7}
          >
            <Text style={[styles.buttonLabel, isSelected && styles.buttonLabelActive]}>
              {DIFFICULTY_LABEL[d]}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 8,
    width: '100%',
  },
  button: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  buttonActive: {
    backgroundColor: '#4CAF50',
  },
  buttonLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#888',
  },
  buttonLabelActive: {
    color: '#fff',
  },
});
