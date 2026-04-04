import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth, DietaryRestriction, Goal } from '@/contexts/AuthContext';

const DAYS_OF_WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

type MacroBalance = 'balanced' | 'low-carb' | 'high-protein' | 'custom';
type MeasurementSystem = 'metric' | 'imperial';
type AppTheme = 'light' | 'dark' | 'system';

const GOAL_OPTIONS: { value: Goal; label: string }[] = [
  { value: 'lose', label: 'Lose weight' },
  { value: 'maintain', label: 'Maintain' },
  { value: 'gain', label: 'Gain muscle' },
];

const MACRO_OPTIONS: { value: MacroBalance; label: string }[] = [
  { value: 'balanced', label: 'Balanced' },
  { value: 'low-carb', label: 'Low carb' },
  { value: 'high-protein', label: 'High protein' },
  { value: 'custom', label: 'Custom' },
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

const THEME_OPTIONS: { value: AppTheme; label: string }[] = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'System' },
];

export default function SettingsScreen() {
  const { user, logout, updateProfile } = useAuth();

  // Plan settings
  const [goal, setGoal] = useState<Goal>(user?.goal ?? 'maintain');
  const [macroBalance, setMacroBalance] = useState<MacroBalance>('balanced');

  const [eatingOutDay, setEatingOutDay] = useState<string>(user?.eatingOutDay ?? 'Fri');

  // Account settings
  const [restrictions, setRestrictions] = useState<DietaryRestriction[]>(
    user?.restrictions ?? [],
  );

  // Application settings
  const [measurement, setMeasurement] = useState<MeasurementSystem>('metric');
  const [notifications, setNotifications] = useState(true);
  const [theme, setTheme] = useState<AppTheme>('system');

  function toggleRestriction(r: DietaryRestriction) {
    setRestrictions(prev =>
      prev.includes(r) ? prev.filter(x => x !== r) : [...prev, r],
    );
  }

  function handleDeleteAccount() {
    Alert.alert(
      'Delete account',
      'This will permanently delete your account and all data. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => logout(),
        },
      ],
    );
  }

  function handleLogout() {
    Alert.alert('Log out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log out', style: 'destructive', onPress: () => logout() },
    ]);
  }

  function handleLink(label: string) {
    Alert.alert(label, 'This will be available in a future update.');
  }

  const firstName = user?.name?.split(' ')[0] ?? '';
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

        {/* ── Plan Settings ─────────────────────────────────────────── */}
        <SectionHeader label="Plan" />
        <View style={styles.section}>
          <RowLabel label="Weight goal" />
          <View style={styles.chipRow}>
            {GOAL_OPTIONS.map(opt => (
              <Chip
                key={opt.value}
                label={opt.label}
                selected={goal === opt.value}
                onPress={() => setGoal(opt.value)}
              />
            ))}
          </View>

          <Divider />

          <RowLabel label="Eating out day" hint="We'll skip meal planning for this day" />
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
          </View>

          <Divider />

          <RowLabel label="Macro balance" />
          <View style={styles.chipRow}>
            {MACRO_OPTIONS.map(opt => (
              <Chip
                key={opt.value}
                label={opt.label}
                selected={macroBalance === opt.value}
                onPress={() => setMacroBalance(opt.value)}
              />
            ))}
          </View>
        </View>

        {/* ── Account Settings ──────────────────────────────────────── */}
        <SectionHeader label="Account" />
        <View style={styles.section}>
          <RowLabel label="Eating preferences" hint="Select all that apply" />
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

        {/* ── Application Settings ──────────────────────────────────── */}
        <SectionHeader label="Application" />
        <View style={styles.section}>
          <RowLabel label="Measurement system" />
          <View style={styles.chipRow}>
            <Chip
              label="Metric"
              selected={measurement === 'metric'}
              onPress={() => setMeasurement('metric')}
            />
            <Chip
              label="Imperial"
              selected={measurement === 'imperial'}
              onPress={() => setMeasurement('imperial')}
            />
          </View>

          <Divider />

          <View style={styles.switchRow}>
            <View>
              <Text style={styles.rowLabel}>Notifications</Text>
              <Text style={styles.rowHint}>Meal reminders and updates</Text>
            </View>
            <Switch
              value={notifications}
              onValueChange={setNotifications}
              trackColor={{ false: '#E5E5E5', true: '#111111' }}
              thumbColor="#FFFFFF"
            />
          </View>

          <Divider />

          <RowLabel label="Theme" />
          <View style={styles.chipRow}>
            {THEME_OPTIONS.map(opt => (
              <Chip
                key={opt.value}
                label={opt.label}
                selected={theme === opt.value}
                onPress={() => setTheme(opt.value)}
              />
            ))}
          </View>
        </View>

        {/* ── App Information ───────────────────────────────────────── */}
        <SectionHeader label="App information" />
        <View style={styles.section}>
          <LinkRow
            label="Terms of Service"
            onPress={() => handleLink('Terms of Service')}
          />
          <Divider />
          <LinkRow
            label="Privacy Policy"
            onPress={() => handleLink('Privacy Policy')}
          />
          <Divider />
          <TouchableOpacity
            style={styles.destructiveRow}
            onPress={handleDeleteAccount}
            activeOpacity={0.7}
          >
            <Text style={styles.destructiveText}>Delete account</Text>
          </TouchableOpacity>
        </View>

        {/* ── Log out ───────────────────────────────────────────────── */}
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <Text style={styles.logoutText}>Log out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SectionHeader({ label }: { label: string }) {
  return <Text style={sectionStyles.header}>{label}</Text>;
}

