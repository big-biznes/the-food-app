// Food data in the app's language. Ingredients, amounts and shopping-list lines are
// stored in English (the price matching and the recipe data read them that way) and
// are put into the user's language only when shown.

import ingredientDefs from '@/data/ingredients.json';
import type { Ingredient } from '@/data/meals';
import type { PrepLine } from '@/data/prep';
import { parseItemText } from '@/lib/parseItem';
import i18n from '@/lib/i18n';

type Def = { key: string; aliases?: string[]; piece?: { g: number } };
const DEFS = new Map((ingredientDefs as Def[]).map(d => [d.key, d]));
const ALIASES = new Map<string, string>();
for (const d of ingredientDefs as Def[]) for (const a of [d.key, ...(d.aliases ?? [])]) ALIASES.set(a.toLowerCase(), d.key);

// Keys built at run time; i18next's typed keys cannot follow them.
const tr = (key: string, options?: Record<string, unknown>): string => String(i18n.t(key as never, options as never));
const has = (key: string) => i18n.exists(key);

/** "chicken" → "пилешко". An unknown name (typed by hand) is shown as it is. */
export function ingredientName(name: string): string {
  const key = ALIASES.get(name.toLowerCase()) ?? name;
  return has(`ingredient.${key}`) ? tr(`ingredient.${key}`) : name;
}

/** "150g", "2 tbsp", "1 can" in the app's language. */
export function amountText(amount: number, unit: string): string {
  const u = unit.toLowerCase().replace(/s$/, '');
  if (!u) return tr('unit.pieces', { count: amount });
  return has(`unit.${u}`) || has(`unit.${u}_one`) ? tr(`unit.${u}`, { count: amount }) : `${amount} ${unit}`;
}

/** How many pieces an ingredient line is, when the ingredient is counted (eggs, cloves of garlic). */
function pieces(ing: Ingredient): number | null {
  const piece = DEFS.get(ing.name)?.piece;
  if (!piece || !has(`piece.${ing.name}_one`)) return null;
  if (!ing.unit) return ing.amount;
  if (ing.label && ing.unit === 'g') return Math.max(1, Math.round(ing.amount / piece.g));
  return null;
}

/** The amount of an ingredient line on its own, for a column next to its name: "150 г", "2 яйца". */
export function ingredientAmount(ing: Ingredient): string {
  const n = pieces(ing);
  if (n != null) return tr(`piece.${ing.name}`, { count: n });
  if (!ing.unit) return ing.amount > 1 ? amountText(ing.amount, '') : '';
  return amountText(ing.amount, ing.unit);
}

/** An ingredient line in one go: "150 г пилешко", "2 скилидки чесън". */
export function ingredientLine(ing: Ingredient): string {
  const n = pieces(ing);
  if (n != null) return tr(`piece.${ing.name}`, { count: n });
  const name = ingredientName(ing.name);
  if (!ing.unit) return ing.amount > 1 ? `${ing.amount} ${name}` : name;
  return `${amountText(ing.amount, ing.unit)} ${name}`;
}

/**
 * A shopping-list line as stored ("450g chicken", "x2 eggs") in the app's language.
 * A line typed by hand that names no known ingredient is shown as typed.
 */
export function shoppingLine(text: string): string {
  const { baseName, amount, unit } = parseItemText(text);
  const key = ALIASES.get(baseName);
  if (!key || !has(`ingredient.${key}`)) return text;
  if (amount == null) return ingredientName(key);
  return ingredientLine({ name: key, amount, unit });
}

/** A sign-in or sign-up error from Supabase in the app's language; other messages are shown as they are. */
export function authErrorText(message: string): string {
  const rules: [RegExp, string][] = [
    [/invalid login credentials/i, 'auth.invalidLogin'],
    [/already (been )?registered|already exists/i, 'auth.alreadyRegistered'],
    [/password should be at least|weak password/i, 'auth.weakPassword'],
    [/invalid.*email|email.*invalid|unable to validate email/i, 'auth.invalidEmail'],
    [/network request failed|failed to fetch|timed out/i, 'auth.network'],
  ];
  const hit = rules.find(([re]) => re.test(message));
  return hit ? tr(hit[1]) : message;
}

/** The English names of prep jobs (data/prep.ts) and their translation keys. */
const PREP_JOB: Record<string, string> = {
  dice: 'dice',
  chop: 'chop',
  slice: 'slice',
  grate: 'grate',
  shred: 'shred',
  trim: 'trim',
  halve: 'halve',
  'chop finely': 'chopFinely',
  'cut up': 'cutUp',
  cook: 'cook',
};

/** A prep-list job in the app's language: "Нарежете на кубчета 180 г лук". */
export function prepLineText(line: PrepLine): string {
  const what = line.amount != null && line.unit ? ingredientLine({ name: line.ingredient, amount: line.amount, unit: line.unit }) : ingredientName(line.ingredient);
  const verb = line.verb.toLowerCase();
  const into = verb.match(/^cut into (.+)$/);
  if (into) {
    const shape = into[1].trim();
    if (!has(`prepShape.${shape}`)) return line.label;
    return tr('prepJob.cutInto', { what, shape: tr(`prepShape.${shape}`) });
  }
  const key = PREP_JOB[verb];
  return key ? tr(`prepJob.${key}`, { what }) : line.label;
}
