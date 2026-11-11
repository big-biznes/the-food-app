import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { Colors } from '@/constants/theme';
import { font } from '@/constants/type';
import { useThemedStyles } from '@/hooks/useTheme';
import { COUNTRIES, Country, chainsIn } from '@/data/stores';

/** Country and store-chain choice, saved on the profile. Used in Settings and on the compare screen. */
export default function StorePicker() {
  const styles = useThemedStyles(makeStyles);
  const { user, updateProfile } = useAuth();
  const country = user?.country;
  const stores = user?.stores ?? [];
  const chains = country ? chainsIn(country) : [];

  function pickCountry(next: Country) {
    if (next === country) return;
    // Start with every chain on; unticking is quicker than ticking.
    updateProfile({ country: next, stores: chainsIn(next).map(c => c.id) });
  }

  function toggleStore(id: string) {
    updateProfile({ stores: stores.includes(id) ? stores.filter(s => s !== id) : [...stores, id] });
  }

  return (
    <View>
      <Text style={styles.label}>Country</Text>
      <View style={styles.chipRow}>
        {COUNTRIES.map(opt => (
          <Chip key={opt.value} label={opt.label} selected={country === opt.value} onPress={() => pickCountry(opt.value)} />
        ))}
      </View>

      {country && (
        <>
          <Text style={[styles.label, styles.labelGap]}>Stores you shop at</Text>
          {chains.length > 0 ? (
            <View style={styles.chipRow}>
              {chains.map(ch => (
                <Chip key={ch.id} label={ch.name} selected={stores.includes(ch.id)} onPress={() => toggleStore(ch.id)} />
              ))}
            </View>
          ) : (
            <Text style={styles.hint}>No store prices are available for this country yet.</Text>
          )}
        </>
      )}
    </View>
  );
}

function Chip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  const styles = useThemedStyles(makeStyles);
  return (
    <TouchableOpacity
      style={[styles.chip, selected && styles.chipOn]}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
    >
      <Text style={[styles.chipLabel, selected && styles.chipLabelOn]}>{label}</Text>
    </TouchableOpacity>
  );
}

const makeStyles = (c: Colors) =>
  StyleSheet.create({
    label: { fontSize: 15, fontFamily: font.medium, fontWeight: '500', color: c.text },
    labelGap: { marginTop: 16 },
    hint: { fontSize: 13, fontFamily: font.regular, color: c.textMuted, marginTop: 8 },
    chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10, marginBottom: 4 },
    chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 100, backgroundColor: c.surfaceAlt },
    chipOn: { backgroundColor: c.primary },
    chipLabel: { fontSize: 13, fontFamily: font.medium, fontWeight: '500', color: c.text },
    chipLabelOn: { color: c.onPrimary },
  });
