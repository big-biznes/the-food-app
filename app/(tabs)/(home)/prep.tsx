import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { WeekPart, getWeekStructure } from '@/data/meals';
import type { PrepLine } from '@/data/prep';
import { usePlan } from '@/contexts/PlanContext';
import PressableScale from '@/components/PressableScale';
import { roughMinutes } from '@/components/home/PrepCard';
import { Colors } from '@/constants/theme';
import { font, type } from '@/constants/type';
import { useTheme, useThemedStyles } from '@/hooks/useTheme';
import { usePrepList } from '@/hooks/usePrep';
import { useTranslation } from '@/hooks/useTranslation';
import { prepLineText } from '@/lib/localize';

const SECTIONS: { kind: PrepLine['kind']; title: 'prep.cookAhead' | 'prep.cutStore'; note: 'prep.cookNote' | 'prep.cutNote' }[] = [
  {
    kind: 'cook',
    title: 'prep.cookAhead',
    note: 'prep.cookNote',
  },
  {
    kind: 'cut',
    title: 'prep.cutStore',
    note: 'prep.cutNote',
  },
];

/** The prep list of one part of the week: what can be cut or cooked once, ahead of the cooking days. */
export default function PrepScreen() {
  const { colors: c } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const { t } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams<{ part: string }>();
  const part: WeekPart = params.part === 'B' || params.part === 'C' ? params.part : 'A';
  const { savedPlan, setPrepped } = usePlan();
  const { lines, minutes, saves, done } = usePrepList(part);
  const days = getWeekStructure(savedPlan?.eatingOutDay ?? 'Sun').partLabel[part];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <PressableScale
        style={styles.backBtn}
        onPress={() => router.back()}
        activeOpacity={0.7}
        scaleTo={0.9}
        accessibilityRole="button"
        accessibilityLabel={t('common.back')}
      >
        <Ionicons name="chevron-back" size={22} color={c.text} />
      </PressableScale>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.kicker}>{days}</Text>
        <Text style={styles.title} accessibilityRole="header">
          {t('prep.title')}
        </Text>
        <Text style={styles.intro}>
          {t('prep.intro')}
        </Text>

        {lines.length === 0 ? (
          <Text style={styles.empty}>{t('prep.nothing')}</Text>
        ) : (
          <View style={styles.summary}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{t('common.minutes', { count: roughMinutes(minutes) })}</Text>
              <Text style={styles.summaryLabel}>{t('prep.now')}</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{t('common.minutes', { count: roughMinutes(saves) })}</Text>
              <Text style={styles.summaryLabel}>{t('prep.later')}</Text>
            </View>
          </View>
        )}

        {SECTIONS.map(section => {
          const jobs = lines.filter(l => l.kind === section.kind);
          if (jobs.length === 0) return null;
          return (
            <View key={section.kind} style={styles.section}>
              <Text style={styles.sectionTitle} accessibilityRole="header">
                {t(section.title)}
              </Text>
              <View style={styles.list}>
                {jobs.map((job, i) => {
                  const checked = done.includes(job.key);
                  return (
                    <PressableScale
                      key={job.key}
                      style={[styles.row, i > 0 && styles.rowBorder]}
                      onPress={() => setPrepped(part, job.keys, !checked)}
                      activeOpacity={0.7}
                      scaleTo={1}
                      accessibilityRole="checkbox"
                      accessibilityLabel={t('prep.for', { job: prepLineText(job), meals: job.meals.join(', ') })}
                      accessibilityState={{ checked }}
                    >
                      <View style={[styles.checkbox, checked && styles.checkboxOn]}>
                        {checked && <Ionicons name="checkmark" size={16} color={c.onPrimary} />}
                      </View>
                      <View style={styles.rowText}>
                        <Text style={[styles.rowLabel, checked && styles.rowLabelDone]}>{prepLineText(job)}</Text>
                        <Text style={styles.rowMeals}>{job.meals.join(' · ')}</Text>
                      </View>
                    </PressableScale>
                  );
                })}
              </View>
              <Text style={styles.note}>{t(section.note)}</Text>
            </View>
          );
        })}

        {lines.length > 0 && (
          <Text style={styles.note}>
            {t('prep.tickNote')}
          </Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (c: Colors) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: c.bg },
    backBtn: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: c.surface,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 12,
      marginLeft: 20,
      marginBottom: 4,
    },
    scroll: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 56 },
    kicker: { ...type.label, fontSize: 15, lineHeight: 20, color: c.textMuted },
    title: { ...type.display, color: c.text, marginTop: 4 },
    intro: { ...type.body, fontSize: 15, lineHeight: 22, color: c.textSecondary, marginTop: 12 },
    empty: { ...type.body, color: c.textMuted, marginTop: 28 },

    summary: {
      flexDirection: 'row',
      backgroundColor: c.butter,
      borderRadius: 16,
      paddingVertical: 16,
      marginTop: 20,
    },
    summaryItem: { flex: 1, alignItems: 'center', gap: 2 },
    summaryDivider: { width: 1, backgroundColor: c.onTileWash, marginVertical: 2 },
    summaryValue: { fontFamily: font.extrabold, fontSize: 22, lineHeight: 26, letterSpacing: -0.4, color: c.onTile },
    summaryLabel: { fontFamily: font.medium, fontSize: 13, lineHeight: 17, color: c.onTileMuted },

    section: { marginTop: 28 },
    sectionTitle: { ...type.heading, fontSize: 18, color: c.text, marginBottom: 12 },
    list: { backgroundColor: c.surface, borderRadius: 20, paddingHorizontal: 16 },
    row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, minHeight: 56 },
    rowBorder: { borderTopWidth: 1, borderTopColor: c.border },
    checkbox: {
      width: 24,
      height: 24,
      borderRadius: 8,
      borderWidth: 2,
      borderColor: c.surfaceStrong,
      alignItems: 'center',
      justifyContent: 'center',
    },
    checkboxOn: { backgroundColor: c.primary, borderColor: c.primary },
    rowText: { flex: 1, gap: 2 },
    rowLabel: { fontFamily: font.semibold, fontSize: 15, lineHeight: 20, color: c.text },
    rowLabelDone: { color: c.textMuted, textDecorationLine: 'line-through' },
    rowMeals: { fontFamily: font.regular, fontSize: 13, lineHeight: 18, color: c.textMuted },
    note: { fontFamily: font.regular, fontSize: 13, lineHeight: 18, color: c.textMuted, marginTop: 12, paddingHorizontal: 4 },
  });
