import { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  Switch,
} from 'react-native';
import PressableScale from '@/components/PressableScale';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Href, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth, Activity, DietaryRestriction, Goal, MacroBalance } from '@/contexts/AuthContext';
import { BODY_LIMITS } from '@/data/portions';
import { NO_EATING_OUT } from '@/data/meals';
import { allowReminders } from '@/lib/reminders';
import { useTargets } from '@/hooks/usePortions';
import { Colors } from '@/constants/theme';
import StorePicker from '@/components/shopping/StorePicker';
import { useTheme, useThemedStyles } from '@/hooks/useTheme';
import ConfirmSheet from '@/components/ConfirmSheet';
import PlanIntroSheet from '@/components/home/PlanIntroSheet';
import LanguagePicker from '@/components/LanguagePicker';
import { LANGUAGES } from '@/lib/i18n';
import { useTranslation } from '@/hooks/useTranslation';
import { usePlan } from '@/contexts/PlanContext';

import { font, type } from '@/constants/type';
const DAYS_OF_WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;

const GOALS: Goal[] = ['lose', 'maintain', 'gain'];
const ACTIVITIES: Activity[] = ['low', 'light', 'active', 'very'];
const MACROS: MacroBalance[] = ['balanced', 'low-carb', 'high-protein'];
const RESTRICTIONS: DietaryRestriction[] = ['vegetarian', 'vegan', 'gluten-free', 'dairy-free', 'nut-allergy', 'halal', 'kosher'];