function RowLabel({ label, hint }: { label: string; hint?: string }) {
  return (
    <View style={sectionStyles.rowLabelWrapper}>
      <Text style={sectionStyles.rowLabel}>{label}</Text>
      {hint && <Text style={sectionStyles.rowHint}>{hint}</Text>}
    </View>
  );
}

function Divider() {
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
  return (
    <TouchableOpacity
      style={[chipStyles.chip, selected && chipStyles.chipOn]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={[chipStyles.label, selected && chipStyles.labelOn]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function LinkRow({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={sectionStyles.linkRow} onPress={onPress} activeOpacity={0.7}>
      <Text style={sectionStyles.linkLabel}>{label}</Text>
      <Ionicons name="chevron-forward" size={16} color="#CCCCCC" />
    </TouchableOpacity>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' },

  scroll: {
    paddingHorizontal: 24,
    paddingBottom: 48,
  },

  header: {
    paddingTop: 20,
    marginBottom: 24,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#111111',
    letterSpacing: -0.3,
  },

  // User card
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    padding: 16,
    marginBottom: 32,
    gap: 14,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#111111',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111111',
  },
  userEmail: {
    fontSize: 13,
    color: '#AAAAAA',
    marginTop: 2,
  },

  // Section card
  section: {
    backgroundColor: '#F5F5F5',
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
    fontWeight: '600',
    color: '#111111',
  },
  rowHint: {
    fontSize: 13,
    color: '#AAAAAA',
    marginTop: 2,
  },

  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },

  destructiveRow: {
    paddingVertical: 4,
  },
  destructiveText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#E53935',
  },

  logoutBtn: {
    marginTop: 24,
    borderWidth: 1.5,
    borderColor: '#E5E5E5',
    borderRadius: 100,
    paddingVertical: 16,
    alignItems: 'center',
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111111',
  },
});

const sectionStyles = StyleSheet.create({
  header: {
    fontSize: 13,
    fontWeight: '600',
    color: '#AAAAAA',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 10,
    marginTop: 16,
  },
  rowLabelWrapper: {
    marginBottom: 2,
  },
  rowLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111111',
  },
  rowHint: {
    fontSize: 13,
    color: '#AAAAAA',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#EBEBEB',
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
    fontWeight: '500',
    color: '#111111',
  },
});

const chipStyles = StyleSheet.create({
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 100,
    backgroundColor: '#EBEBEB',
  },
  chipOn: {
    backgroundColor: '#111111',
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    color: '#111111',
  },
  labelOn: {
    color: '#FFFFFF',
  },
});
