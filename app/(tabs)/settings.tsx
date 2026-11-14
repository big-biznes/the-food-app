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
import { usePlan } from '@/contexts/PlanContext';

import { font, type } from '@/constants/type';
const DAYS_OF_WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const GOAL_OPTIONS: { value: Goal; label: string }[] = [
  { value: 'lose', label: 'Lose weight' },
  { value: 'maintain', label: 'Maintain' },
  { value: 'gain', label: 'Gain muscle' },
];

const ACTIVITY_OPTIONS: { value: Activity; label: string }[] = [
  { value: 'low', label: 'Mostly sitting' },
  { value: 'light', label: 'Lightly active' },
  { value: 'active', label: 'Active' },
  { value: 'very', label: 'Very active' },
];

const MACRO_OPTIONS: { value: MacroBalance; label: string }[] = [
  { value: 'balanced', label: 'Balanced' },
  { value: 'low-carb', label: 'Low carb' },
  { value: 'high-protein', label: 'High protein' },
];

const RESTRICTION_OPTIONS: { value: DietaryRestriction; label: string }[] = [
  { value: 'vegetarian', label: 'Vegetarian' },
  { value: 'vegan', label: 'Vegan' },
  { value: 'gluten-free', label: 'Gluten-free' },
  { value: 'dairy-free', label: 'Dairy-free' },
  { value: 'nut-allergy', label: 'Nut allergy' },
  { value: 'halal', label: 'Halal' },
  { value: 'kosher', label: 'Kosher' },
];

