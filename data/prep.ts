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
  /** "Dice 180g onion", in English; lib/localize.ts writes it in the app's language from the parts below. */
  label: string;
  /** How the job was named in English: "Dice", "Cut into florets", "Cook". */
  verb: string;
  ingredient: string;
  /** The amount to prepare, when it is a weight or volume. */
  amount?: number;
  unit?: string;
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
      verb: task.verb,
      ingredient: task.ingredient,
      ...(quantity ? { amount, unit } : {}),
      meals,
      // Doing the same job for several meals in one go goes faster than doing it meal by meal.
      minutes: task.kind === 'cook' ? 5 : Math.max(task.minutes, Math.round(task.minutes * (1 + 0.6 * (meals.length - 1)))),
    };
  });
  // Staples first: they cook while the chopping is done.
  lines.sort((a, b) => (a.kind === b.kind ? a.label.localeCompare(b.label) : a.kind === 'cook' ? -1 : 1));
  return { lines, minutes: lines.reduce((sum, l) => sum + l.minutes, 0), saves };
}

// ── Steps after prepping ──────────────────────────────────────────────────────
// A recipe says "Dice the onion and soften it in the oil". When the onion was diced
// ahead, cook mode should say "Soften the diced onion in the oil" instead. A sentence
// is read as a list of actions ("Beat the eggs, cut the ham into strips and grate the
// cheese"); only cutting a prepped ingredient is left out, and the action that comes
// next names it as cut. A sentence of any other shape is left as written, and cook
// mode then notes what is already prepped.

/** The cutting verbs of recipe steps, and what the cut ingredient is called. */
const CUT_PARTICIPLE: Record<string, string> = {
  dice: 'diced',
  chop: 'chopped',
  slice: 'sliced',
  grate: 'grated',
  shred: 'shredded',
  cube: 'cubed',
  trim: 'trimmed',
  halve: 'halved',
  mince: 'minced',
  cut: 'prepped',
};
const MANNER = '(?:finely|roughly|thinly|coarsely|very thinly)';
const CUT_WORDS = Object.keys(CUT_PARTICIPLE).join('|');
/** Verbs a recipe's actions start with; where one starts, a new action starts. */
const ACTION_WORDS = [
  CUT_WORDS,
  'peel|beat|whisk|drain|rinse|crumble|crush|remove|add|toss|heat|fry|cook|soften|stir-fry|stir|brown|roast|bake',
  'boil|simmer|serve|mix|season|spread|fill|push|pat|place|put|pour|top|layer|arrange|scatter|sprinkle|warm|melt',
  'combine|fold|grill|sauté|saute|sear|transfer|squeeze|zest|wash|tear|mash|spoon|divide|sweat|steam|blend|scoop',
].join('|');
/** What may follow the objects of a cut: "thinly", "lengthways", "into 1 cm cubes". */
const CUT_HOW = `(?:\\s+(?:${MANNER}|lengthways|lengthwise|in half))?(?:\\s+into\\s+(?:[a-z0-9-]+\\s+){0,3}?(?:strips|rings|cubes|chunks|florets|half-moons|wedges|rounds|sticks|matchsticks|pieces|slices|batons|dice|halves|bites))?`;
const CUT_CLAUSE = new RegExp(`^(?:${MANNER}\\s+)?(${CUT_WORDS})\\s+(.+?)(${CUT_HOW})$`, 'i');
const PEEL_AND_CUT = new RegExp(`^peel\\s+(.+?)\\s+and\\s+(?:${MANNER}\\s+)?(${CUT_WORDS})\\s+(?:it|them)(${CUT_HOW})$`, 'i');
/** Where one action ends and the next begins: ", ", "; ", " and ", " then ", ", then ", ", and ". */
const BETWEEN_ACTIONS = new RegExp(
  `(\\s*(?:[,;]\\s*(?:and\\s+|then\\s+)?|\\s+and\\s+(?:then\\s+)?|\\s+then\\s+))(?=(?:${MANNER}\\s+)?(?:${ACTION_WORDS})\\b)`,
  'i',
);

