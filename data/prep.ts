// Preparing ahead: the chopping and the cooking of plain staples that can be
// done once, right after shopping, for all the meals of a part of the week.
//
// Only work that keeps is offered: firm vegetables that are cut, cheese that is
// grated, and rice, quinoa and lentils that a recipe cooks on their own in
// water and that reheat well. What must be fresh or hot from the pan (meat,
// eggs, avocado, tomato) stays with the meal. Which ingredients qualify, and
// how long the work takes, is the `prep` field in data/ingredients.json.
//
// How an ingredient is cut is read from the recipe's own steps ("dice the
// onion"), so the list asks for what the recipe needs.

import ingredientDefs from './ingredients.json';
import { formatQuantity } from './quantity';
import { namesIn, personalize, stepIngredients } from './portions';
import type { Targets } from './portions';
import { planSlots } from './meals';
import type { Ingredient, Meal, StructuredWeekPlan, WeekPart } from './meals';

type PrepDef = { kind: 'cut' | 'cook'; verb: string; minutes: number; always?: boolean };
const PREP = new Map(
  (ingredientDefs as { key: string; prep?: PrepDef }[]).filter(d => d.prep).map(d => [d.key, d.prep!]),
);

/** One job for one meal: "dice the onion of the chili". */
export type PrepTask = {
  /** Identifies the job across meals: the same ingredient cut the same way is done in one go. */
  key: string;
  ingredient: string;
  kind: 'cut' | 'cook';
  /** "Dice", "Cut into florets", "Cook". */
  verb: string;
  /** Minutes this takes out of cooking the meal. */
  minutes: number;
  /** The recipe does not say how the ingredient is cut; `verb` is the usual way. */
  assumed?: boolean;
};

/** What to call a way of cutting, by the word a recipe uses for it. */
const CUTS: [imperative: string, participle: string, label: string][] = [
  ['dice', 'diced', 'Dice'],
  ['chop', 'chopped', 'Chop'],
  ['slice', 'sliced', 'Slice'],
  ['grate', 'grated', 'Grate'],
  ['shred', 'shredded', 'Shred'],
  ['cube', 'cubed', 'Cut into cubes'],
  ['trim', 'trimmed', 'Trim'],
  ['halve', 'halved', 'Halve'],
  ['mince', 'minced', 'Chop finely'],
  ['cut', 'cut', 'Cut up'],
];
const IMPERATIVE = new Map(CUTS.map(([word, , label]) => [word, label]));
const PARTICIPLE = new Map(CUTS.filter(([word]) => word !== 'cut').map(([, word, label]) => [word, label]));
const alternatives = (words: Iterable<string>) => [...words].join('|');
/** Words that say how big, not what shape: "small florets" are florets. */
const SIZE = /^(small|thin|thick|large|big|fine|rough|chunky|bite-sized|bite-size)$/;
/** Words that can stand between a verb and the ingredient it is about, next to other ingredients. */
const FILLER = new Set(['the', 'a', 'an', 'and', 'both', 'it', 'them', 'cut', 'peel', 'peeled']);

const escape = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const capital = (text: string) => text[0].toUpperCase() + text.slice(1);