export default function SettingsScreen() {
  const { colors: c } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const { user, logout, updateProfile, deleteAccount } = useAuth();
  const router = useRouter();
  const [confirm, setConfirm] = useState<'logout' | 'delete' | null>(null);
  const { savedPlan } = usePlan();
  const { t, i18n } = useTranslation();
  const [showIntro, setShowIntro] = useState(false);

  // Plan settings
  const [goal, setGoal] = useState<Goal>(user?.goal ?? 'maintain');
  const targets = useTargets();

  const [eatingOutDay, setEatingOutDay] = useState<string>(user?.eatingOutDay ?? 'Fri');

  // Account settings
  const [restrictions, setRestrictions] = useState<DietaryRestriction[]>(
    user?.restrictions ?? [],
  );

  // Application settings
  // Set when the phone refused permission for notifications.
  const [remindersBlocked, setRemindersBlocked] = useState(false);

  async function toggleReminders(on: boolean) {
    setRemindersBlocked(false);
    // Shown as on straight away; taken back if the phone says no.
    updateProfile({ notifications: on });
    if (on && !(await allowReminders())) {
      updateProfile({ notifications: false });
      setRemindersBlocked(true);
    }
  }

  function toggleRestriction(r: DietaryRestriction) {
    const next = restrictions.includes(r) ? restrictions.filter(x => x !== r) : [...restrictions, r];
    setRestrictions(next);
    // Saved straight away, like the eating-out day: plans and Discover read it from the profile.
    updateProfile({ restrictions: next });
  }

  function handleDeleteAccount() {
    setConfirm('delete');
  }

  function handleLogout() {
    setConfirm('logout');
  }

  async function confirmLogout() {
    await logout();
    router.replace('/(auth)');
  }

  async function confirmDelete() {
    const error = await deleteAccount();
    if (error) return error;
    router.replace('/(auth)');
    return null;
  }

  const initials = user?.name
    ? user.name
        .split(' ')
        .map(w => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '?';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{t('settings.title')}</Text>
        </View>

        {/* User card */}
        <View style={styles.userCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user?.name ?? t('settings.guest')}</Text>
            <Text style={styles.userEmail}>{user?.email ?? ''}</Text>
          </View>
        </View>

        {/* ── About you ─────────────────────────────────────────────── */}
        <SectionHeader label={t('settings.aboutYou')} />
        <View style={styles.section}>
          <NumberRow
            label={t('settings.age')}
            value={user?.age}
            unit={t('settings.years')}
            limits={BODY_LIMITS.age}
            onChange={age => updateProfile({ age })}
          />
          <Divider />
          <NumberRow
            label={t('settings.height')}
            value={user?.heightCm}
            unit="cm"
            limits={BODY_LIMITS.heightCm}
            onChange={heightCm => updateProfile({ heightCm })}
          />
          <Divider />
          <NumberRow
            label={t('settings.weight')}
            value={user?.weightKg}
            unit="kg"
            limits={BODY_LIMITS.weightKg}
            onChange={weightKg => updateProfile({ weightKg })}
          />
          <Text style={styles.sectionNote}>
            {t('settings.bodyNote')}
          </Text>
        </View>

        {/* ── Plan Settings ─────────────────────────────────────────── */}
        <SectionHeader label={t('settings.plan')} />
        <View style={styles.section}>
          <RowLabel
            label={t('settings.weightGoal')}
            hint={targets ? t('settings.weightGoalHint', { kcal: targets.kcal.toLocaleString(i18n.language) }) : undefined}
          />
          <View style={styles.chipRow}>
            {GOALS.map(value => (
              <Chip
                key={value}
                label={t(`goal.${value}`)}
                selected={goal === value}
                onPress={() => {
                  setGoal(value);
                  updateProfile({ goal: value });
                }}
              />
            ))}
          </View>

          <Divider />

          <RowLabel label={t('settings.activityLevel')} hint={t('settings.activityHint')} />
          <View style={styles.chipRow}>
            {ACTIVITIES.map(value => (
              <Chip
                key={value}
                label={t(`activity.${value}`)}
                selected={(user?.activity ?? 'light') === value}
                onPress={() => updateProfile({ activity: value })}
              />
            ))}
          </View>

          <Divider />

          <RowLabel label={t('settings.eatingOutDay')} hint={t('settings.eatingOutHint')} />
          <View style={styles.chipRow}>
            {DAYS_OF_WEEK.map(d => (
              <Chip
                key={d}
                label={t(`daysShort.${d}`)}
                selected={eatingOutDay === d}
                onPress={() => {
                  setEatingOutDay(d);
                  updateProfile({ eatingOutDay: d });
                }}
              />
            ))}
            <Chip
              label={t('settings.noEatingOut')}
              selected={eatingOutDay === NO_EATING_OUT}
              onPress={() => {
                setEatingOutDay(NO_EATING_OUT);
                updateProfile({ eatingOutDay: NO_EATING_OUT });
              }}
            />
          </View>

          <Divider />

          <View style={styles.switchRow}>
            <View style={styles.switchText}>
              <Text style={styles.rowLabel}>{t('settings.snack')}</Text>
              <Text style={styles.rowHint}>{t('settings.snackHint')}</Text>
            </View>
            <Switch
              value={Boolean(user?.snacks)}
              onValueChange={snacks => updateProfile({ snacks })}
              trackColor={{ false: c.border, true: c.primary }}
              thumbColor={c.bg}
              accessibilityLabel={t('settings.snack')}
            />
          </View>

          <Divider />

          <RowLabel label={t('settings.macroBalance')} hint={t('settings.macroHint')} />
          <View style={styles.chipRow}>
            {MACROS.map(value => (
              <Chip
                key={value}
                label={t(`macro.${value}`)}
                selected={(user?.macroBalance ?? 'balanced') === value}
                onPress={() => updateProfile({ macroBalance: value })}
              />
            ))}
          </View>
        </View>

        {/* ── Account Settings ──────────────────────────────────────── */}
        <SectionHeader label={t('settings.account')} />
        <View style={styles.section}>
          <RowLabel
            label={t('settings.preferences')}
            hint={t('settings.preferencesHint')}
          />
          <View style={styles.chipRow}>
            {RESTRICTIONS.map(value => (
              <Chip
                key={value}
                label={t(`diet.${value}`)}
                selected={restrictions.includes(value)}
                onPress={() => toggleRestriction(value)}
              />
            ))}
          </View>
        </View>

        {/* ── Stores ────────────────────────────────────────────────── */}
        <SectionHeader label={t('settings.stores')} />
        <View style={styles.section}>
          <StorePicker />
        </View>

        {/* ── Application Settings ──────────────────────────────────── */}
        <SectionHeader label={t('settings.application')} />
        <View style={styles.section}>
          {LANGUAGES.length > 1 && (
            <>
              <RowLabel label={t('language.label')} />
              <LanguagePicker />
              <Divider />
            </>
          )}
          <View style={styles.switchRow}>
            <View style={styles.switchText}>
              <Text style={styles.rowLabel}>{t('settings.reminders')}</Text>
              <Text style={styles.rowHint}>{t('settings.remindersHint')}</Text>
            </View>
            <Switch
              value={Boolean(user?.notifications)}
              onValueChange={toggleReminders}
              trackColor={{ false: c.border, true: c.primary }}
              thumbColor={c.bg}
              accessibilityLabel={t('settings.reminders')}
            />
          </View>
          {remindersBlocked && (
            <Text style={styles.fieldError} accessibilityRole="alert">
              {t('settings.remindersBlocked')}
            </Text>
          )}
        </View>

        {/* ── App Information ───────────────────────────────────────── */}
        <SectionHeader label={t('settings.appInfo')} />
        <View style={styles.section}>
          {/* Told with the person's own plan, so only once there is one. */}
          {savedPlan?.plan && (
            <>
              <LinkRow label={t('intro.settingsRow')} onPress={() => setShowIntro(true)} />
              <Divider />
            </>
          )}
          <LinkRow
            label={t('settings.terms')}
            onPress={() => router.push('/legal/terms' as Href)}
          />
          <Divider />
          <LinkRow
            label={t('settings.privacy')}
            onPress={() => router.push('/legal/privacy' as Href)}
          />
          <Divider />
          <PressableScale
            style={styles.destructiveRow}
            onPress={handleDeleteAccount}
            activeOpacity={0.7}
          >
            <Text style={styles.destructiveText}>{t('settings.deleteAccount')}</Text>
          </PressableScale>
        </View>

        {/* ── Log out ───────────────────────────────────────────────── */}
        <PressableScale
          style={styles.logoutBtn}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <Text style={styles.logoutText}>{t('settings.logout')}</Text>
        </PressableScale>
      </ScrollView>

      <PlanIntroSheet visible={showIntro} onClose={() => setShowIntro(false)} />
      <ConfirmSheet
        visible={confirm === 'logout'}
        title={t('settings.logoutTitle')}
        message={t('settings.logoutMessage')}
        confirmLabel={t('settings.logout')}
        onConfirm={confirmLogout}
        onClose={() => setConfirm(null)}
      />
      <ConfirmSheet
        visible={confirm === 'delete'}
        title={t('settings.deleteTitle')}
        message={t('settings.deleteMessage')}
        confirmLabel={t('settings.deleteAccount')}
        destructive
        onConfirm={confirmDelete}
        onClose={() => setConfirm(null)}
      />
    </SafeAreaView>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SectionHeader({ label }: { label: string }) {
  const sectionStyles = useThemedStyles(makeSectionStyles);
  return <Text style={sectionStyles.header}>{label}</Text>;
}

function RowLabel({ label, hint }: { label: string; hint?: string }) {
  const sectionStyles = useThemedStyles(makeSectionStyles);
  return (
    <View style={sectionStyles.rowLabelWrapper}>
      <Text style={sectionStyles.rowLabel}>{label}</Text>
      {hint && <Text style={sectionStyles.rowHint}>{hint}</Text>}
    </View>
  );
}

type Limits = { min: number; max: number };

/** A whole number typed in place. Saved when the field is left; a value outside the limits is put back. */
function NumberInput({
  value,
  limits,
  label,
  onChange,
  onError,
}: {
  value: number | undefined;
  limits: Limits;
  label: string;
  onChange: (n: number) => void;
  onError: (message: string | null) => void;
}) {
  const { colors: c } = useTheme();
  const { t } = useTranslation();
  const fieldStyles = useThemedStyles(makeFieldStyles);
  const shown = value != null ? String(value) : '';
  const [text, setText] = useState(shown);
  // Follow the profile when it changes elsewhere (another device).
  useEffect(() => setText(shown), [shown]);

  function commit() {
    const n = Number(text.trim());
    if (text.trim() === '' || !Number.isInteger(n) || n < limits.min || n > limits.max) {
      setText(shown);
      onError(t('settings.wholeNumber', { min: limits.min, max: limits.max }));
      return;
    }
    onError(null);
    if (n !== value) onChange(n);
  }

  return (
    <TextInput
      style={fieldStyles.input}
      value={text}
      onChangeText={t => setText(t.replace(/[^0-9]/g, ''))}
      onEndEditing={commit}
      keyboardType="number-pad"
      returnKeyType="done"
      maxLength={3}
      selectTextOnFocus
      placeholder="–"
      placeholderTextColor={c.textFaint}
      accessibilityLabel={label}
    />
  );
}

function NumberRow({
  label,
  value,
  unit,
  limits,
  onChange,
}: {
  label: string;
  value: number | undefined;
  unit: string;
  limits: Limits;
  onChange: (n: number) => void;
}) {
  const fieldStyles = useThemedStyles(makeFieldStyles);
  const [error, setError] = useState<string | null>(null);
  return (
    <View>
      <View style={fieldStyles.row}>
        <Text style={fieldStyles.label}>{label}</Text>
        <NumberInput value={value} limits={limits} label={`${label} in ${unit}`} onChange={onChange} onError={setError} />
        <Text style={fieldStyles.unit}>{unit}</Text>
      </View>
      {error && (
        <Text style={fieldStyles.error} accessibilityRole="alert">
          {error}
        </Text>
      )}
    </View>
  );
}

function Divider() {
  const sectionStyles = useThemedStyles(makeSectionStyles);
  return <View style={sectionStyles.divider} />;
}

function Chip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  const chipStyles = useThemedStyles(makeChipStyles);
  return (
    <PressableScale
      style={[chipStyles.chip, selected && chipStyles.chipOn]}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
    >
      <Text style={[chipStyles.label, selected && chipStyles.labelOn]}>
        {label}
      </Text>
    </PressableScale>
  );
}

function LinkRow({ label, onPress }: { label: string; onPress: () => void }) {
  const { colors: c } = useTheme();
  const sectionStyles = useThemedStyles(makeSectionStyles);
  return (
    <PressableScale
      style={sectionStyles.linkRow}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityRole="link"
      accessibilityLabel={label}
    >
      <Text style={sectionStyles.linkLabel}>{label}</Text>
      <Ionicons name="chevron-forward" size={16} color={c.textFaint} />
    </PressableScale>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const makeStyles = (c: Colors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: c.bg },

  scroll: {
    paddingHorizontal: 24,
    paddingBottom: 48,
  },

  header: {
    paddingTop: 20,
    marginBottom: 24,
  },
  title: { ...type.display, fontSize: 36, lineHeight: 37, color: c.text },

  // User card
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: c.surface,
    borderRadius: 20,
    padding: 16,
    marginBottom: 32,
    gap: 14,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: c.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontFamily: font.bold, fontWeight: '700',
    color: c.onPrimary,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontFamily: font.semibold, fontWeight: '600',
    color: c.text,
  },
  userEmail: {
    fontFamily: font.regular, fontSize: 13,
    color: c.textMuted,
    marginTop: 2,
  },

  // Section card
  section: {
    backgroundColor: c.surface,
    borderRadius: 20,
    padding: 18,
    marginBottom: 8,
  },

  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
    marginBottom: 4,
  },

  rowLabel: {
    fontSize: 15,
    fontFamily: font.semibold, fontWeight: '600',
    color: c.text,
  },
  rowHint: {
    fontFamily: font.regular, fontSize: 13,
    color: c.textMuted,
    marginTop: 2,
  },

  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
    gap: 12,
  },
  switchText: { flex: 1 },
  sectionNote: {
    fontFamily: font.regular, fontSize: 13,
    lineHeight: 18,
    color: c.textMuted,
    marginTop: 14,
  },
  fieldError: {
    fontFamily: font.regular, fontSize: 13,
    lineHeight: 18,
    color: c.danger,
    marginTop: 8,
  },

  destructiveRow: {
    paddingVertical: 4,
  },
  destructiveText: {
    fontSize: 15,
    fontFamily: font.semibold, fontWeight: '600',
    color: c.danger,
  },

  logoutBtn: {
    marginTop: 24,
    borderWidth: 1.5,
    borderColor: c.border,
    borderRadius: 100,
    paddingVertical: 16,
    alignItems: 'center',
  },
  logoutText: {
    fontSize: 15,
    fontFamily: font.semibold, fontWeight: '600',
    color: c.text,
  },
});

