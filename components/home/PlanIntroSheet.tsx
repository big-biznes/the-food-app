import { ComponentRef, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import PressableScale from '@/components/PressableScale';
import { roughMinutes } from '@/components/home/PrepCard';
import { Colors, tileColor } from '@/constants/theme';
import { font, type } from '@/constants/type';
import { usePlan } from '@/contexts/PlanContext';
import {
  Day,
  Meal,
  NO_EATING_OUT,
  StructuredWeekPlan,
  WeekPart,
  getWeekStructure,
  planSlots,
} from '@/data/meals';
import { prepList } from '@/data/prep';
import { useBottomSheet } from '@/hooks/useBottomSheet';
import { useTargets } from '@/hooks/usePortions';
import { useReducedMotionRef } from '@/hooks/useReducedMotion';
import { useTheme, useThemedStyles } from '@/hooks/useTheme';
import { useTranslation } from 'react-i18next';

/** In almost every recipe, so sharing them says nothing about the plan. */
const PANTRY = new Set(['oil', 'olive oil', 'butter', 'flour', 'honey', 'soy sauce', 'garlic', 'lemon', 'tomato paste']);
/** Between ingredients shared equally often, what a part is built around comes first. */
const PROTEINS = new Set([
  'chicken', 'chicken mince', 'turkey', 'turkey mince', 'pork', 'pork mince', 'beef', 'beef mince',
  'mixed mince', 'salmon', 'shrimp', 'tofu', 'tuna', 'white fish', 'lentils', 'chickpeas', 'kidney beans',
]);

/** "chicken, peppers and rice", with the word for "and" of the language. */
function listOf(words: string[], and: string): string {
  if (words.length <= 1) return words.join('');
  return `${words.slice(0, -1).join(', ')} ${and} ${words[words.length - 1]}`;
}
const TILE_GAP = 8;
/** Page dots: a resting dot, and the pill the current page's dot stretches into. */
const DOT = 6;
const DOT_ACTIVE = 18;
const capital = (text: string) => (text ? text[0].toUpperCase() + text.slice(1) : text);

/** The lunches and dinners of a part, and the ingredients two or more of them share. */
function sharedBasket(plan: StructuredWeekPlan, part: WeekPart): { meals: Meal[]; shared: string[] } {
  const meals = planSlots(plan)
    .filter(s => s.part === part && (s.mealType === 'lunch' || s.mealType === 'dinner'))
    .map(s => s.meal);
  const uses = new Map<string, number>();
  for (const meal of meals) {
    for (const name of new Set(meal.ingredients.map(i => i.name))) {
      if (!PANTRY.has(name)) uses.set(name, (uses.get(name) ?? 0) + 1);
    }
  }
  const shared = [...uses]
    .filter(([, n]) => n >= 2)
    .sort(([a, n], [b, m]) => m - n || Number(PROTEINS.has(b)) - Number(PROTEINS.has(a)))
    .slice(0, 3)
    .map(([name]) => name);
  return { meals, shared };
}

type Props = {
  visible: boolean;
  onClose: () => void;
};

/**
 * How the plan works, told with the person's own plan: the week in two shops, the
 * ingredients a part shares, and what preparing ahead saves. Shown once after the
 * first plan, and from Settings.
 */
export default function PlanIntroSheet({ visible, onClose }: Props) {
  const { colors: c } = useTheme();
  const { t } = useTranslation();
  const dayName = (day: Day) => t(`days.${day}`);
  const styles = useThemedStyles(makeStyles);
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const reducedMotion = useReducedMotionRef();
  const { savedPlan, without } = usePlan();
  const targets = useTargets();
  const [modalVisible, setModalVisible] = useState(false);
  const [page, setPage] = useState(0);
  const pager = useRef<ComponentRef<typeof Animated.ScrollView>>(null);
  // Where the pager is, in pixels, frame by frame: the dots follow the finger, not the settled page.
  const scrollX = useRef(new Animated.Value(0)).current;

  const { slideAnim, backdropAnim, panResponder, open, close } = useBottomSheet(() => {
    setModalVisible(false);
    onClose();
  });

  useEffect(() => {
    if (visible) {
      setPage(0);
      scrollX.setValue(0);
      setModalVisible(true);
      open();
    } else {
      close();
    }
    // open/close are stable refs
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const plan = savedPlan?.plan;
  const eatingOutDay = savedPlan?.eatingOutDay ?? 'Sun';
  const content = useMemo(() => {
    if (!plan) return null;
    const { partDays, partShoppingDay, partLabel } = getWeekStructure(eatingOutDay);
    return {
      partDays,
      partShoppingDay,
      partLabel,
      basket: sharedBasket(plan, 'A'),
      prep: prepList(plan, 'A', targets, without),
    };
  }, [plan, eatingOutDay, targets, without]);

  if (!content) return null;
  const { partDays, partShoppingDay, partLabel, basket, prep } = content;
  const eatsOut = eatingOutDay !== NO_EATING_OUT;
  const dayC = partDays.C[0];
  // The week from its first day; the bags mark the two shopping days.
  const strip: { day: Day; part: WeekPart }[] = [
    ...partDays.A.map(day => ({ day, part: 'A' as const })),
    ...partDays.B.map(day => ({ day, part: 'B' as const })),
    { day: dayC, part: 'C' },
  ];
  const shopsFor: Partial<Record<Day, WeekPart>> = { [partShoppingDay.A]: 'A', [partShoppingDay.B]: 'B' };
  // A colour per shopping trip: the day on its own is bought for with the days before it.
  const partTint: Record<WeekPart, string> = { A: c.pea, B: c.sky, C: c.sky };
  // The meals in one row: tiles shrink to fit rather than wrap, down to a size that still reads.
  const rowWidth = width - 48;
  const fit = (rowWidth - TILE_GAP * (basket.meals.length - 1)) / Math.max(1, basket.meals.length);
  const tile = Math.max(36, Math.min(52, Math.floor(fit)));
  const hasPrep = prep.lines.length > 0;
  const pages = hasPrep ? 3 : 2;
  const last = page === pages - 1;

  function goTo(next: number) {
    pager.current?.scrollTo({ x: next * width, animated: !reducedMotion.current });
    setPage(next);
  }

  function onScrollEnd(e: NativeSyntheticEvent<NativeScrollEvent>) {
    setPage(Math.round(e.nativeEvent.contentOffset.x / width));
  }

  return (
    <Modal
      visible={modalVisible}
      animationType="none"
      transparent
      presentationStyle="overFullScreen"
      statusBarTranslucent
      onRequestClose={close}
    >
      <Animated.View style={[styles.backdrop, { opacity: backdropAnim }]}>
        <PressableScale
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={close}
          accessibilityRole="button"
          accessibilityLabel={t('common.close')}
        />
      </Animated.View>

      <View style={styles.sheetContainer} pointerEvents="box-none">
        <Animated.View style={{ transform: [{ translateY: slideAnim }] }}>
          <View style={styles.card} accessibilityViewIsModal>
            <View
              style={styles.dragZone}
              {...panResponder.panHandlers}
              hitSlop={{ top: 24 }}
              accessibilityRole="button"
              accessibilityLabel={t('common.close')}
              accessibilityHint={t('common.closeHint')}
              onAccessibilityTap={close}
            >
              <View style={styles.handle} />
            </View>

            <Animated.ScrollView
              ref={pager}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={onScrollEnd}
              // JS-driven: the dots animate width and colour, which the native driver cannot.
              onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], { useNativeDriver: false })}
              scrollEventThrottle={16}
              style={{ width }}
            >
              {/* 1 — the week in two shops */}
              <View style={[styles.page, { width }]}>
                <Text style={styles.kicker}>{t('intro.kicker')}</Text>
                <Text style={styles.title} accessibilityRole="header">
                  {t('intro.weekTitle')}
                </Text>
                <View style={styles.strip} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
                  {strip.map(({ day, part }) => (
                    <View key={day} style={styles.stripCol}>
                      <View style={[styles.bag, !shopsFor[day] && styles.bagEmpty]}>
                        {shopsFor[day] && <Ionicons name="bag-handle" size={13} color={c.onTile} />}
                      </View>
                      <View style={[styles.dayTile, { backgroundColor: partTint[part] }]}>
                        {part === 'C' && eatsOut && <Ionicons name="restaurant" size={14} color={c.onTile} />}
                      </View>
                      <Text style={styles.dayLabel}>{day}</Text>
                    </View>
                  ))}
                </View>
                <Text style={styles.body}>
                  {t(eatsOut ? 'intro.weekBodyEatOut' : 'intro.weekBody', {
                    shopA: dayName(partShoppingDay.A),
                    partA: partLabel.A,
                    shopB: dayName(partShoppingDay.B),
                    outDay: dayName(dayC),
                  })}
                </Text>
              </View>

              {/* 2 — one basket, many meals */}
              <View style={[styles.page, { width }]}>
                <Text style={styles.kicker}>{partLabel.A}</Text>
                <Text style={styles.title} accessibilityRole="header">
                  {t('intro.basketTitle', { count: basket.meals.length })}
                </Text>
                {basket.shared.length > 0 && (
                  <View style={styles.chips}>
                    {basket.shared.map(name => (
                      <View key={name} style={styles.chip}>
                        <Text style={styles.chipText}>{name}</Text>
                      </View>
                    ))}
                  </View>
                )}
                <View style={styles.meals} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
                  {basket.meals.map((meal, i) => (
                    <View
                      key={`${meal.id}-${i}`}
                      style={[
                        styles.mealTile,
                        { width: tile, height: tile, backgroundColor: tileColor(c, meal.mealType) },
                      ]}
                    >
                      <Text style={[styles.mealEmoji, { fontSize: Math.round(tile * 0.48) }]}>{meal.emoji}</Text>
                    </View>
                  ))}
                </View>
                <Text style={styles.body}>
                  {basket.shared.length > 0
                    ? t('intro.basketBody', { items: capital(listOf(basket.shared, t('common.and'))) })
                    : t('intro.basketBodyNoShared')}
                </Text>
              </View>

              {/* 3 — prep once */}
              {hasPrep && (
                <View style={[styles.page, { width }]}>
                  <Text style={styles.kicker}>{t('intro.prepKicker')}</Text>
                  <Text style={styles.title} accessibilityRole="header">
                    {t('intro.prepTitle')}
                  </Text>
                  <View style={styles.trade}>
                    <View style={[styles.tradeBox, { backgroundColor: c.butter }]}>
                      <Text style={styles.tradeNumber}>{t('common.minutes', { count: roughMinutes(prep.minutes) })}</Text>
                      <Text style={styles.tradeLabel}>{t('intro.prepOn', { day: dayName(partShoppingDay.A) })}</Text>
                    </View>
                    <Ionicons name="arrow-forward" size={20} color={c.textMuted} />
                    <View style={[styles.tradeBox, { backgroundColor: c.pea }]}>
                      <Text style={styles.tradeNumber}>−{t('common.minutes', { count: roughMinutes(prep.saves) })}</Text>
                      <Text style={styles.tradeLabel}>{partLabel.A}</Text>
                    </View>
                  </View>
                  <Text style={styles.body}>
                    {t('intro.prepBody')}
                  </Text>
                </View>
              )}
            </Animated.ScrollView>

            <View style={styles.footer}>
              <View style={styles.dots} accessibilityLabel={t('common.pageOf', { page: page + 1, total: pages })}>
                {Array.from({ length: pages }, (_, i) => {
                  // 0 when the pager is a page or more away from this dot, 1 when it is right on it:
                  // halfway between two pages, both dots are half grown.
                  const range = {
                    inputRange: [(i - 1) * width, i * width, (i + 1) * width],
                    extrapolate: 'clamp' as const,
                  };
                  return (
                    <Animated.View
                      key={i}
                      style={[
                        styles.dot,
                        {
                          width: scrollX.interpolate({ ...range, outputRange: [DOT, DOT_ACTIVE, DOT] }),
                          backgroundColor: scrollX.interpolate({
                            ...range,
                            outputRange: [c.surfaceStrong, c.primary, c.surfaceStrong],
                          }),
                        },
                      ]}
                    />
                  );
                })}
              </View>

              <PressableScale
                style={styles.nextBtn}
                onPress={() => (last ? close() : goTo(page + 1))}
                activeOpacity={0.8}
                accessibilityRole="button"
              >
                <Text style={styles.nextText}>{last ? t('common.gotIt') : t('common.next')}</Text>
              </PressableScale>

              {/* Kept in place on the last page, so the button does not jump. */}
              <PressableScale
                style={[styles.skipBtn, last && styles.hidden]}
                onPress={close}
                disabled={last}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityElementsHidden={last}
                importantForAccessibility={last ? 'no-hide-descendants' : 'auto'}
              >
                <Text style={styles.skipText}>{t('common.skip')}</Text>
              </PressableScale>
            </View>

            <View style={{ height: insets.bottom + 8 }} />
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const makeStyles = (c: Colors) =>
  StyleSheet.create({
    backdrop: { ...StyleSheet.absoluteFill, backgroundColor: c.backdrop },
    sheetContainer: { position: 'absolute', bottom: 0, left: 0, right: 0 },
    card: {
      backgroundColor: c.bg,
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
    },
    dragZone: { paddingTop: 12, paddingBottom: 16, alignItems: 'center' },
    handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: c.surfaceStrong },
    page: { paddingHorizontal: 24 },
    kicker: { ...type.label, color: c.textMuted, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 6 },
    title: { ...type.title, color: c.text, marginBottom: 20 },
    body: { fontFamily: font.regular, fontSize: 15, lineHeight: 21, color: c.textSecondary, marginTop: 20 },

    strip: { flexDirection: 'row', justifyContent: 'space-between' },
    stripCol: { alignItems: 'center', gap: 6 },
    bag: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: c.butter,
      alignItems: 'center',
      justifyContent: 'center',
    },
    bagEmpty: { backgroundColor: 'transparent' },
    dayTile: {
      width: 38,
      height: 52,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
    },
    dayLabel: { ...type.label, fontSize: 12, color: c.textMuted },

    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
    chip: { backgroundColor: c.primary, borderRadius: 100, paddingHorizontal: 14, paddingVertical: 7 },
    chipText: { fontFamily: font.semibold, fontSize: 14, color: c.onPrimary },
    meals: { flexDirection: 'row', flexWrap: 'wrap', gap: TILE_GAP },
    mealTile: { borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
    mealEmoji: {},

    trade: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    tradeBox: { flex: 1, borderRadius: 20, paddingVertical: 16, paddingHorizontal: 16 },
    tradeNumber: { fontFamily: font.extrabold, fontSize: 26, letterSpacing: -0.6, color: c.onTile },
    tradeLabel: { ...type.label, color: c.onTileMuted, marginTop: 2 },

    footer: { paddingHorizontal: 24, paddingTop: 24 },
    dots: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginBottom: 16 },
    dot: { height: DOT, borderRadius: DOT / 2 },
    nextBtn: {
      backgroundColor: c.primary,
      borderRadius: 100,
      minHeight: 58,
      alignItems: 'center',
      justifyContent: 'center',
    },
    nextText: { color: c.onPrimary, fontSize: 16, fontFamily: font.semibold, fontWeight: '600' },
    skipBtn: { minHeight: 52, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
    skipText: { color: c.text, fontSize: 16, fontFamily: font.medium, fontWeight: '500' },
    hidden: { opacity: 0 },
  });