const capitalize = (text: string) => (text ? text[0].toUpperCase() + text.slice(1) : text);
const listed = (items: string[]) =>
  items.length <= 1 ? items.join('') : `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;

/**
 * A step as it reads when the ingredients in `prepped` (keys) were cut ahead. `complete`
 * is false when a sentence still asks to cut a prepped ingredient in a way this cannot
 * rewrite; that sentence stays as written.
 */
export function stepAfterPrep(
  step: string,
  prepped: string[],
  all: Ingredient[],
): { text: string; complete: boolean } {
  if (prepped.length === 0) return { text: step, complete: true };
  // Every way the recipe may name each of its ingredients.
  const names = new Map<string, string>();
  for (const ing of all) for (const n of namesIn(ing.name, all)) if (!names.has(n)) names.set(n, ing.name);
  const isPrepped = (name: string) => prepped.includes(name);

  /** "the onion and carrots" → [["onion", "onion"], ["carrots", "carrots"]] (as written, key), or null. */
  const objectsOf = (text: string): [string, string][] | null => {
    const parts = text
      .toLowerCase()
      .split(/\s*,\s*(?:and\s+)?|\s+and\s+/)
      .map(p => p.replace(/^(?:the|both)\s+/, '').trim());
    const found: [string, string][] = [];
    for (const part of parts) {
      const name = names.get(part);
      if (!name) return null;
      found.push([part, name]);
    }
    return found.length > 0 ? found : null;
  };

  /** A cut: its verb as written ("Finely dice"), its objects, and how ("into thin strips"). */
  type Cut = { verb: string; said: string; objects: [string, string][]; how: string };
  const parseCut = (action: string): Cut | null => {
    const peeled = action.match(PEEL_AND_CUT);
    if (peeled) {
      const objects = objectsOf(peeled[1]);
      if (!objects) return null;
      return { verb: peeled[2].toLowerCase(), said: `peel the ${listed(objects.map(([w]) => w))} and cut them`, objects, how: peeled[3] };
    }
    const m = action.match(CUT_CLAUSE);
    const objects = m && objectsOf(m[2]);
    if (!m || !objects) return null;
    return { verb: m[1].toLowerCase(), said: action.slice(0, action.toLowerCase().indexOf(m[1].toLowerCase()) + m[1].length), objects, how: m[3] };
  };

  /** "the diced onion and carrots and the sliced peppers": what was cut ahead, named as cut. */
  const asCut = (cuts: { verb: string; done: [string, string][] }[]) =>
    listed(cuts.map(({ verb, done }) => `the ${CUT_PARTICIPLE[verb]} ${listed(done.map(([said]) => said))}`));

  const rewrite = (sentence: string): string | null => {
    const end = sentence.match(/[.;]?\s*$/)![0];
    const body = sentence.slice(0, sentence.length - end.length);
    // Actions and what stands between them, alternating: [action, between, action, …].
    const pieces = body.split(BETWEEN_ACTIONS);
    const actions = pieces.filter((_, i) => i % 2 === 0);
    const between = pieces.filter((_, i) => i % 2 === 1);

    const out: { text: string; before: string }[] = [];
    let touched = false;
    // Cuts right before this action of which something was prepped: the action may refer to them.
    let recent: { verb: string; done: [string, string][]; rest: [string, string][] }[] = [];
    // Something was taken out and nothing has named it since: a later "it" or "both" is unclear.
    let dangling = false;

    for (let i = 0; i < actions.length; i++) {
      const action = actions[i];
      const before = i === 0 ? '' : between[i - 1];
      const cut = parseCut(action.trim());
      if (cut) {
        const done = cut.objects.filter(([, name]) => isPrepped(name));
        const rest = cut.objects.filter(([, name]) => !isPrepped(name));
        if (done.length > 0) {
          touched = true;
          dangling = true;
          recent.push({ verb: cut.verb, done, rest });
          if (rest.length > 0) {
            out.push({ text: `${cut.said} the ${listed(rest.map(([said]) => said))}${cut.how}`, before });
          } else if (i === actions.length - 1 && /\band\b/.test(before)) {
            // "A, B and C" without C reads "A and B".
            const last = out[out.length - 1];
            if (last && /^\s*,\s*$/.test(last.before)) last.before = before;
          }
          continue;
        }
        out.push({ text: action, before });
        continue;
      }

      if (recent.length > 0) {
        const rest = recent.flatMap(r => r.rest);
        const cuts = recent;
        recent = [];
        // "… and soften it/them/both in the oil"
        const pronoun = action.match(/^([a-z-]+)\s+(it|them|both)\b(.*)$/i);
        if (pronoun) {
          const [, act, , tail] = pronoun;
          const text =
            rest.length === 0
              ? `${act} ${asCut(cuts)}${tail}`
              : `${act} ${rest.length === 1 ? 'it' : 'them'} with ${asCut(cuts)}${tail}`;
          out.push({ text, before });
          dangling = false;
          continue;
        }
        // "… toss with the oil and roast": the action takes the cut ingredient without naming it.
        const implied = action.match(/^([a-z-]+)(\s+(?:with|on|in|into|onto)\b.*)$/i);
        if (implied && rest.length === 0) {
          out.push({ text: `${implied[1]} ${asCut(cuts)}${implied[2]}`, before });
          dangling = false;
          continue;
        }
      }
      // Anything that still points back at what was taken out cannot be read any more.
      if (dangling && /\b(it|them|both)\b/i.test(action)) return null;
      out.push({ text: action, before });
    }
    // "A, B, and C" without B reads "A and C".
    if (out.length === 2) out[1].before = out[1].before.replace(/^\s*,\s*and\s+/, ' and ');
    if (!touched) return null;
    if (out.length === 0) return '';
    const joined = out.map((o, i) => (i === 0 ? o.text : o.before + o.text)).join('');
    const first = /^[A-Z]/.test(sentence.trimStart()) ? capitalize(joined.trimStart()) : joined.trimStart();
    return first + end;
  };

  // Whether a sentence tells to cut one of the prepped ingredients ("…, dice the onion").
  const preppedWords = [...names].filter(([, name]) => isPrepped(name)).map(([word]) => escape(word));
  if (preppedWords.length === 0) return { text: step, complete: true };
  const asksToCut = new RegExp(
    `(?:^|[,;]\\s*|\\band\\s+|\\bthen\\s+)(?:${MANNER}\\s+)?(?:${CUT_WORDS})\\s+(?:(?:the|both)\\s+)?(?:[a-z-]+(?:,|\\s+and)?\\s+){0,3}?(?:${preppedWords.join('|')})\\b`,
    'i',
  );

  let complete = true;
  const out: string[] = [];
  for (const sentence of step.split(/(?<=[.;])\s+/)) {
    if (!asksToCut.test(sentence)) {
      out.push(sentence);
      continue;
    }
    const next = rewrite(sentence);
    if (next === null) {
      complete = false;
      out.push(sentence);
    } else if (next) {
      out.push(next);
    }
  }
  // A sentence that went may leave the one before it ending in ";".
  let text = out.join(' ').replace(/;\s*$/, '');
  if (text && out.length > 0 && /^[a-z]/.test(text)) text = capitalize(text);
  return { text, complete };
}