export default function SettingsScreen() {
  const { colors: c } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const { user, logout, updateProfile, deleteAccount } = useAuth();
  const router = useRouter();
  const [confirm, setConfirm] = useState<'logout' | 'delete' | null>(null);
  const { savedPlan } = usePlan();
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
          <Text style={styles.title}>Settings</Text>
        </View>

        {/* User card */}
        <View style={styles.userCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user?.name ?? 'Guest'}</Text>
            <Text style={styles.userEmail}>{user?.email ?? ''}</Text>
          </View>
        </View>

        {/* ── About you ─────────────────────────────────────────────── */}
        <SectionHeader label="About you" />
        <View style={styles.section}>
          <NumberRow
            label="Age"
            value={user?.age}
            unit="years"
            limits={BODY_LIMITS.age}
            onChange={age => updateProfile({ age })}
          />
          <Divider />
          <NumberRow
            label="Height"
            value={user?.heightCm}
            unit="cm"
            limits={BODY_LIMITS.heightCm}
            onChange={heightCm => updateProfile({ heightCm })}
          />
          <Divider />
          <NumberRow
            label="Weight"
            value={user?.weightKg}
            unit="kg"
            limits={BODY_LIMITS.weightKg}
            onChange={weightKg => updateProfile({ weightKg })}
          />
          <Text style={styles.sectionNote}>
            Your portions are worked out from these. Update your weight when it changes.
          </Text>
        </View>

        {/* ── Plan Settings ─────────────────────────────────────────── */}
        <SectionHeader label="Plan" />
        <View style={styles.section}>
          <RowLabel
            label="Weight goal"
            hint={targets ? `About ${targets.kcal.toLocaleString('en')} kcal a day; portions are sized to match` : undefined}
          />
          <View style={styles.chipRow}>
            {GOAL_OPTIONS.map(opt => (
              <Chip
                key={opt.value}
                label={opt.label}
                selected={goal === opt.value}
                onPress={() => {
                  setGoal(opt.value);
                  updateProfile({ goal: opt.value });
                }}
              />
            ))}
          </View>

          <Divider />

          <RowLabel label="Activity level" hint="Work and exercise together, on a normal week" />
          <View style={styles.chipRow}>
            {ACTIVITY_OPTIONS.map(opt => (
              <Chip
                key={opt.value}
                label={opt.label}
                selected={(user?.activity ?? 'light') === opt.value}
                onPress={() => updateProfile({ activity: opt.value })}
              />
            ))}
          </View>

          <Divider />

          <RowLabel label="Eating out day" hint="Takes effect when your next plan is generated" />
          <View style={styles.chipRow}>
            {DAYS_OF_WEEK.map(d => (
              <Chip
                key={d}
                label={d}
                selected={eatingOutDay === d}
                onPress={() => {
                  setEatingOutDay(d);
                  updateProfile({ eatingOutDay: d });
                }}
              />
            ))}
            <Chip
              label="I don’t eat out"
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
              <Text style={styles.rowLabel}>Daily snack</Text>
              <Text style={styles.rowHint}>
                A small fourth meal each day in your next plan; the other meals get a little smaller
              </Text>
            </View>
            <Switch
              value={Boolean(user?.snacks)}
              onValueChange={snacks => updateProfile({ snacks })}
              trackColor={{ false: c.border, true: c.primary }}
              thumbColor={c.bg}
              accessibilityLabel="Daily snack"
            />
          </View>

          <Divider />

          <RowLabel label="Macro balance" hint="Which meals your next plan leans towards" />
          <View style={styles.chipRow}>
            {MACRO_OPTIONS.map(opt => (
              <Chip
                key={opt.value}
                label={opt.label}
                selected={(user?.macroBalance ?? 'balanced') === opt.value}
                onPress={() => updateProfile({ macroBalance: opt.value })}
              />
            ))}
          </View>
        </View>

        {/* ── Account Settings ──────────────────────────────────────── */}
        <SectionHeader label="Account" />
        <View style={styles.section}>
          <RowLabel
            label="Eating preferences"
            hint="Select all that apply. Your week will offer to replace the meals that no longer fit."
          />
          <View style={styles.chipRow}>
            {RESTRICTION_OPTIONS.map(opt => (
              <Chip
                key={opt.value}
                label={opt.label}
                selected={restrictions.includes(opt.value)}
                onPress={() => toggleRestriction(opt.value)}
              />
            ))}
          </View>
        </View>

        {/* ── Stores ────────────────────────────────────────────────── */}
        <SectionHeader label="Stores" />
        <View style={styles.section}>
          <StorePicker />
        </View>

        {/* ── Application Settings ──────────────────────────────────── */}
        <SectionHeader label="Application" />
        <View style={styles.section}>
          <View style={styles.switchRow}>
            <View style={styles.switchText}>
              <Text style={styles.rowLabel}>Shopping reminders</Text>
              <Text style={styles.rowHint}>A notification on the morning of each shopping day</Text>
            </View>
            <Switch
              value={Boolean(user?.notifications)}
              onValueChange={toggleReminders}
              trackColor={{ false: c.border, true: c.primary }}
              thumbColor={c.bg}
              accessibilityLabel="Shopping reminders"
            />
          </View>
          {remindersBlocked && (
            <Text style={styles.fieldError} accessibilityRole="alert">
              Notifications are switched off for this app. Allow them in your phone’s settings, then try again.
            </Text>
          )}
        </View>

        {/* ── App Information ───────────────────────────────────────── */}
        <SectionHeader label="App information" />
        <View style={styles.section}>
          {/* Told with the person's own plan, so only once there is one. */}
          {savedPlan?.plan && (
            <>
              <LinkRow label="How planning works" onPress={() => setShowIntro(true)} />
              <Divider />
            </>
          )}
          <LinkRow
            label="Terms of Service"
            onPress={() => router.push('/legal/terms' as Href)}
          />
          <Divider />
          <LinkRow
            label="Privacy Policy"
            onPress={() => router.push('/legal/privacy' as Href)}
          />
          <Divider />
          <PressableScale
            style={styles.destructiveRow}
            onPress={handleDeleteAccount}
            activeOpacity={0.7}
          >
            <Text style={styles.destructiveText}>Delete account</Text>
          </PressableScale>
        </View>

        {/* ── Log out ───────────────────────────────────────────────── */}
        <PressableScale
          style={styles.logoutBtn}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <Text style={styles.logoutText}>Log out</Text>
        </PressableScale>
      </ScrollView>

      <PlanIntroSheet visible={showIntro} onClose={() => setShowIntro(false)} />
      <ConfirmSheet
        visible={confirm === 'logout'}
        title="Log out?"
        message="Your plan, likes and shopping list stay saved to your account."
        confirmLabel="Log out"
        onConfirm={confirmLogout}
        onClose={() => setConfirm(null)}
      />
      <ConfirmSheet
        visible={confirm === 'delete'}
        title="Delete account?"
        message="This permanently deletes your account, plan, likes and shopping list. This can't be undone."
        confirmLabel="Delete account"
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
  const fieldStyles = useThemedStyles(makeFieldStyles);
  const shown = value != null ? String(value) : '';
  const [text, setText] = useState(shown);
  // Follow the profile when it changes elsewhere (another device).
  useEffect(() => setText(shown), [shown]);

  function commit() {
    const n = Number(text.trim());
    if (text.trim() === '' || !Number.isInteger(n) || n < limits.min || n > limits.max) {
      setText(shown);
      onError(`Enter a whole number from ${limits.min} to ${limits.max}.`);
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
