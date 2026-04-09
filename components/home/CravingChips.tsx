import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export const CRAVING_CHIPS = [
  'Spicy', 'Light', 'Hearty', 'Fresh',
  'Asian', 'Italian', 'Mediterranean', 'Mexican',
  'Comfort', 'Quick',
] as const;

type Props = {
  selected: string[];
  onToggle: (chip: string) => void;
};

export default function CravingChips({ selected, onToggle }: Props) {
  return (
    <View style={styles.grid}>
      {CRAVING_CHIPS.map(chip => {
        const on = selected.includes(chip);
        return (
          <TouchableOpacity
            key={chip}
            style={[styles.chip, on && styles.chipOn]}
            onPress={() => onToggle(chip)}
            activeOpacity={0.7}
          >
            <Text style={[styles.chipText, on && styles.chipTextOn]}>{chip}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chip: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 100,
    backgroundColor: '#F5F5F5',
  },
  chipOn: { backgroundColor: '#111111' },
  chipText: { fontSize: 14, fontWeight: '500', color: '#111111' },
  chipTextOn: { color: '#FFFFFF' },
});