const makeSectionStyles = (c: Colors) => StyleSheet.create({
  header: {
    fontSize: 13,
    fontFamily: font.semibold, fontWeight: '600',
    color: c.textMuted,
    marginBottom: 10,
    marginTop: 16,
  },
  rowLabelWrapper: {
    marginBottom: 2,
  },
  rowLabel: {
    fontSize: 15,
    fontFamily: font.semibold, fontWeight: '600',
    color: c.text,
  },
  rowHint: {
    fontFamily: font.regular, fontSize: 13,
    color: c.textMuted,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: c.surfaceAlt,
    marginVertical: 14,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  linkLabel: {
    fontSize: 15,
    fontFamily: font.medium, fontWeight: '500',
    color: c.text,
  },
});

const makeFieldStyles = (c: Colors) => StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  label: {
    flex: 1,
    fontSize: 15,
    fontFamily: font.semibold, fontWeight: '600',
    color: c.text,
  },
  input: {
    minWidth: 64,
    height: 44,
    borderRadius: 12,
    backgroundColor: c.surfaceAlt,
    paddingHorizontal: 12,
    paddingVertical: 0,
    textAlign: 'center',
    fontSize: 16,
    fontFamily: font.semibold, fontWeight: '600',
    color: c.text,
    fontVariant: ['tabular-nums'],
  },
  unit: {
    minWidth: 24,
    fontFamily: font.regular, fontSize: 14,
    color: c.textMuted,
  },
  error: {
    fontFamily: font.regular, fontSize: 13,
    lineHeight: 18,
    color: c.danger,
    marginTop: 8,
  },
});

const makeChipStyles = (c: Colors) => StyleSheet.create({
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 100,
    backgroundColor: c.surfaceAlt,
  },
  chipOn: {
    backgroundColor: c.primary,
  },
  label: {
    fontSize: 13,
    fontFamily: font.medium, fontWeight: '500',
    color: c.text,
  },
  labelOn: {
    color: c.onPrimary,
  },
});
