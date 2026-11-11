// Names that are never a cooking ingredient, whatever else they contain:
// pet food, baby food, seasonings, snacks.
const NEVER = ['коте', 'котки', 'куче', 'пауч', 'gerber', 'hipp', 'бебешк', 'бебе', 'подправка', 'пастет', 'чипс', 'бульон', 'месеца', '4+', '6+', '8+', '12+'];

const LETTER = /[a-zа-я]/i;

/** True when `term` occurs in `name` at the start of a word, so "олио" does not match "фолио". */
function hasWord(name, term) {
  for (let i = name.indexOf(term); i !== -1; i = name.indexOf(term, i + 1)) {
    if (i === 0 || !LETTER.test(name[i - 1])) return true;
  }
  return false;
}

/**
 * Which ingredient a store product is, if any.
 * `rules` is one source's block from data/ingredients.json:
 *   categories: source category codes the product must be in (when given)
 *   include:    the name must contain one of these, at the start of a word (when given)
 *   exclude:    the name must contain none of these
 */
export function matchIngredient(product, ingredients, source) {
  const name = product.name.toLowerCase();
  if (NEVER.some(t => name.includes(t))) return null;
  for (const ing of ingredients) {
    const rules = ing[source];
    if (!rules) continue;
    if (rules.categories && !rules.categories.includes(product.category)) continue;
    if (rules.include && !rules.include.some(t => hasWord(name, t))) continue;
    if (rules.exclude && rules.exclude.some(t => name.includes(t))) continue;
    return ing.key;
  }
  return null;
}