/** How a recipe's steps cut an ingredient, or null when they do not say. */
function cutIn(steps: string[], name: string, all: Ingredient[]): string | null {
  const names = alternatives(namesIn(name, all).map(escape));
  // "Slice the chicken, peppers and onion into strips": other ingredients may stand in between.
  const between = new Set([...FILLER, ...all.flatMap(i => namesIn(i.name, all)).flatMap(n => n.split(' '))]);
  const onlyBetween = (text: string) => text.split(/[\s,]+/).filter(Boolean).every(word => between.has(word));

  for (const step of steps) {
    for (const sentence of step.toLowerCase().split(/[.;]|\bthen\b/)) {
      const found = sentence.match(new RegExp(`\\b(${names})\\b`));
      if (!found || found.index == null) continue;
      const before = sentence.slice(0, found.index);
      const after = sentence.slice(found.index + found[0].length);

      // "the diced onion": a participle right in front of the name.
      const participle = before.match(new RegExp(`\\b(${alternatives(PARTICIPLE.keys())}) $`));
      if (participle) return PARTICIPLE.get(participle[1])!;

      // "dice the onion and the carrots": the last cutting verb in front, with only ingredients in between.
      const verbs = [...before.matchAll(new RegExp(`\\b(${alternatives(IMPERATIVE.keys())})\\b`, 'g'))];
      const verb = verbs[verbs.length - 1];
      const direct = verb && onlyBetween(before.slice(verb.index! + verb[0].length)) ? verb[1] : null;
      // "peel the carrots and cut them into sticks"
      const followed = !direct && /^ and cut (it|them)\b/.test(after) ? 'cut' : null;
      const word = direct ?? followed;
      if (!word) continue;

      // "... into small florets": the shape, for a verb that does not name one itself.
      const shape = after.match(/^([a-z ,]*?)\binto ((?:[a-z-]+ ){0,2}?[a-z-]+)(?= and | for | with |,|$)/);
      if (shape && (word === 'cut' || word === 'slice') && onlyBetween(shape[1])) {
        const what = shape[2].split(' ').filter(w => !SIZE.test(w)).join(' ');
        if (what) return `Cut into ${what}`;
      }
      return IMPERATIVE.get(word)!;
    }
  }
  return null;
}

/** Whether a step does nothing but cook this staple in water. */
export function cooksAlone(step: string, name: string, all: Ingredient[]): boolean {
  const used = stepIngredients(step, all);
  return used.length === 1 && used[0].name === name && /\b(cook|simmer|boil)\b/i.test(step) && /\bwater\b/i.test(step);
}

/** Whether the recipe cooks this staple by itself in water, so that it can be cooked beforehand. */
function cookedAlone(steps: string[], name: string, all: Ingredient[]): boolean {
  return steps.some(step => cooksAlone(step, name, all));
}

/** The work of a meal that can be done ahead. */
export function prepTasks(meal: Meal): PrepTask[] {
  const steps = meal.templates?.instructions ?? meal.instructions;
  const tasks: PrepTask[] = [];
  for (const ing of meal.ingredients) {
    const def = PREP.get(ing.name);
    if (!def) continue;
    if (def.kind === 'cook') {
      if (!cookedAlone(steps, ing.name, meal.ingredients)) continue;
      // The pot simmers next to the rest of the cooking, so only part of its time is saved.
      const minutes = Math.min(def.minutes, Math.round(meal.prepTime * 0.4));
      tasks.push({ key: `${ing.name}|cook`, ingredient: ing.name, kind: 'cook', verb: def.verb, minutes });
      continue;
    }
    const read = cutIn(steps, ing.name, meal.ingredients);
    // The recipe does not say how, or only says "cut": the usual way for this ingredient.
    const verb = read && read !== 'Cut up' ? read : def.always ? def.verb : read;
    if (!verb) continue;
    const key = `${ing.name}|${verb.toLowerCase()}`;
    tasks.push({ key, ingredient: ing.name, kind: 'cut', verb, minutes: def.minutes, ...(verb === read ? {} : { assumed: true }) });
  }
  return tasks;
}

/** At least this much of a meal's time is left however much was prepared: it still has to be cooked. */
const MIN_SHARE_LEFT = 0.5;
const MIN_MINUTES_LEFT = 5;

/** Minutes a meal takes when the jobs in `done` (task keys) were done ahead. */
export function timeWithPrep(meal: Meal, done: Iterable<string>): number {
  const ticked = new Set(done);
  const saved = prepTasks(meal).filter(t => ticked.has(t.key)).reduce((sum, t) => sum + t.minutes, 0);
  if (saved === 0) return meal.prepTime;
  const least = Math.min(meal.prepTime, Math.max(MIN_MINUTES_LEFT, Math.ceil(meal.prepTime * MIN_SHARE_LEFT)));
  return Math.max(least, meal.prepTime - saved);
}

