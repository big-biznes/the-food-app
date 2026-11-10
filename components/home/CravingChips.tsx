import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors } from '@/constants/theme';
import { font } from '@/constants/type';
import { useThemedStyles } from '@/hooks/useTheme';

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
  const styles = useThemedStyles(makeStyles);

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
            hitSlop={{ top: 5, bottom: 5 }}
            accessibilityRole="button"
            accessibilityLabel={chip}
            accessibilityState={{ selected: on }}
          >
            <Text style={[styles.chipText, on && styles.chipTextOn]}>{chip}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const makeStyles = (c: Colors) =>
  StyleSheet.create({
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    chip: {
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 8,
      backgroundColor: c.surface,
    },
    chipOn: { backgroundColor: c.primary },
    chipText: { fontFamily: font.semibold, fontSize: 15, lineHeight: 19, color: c.text },
    chipTextOn: { color: c.onPrimary },
  });
