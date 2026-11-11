/**
 * Which ingredient a store product is, if any.
 * `rules` is one country's block from data/ingredients.json:
 *   categories: source category codes the product must be in (when given)
 *   include:    the name must contain one of these (when given)
 *   exclude:    the name must contain none of these
 */
export function matchIngredient(product, ingredients, country) {
  const name = product.name.toLowerCase();
  for (const ing of ingredients) {
    const rules = ing[country];
    if (!rules) continue;
    if (rules.categories && !rules.categories.includes(product.category)) continue;
    if (rules.include && !rules.include.some(t => name.includes(t))) continue;
    if (rules.exclude && rules.exclude.some(t => name.includes(t))) continue;
    return ing.key;
  }
  return null;
}
