import { StyleSheet, Text, View } from 'react-native';
import { Href, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import type { WeekPart } from '@/data/meals';
import PressableScale from '@/components/PressableScale';
import { Colors } from '@/constants/theme';
import { font } from '@/constants/type';
import { useTheme, useThemedStyles } from '@/hooks/useTheme';
import { usePrepList } from '@/hooks/usePrep';

/** Rounded to 5 so an estimate does not read as a measurement. */
export const roughMinutes = (minutes: number) => Math.max(5, Math.round(minutes / 5) * 5);

/**
 * The offer to prepare ahead for a part of the week: opens the prep list.
 * An invitation, not a step of the plan; nothing shows when the part has nothing to prepare.
 */
export default function PrepCard({ part }: { part: WeekPart }) {
  const { colors: c } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const router = useRouter();
  const { lines, minutes, saves, done } = usePrepList(part);
  if (lines.length === 0) return null;

  const finished = done.length === lines.length;
  const title = finished ? 'Prepped' : 'Prep ahead';
  const detail = finished
    ? `Your meals are about ${roughMinutes(saves)} min quicker`
    : done.length > 0
      ? `${done.length} of ${lines.length} done`
      : `${roughMinutes(minutes)} min now, about ${roughMinutes(saves)} min less cooking later`;

  return (
    <PressableScale
      style={styles.card}
      scaleTo={0.98}
      onPress={() => router.push({ pathname: '/prep', params: { part } } as unknown as Href)}
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${detail}`}
      accessibilityHint="Opens the prep list for these days"
    >
      <View style={[styles.icon, finished && styles.iconDone]}>
        <Ionicons name={finished ? 'checkmark' : 'cut'} size={18} color={finished ? c.onPrimary : c.text} />
      </View>
      <View style={styles.text}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.detail} numberOfLines={2}>
          {detail}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={c.textFaint} />
    </PressableScale>
  );
}

const makeStyles = (c: Colors) =>
  StyleSheet.create({
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      backgroundColor: c.surface,
      borderRadius: 16,
      paddingVertical: 12,
      paddingLeft: 12,
      paddingRight: 14,
      marginBottom: 16,
    },
    icon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: c.surfaceAlt,
      alignItems: 'center',
      justifyContent: 'center',
    },
    iconDone: { backgroundColor: c.primary },
    text: { flex: 1, gap: 2 },
    title: { fontFamily: font.bold, fontSize: 15, lineHeight: 19, color: c.text },
    detail: { fontFamily: font.regular, fontSize: 13, lineHeight: 17, color: c.textMuted },
  });
