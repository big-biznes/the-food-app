// The recipe texts in other languages (name, description, steps, seasonings).
//
// They come with the recipe rows (the `i18n` column) and are kept here, by meal id,
// instead of on the meals: a plan stores full copies of its meals, and those copies
// should neither carry three languages nor keep an old translation.

export type RecipeText = { name: string; description: string; instructions: string[]; seasonings: string[] };

type Row = { id: string; i18n?: Record<string, RecipeText> | null };

let texts = new Map<string, Record<string, RecipeText>>();
let version = 0;
const listeners = new Set<() => void>();

/** Replace the translations with those of the recipe rows just loaded. */
export function setRecipeTexts(rows: Row[]) {
  texts = new Map(rows.filter(r => r.i18n && Object.keys(r.i18n).length > 0).map(r => [`r_${r.id}`, r.i18n!]));
  version += 1;
  listeners.forEach(notify => notify());
}

/** The texts of a meal in `language`, with the cookbook's portion markers; undefined when not translated. */
export function recipeTextOf(mealId: string, language: string): RecipeText | undefined {
  return texts.get(mealId)?.[language];
}

/** For useSyncExternalStore: screens that show recipe text redraw when the translations arrive. */
export const subscribeRecipeTexts = (notify: () => void) => {
  listeners.add(notify);
  return () => {
    listeners.delete(notify);
  };
};
export const recipeTextsVersion = () => version;