/** One line of the prep list of a part: a job done once for every meal that needs it. */
export type PrepLine = {
  key: string;
  /** Every task this line covers; ticking the line ticks them all. */
  keys: string[];
  kind: 'cut' | 'cook';
  /** "Dice 180g onion" */
  label: string;
  /** Names of the meals it is for. */
  meals: string[];
  /** Minutes of work now. */
  minutes: number;
};

export type PrepList = {
  lines: PrepLine[];
  /** Minutes the whole session takes, roughly. */
  minutes: number;
  /** Minutes the part's meals get quicker when everything is done. */
  saves: number;
};

const AMOUNT_UNITS = new Set(['g', 'ml', 'kg', 'l']);

/** The prep list for one part of the plan, in the amounts this person cooks. */
export function prepList(
  plan: StructuredWeekPlan,
  part: WeekPart,
  targets: Targets | null = null,
  without: Record<string, string[]> = {},
): PrepList {
  type Group = { task: PrepTask; keys: string[]; amount: number; unit: string; meals: string[] };
  const groups = new Map<string, Group>();
  let saves = 0;
  for (const { meal, part: slotPart } of planSlots(plan)) {
    if (slotPart !== part) continue;
    const personal = personalize(meal, targets, without[meal.id]);
    const tasks = prepTasks(meal).filter(t => personal.ingredients.some(i => i.name === t.ingredient));
    saves += meal.prepTime - timeWithPrep(meal, tasks.map(t => t.key));
    for (const task of tasks) {
      const ing = personal.ingredients.find(i => i.name === task.ingredient)!;
      const group = groups.get(task.key) ?? { task, keys: [task.key], amount: 0, unit: ing.unit, meals: [] };
      if (ing.unit === group.unit) group.amount += ing.amount;
      if (!group.meals.includes(meal.name)) group.meals.push(meal.name);
      groups.set(task.key, group);
    }
  }

  // A meal that does not say how its onion is cut takes it the way the part's other meals do,
  // rather than asking for a second box of onion cut slightly differently.
  for (const [key, group] of [...groups]) {
    if (!group.task.assumed) continue;
    const others = [...groups.values()].filter(g => g.task.ingredient === group.task.ingredient && !g.task.assumed);
    const host = others.sort((a, b) => b.meals.length - a.meals.length)[0];
    if (!host || host.unit !== group.unit) continue;
    host.amount += group.amount;
    host.keys.push(key);
    for (const name of group.meals) if (!host.meals.includes(name)) host.meals.push(name);
    groups.delete(key);
  }

  const lines = [...groups.values()].map(({ task, keys, amount, unit, meals }): PrepLine => {
    const quantity = AMOUNT_UNITS.has(unit) && amount > 0 ? `${formatQuantity(amount, unit)} ` : '';
    // "Cut 300g broccoli into florets" reads better than "Cut into florets 300g broccoli".
    const into = task.verb.match(/^Cut (into .+)$/);
    const label = into ? `Cut ${quantity}${task.ingredient} ${into[1]}` : `${task.verb} ${quantity}${task.ingredient}`;
    return {
      key: task.key,
      keys,
      kind: task.kind,
      label: capital(label),
      meals,
      // Doing the same job for several meals in one go goes faster than doing it meal by meal.
      minutes: task.kind === 'cook' ? 5 : Math.max(task.minutes, Math.round(task.minutes * (1 + 0.6 * (meals.length - 1)))),
    };
  });
  // Staples first: they cook while the chopping is done.
  lines.sort((a, b) => (a.kind === b.kind ? a.label.localeCompare(b.label) : a.kind === 'cook' ? -1 : 1));
  return { lines, minutes: lines.reduce((sum, l) => sum + l.minutes, 0), saves };
}
