// Turns a hand-written recipe (data/recipes/*.json) into a row of the Supabase
// `recipes` table. Nutrition is never written by hand: it is added up from the
// per-100g values in data/ingredients.json, so a recipe can only use
// ingredients that are listed there.

export const MEAL_TYPES = ['breakfast', 'lunch', 'dinner'];
export const DIFFICULTIES = ['quick', 'balanced', 'weekend'];
export const APPLIANCES = ['stovetop', 'oven', 'microwave', 'air fryer', 'slow cooker'];
/** The craving chips on the home screen; a recipe's `tags` come from this list. */
export const TAGS = ['spicy', 'light', 'hearty', 'fresh', 'asian', 'italian', 'mediterranean', 'mexican', 'comfort', 'quick'];

/** Calories per serving outside these ranges are reported, not rejected. */
const KCAL_RANGE = { breakfast: [200, 700], lunch: [350, 900], dinner: [400, 1000] };

const NUTRIENTS = ['kcal', 'protein', 'carbs', 'fat', 'fiber', 'sugar', 'sodiumMg'];

export function indexIngredients(defs) {
  return new Map(defs.map(d => [d.key, d]));
}

/** Grams of one ingredient line, or an error message. A line gives exactly one of g, ml, pieces. */
function gramsOf(line, def) {
  const given = ['g', 'ml', 'pieces'].filter(k => line[k] != null);
  if (given.length !== 1) return { error: `"${line.item}" needs exactly one of g, ml, pieces` };
  const amount = line[given[0]];
  if (typeof amount !== 'number' || !(amount > 0)) return { error: `"${line.item}" has an invalid amount` };
  if (given[0] === 'g') return { grams: amount };
  if (given[0] === 'ml') {
    return def.densityGPerMl ? { grams: amount * def.densityGPerMl } : { error: `"${line.item}" cannot be given in ml (no density); use g` };
  }
  return def.piece ? { grams: amount * def.piece.g } : { error: `"${line.item}" cannot be given in pieces; use g` };
}

/** The ingredient as the app shows it and puts it on the shopping list. */
function toAppIngredient(line, def, grams) {
  if (line.pieces != null) {
    const { one, many, shop } = def.piece;
    const words = `${line.pieces} ${line.pieces === 1 ? one : many}`;
    // Bought by the piece (eggs, bananas): the shopping list counts pieces.
    // Otherwise (a slice of bread, a clove of garlic) it counts grams.
    return shop
      ? { name: def.key, amount: line.pieces, unit: '', label: words }
      : { name: def.key, amount: Math.round(grams), unit: 'g', label: words };
  }
  if (line.ml != null) return { name: def.key, amount: line.ml, unit: 'ml' };
  return { name: def.key, amount: line.g, unit: 'g' };
}

function dietaryTags(contains) {
  const has = c => contains.has(c);
  const animalFlesh = has('meat') || has('fish') || has('shellfish');
  const tags = [];
  if (!animalFlesh) tags.push('vegetarian');
  if (!animalFlesh && !has('dairy') && !has('egg') && !has('honey')) tags.push('vegan');
  if (!has('gluten')) tags.push('gluten-free');
  if (!has('dairy')) tags.push('dairy-free');
  if (!has('nuts')) tags.push('nut-allergy');
  if (!has('pork')) tags.push('halal');
  if (!has('pork') && !has('shellfish') && !(has('meat') && has('dairy'))) tags.push('kosher');
  return tags;
}

const isText = v => typeof v === 'string' && v.trim().length > 0;

/**
 * @returns {{ row: object | null, errors: string[], warnings: string[] }}
 * `row` is null when there are errors.
 */
export function buildRecipe(recipe, defs) {
  const errors = [];
  const warnings = [];
  const id = recipe?.id;
  if (!isText(id) || !/^[a-z0-9][a-z0-9-]*$/.test(id)) errors.push('id must be lowercase letters, digits and dashes');
  for (const field of ['name', 'description', 'emoji']) if (!isText(recipe[field])) errors.push(`${field} is missing`);
  if (!MEAL_TYPES.includes(recipe.mealType)) errors.push(`mealType must be one of ${MEAL_TYPES.join(', ')}`);
  if (!DIFFICULTIES.includes(recipe.difficulty)) errors.push(`difficulty must be one of ${DIFFICULTIES.join(', ')}`);
  if (!Number.isInteger(recipe.prepTime) || recipe.prepTime < 1 || recipe.prepTime > 240) errors.push('prepTime must be whole minutes');
  const appliances = recipe.appliances ?? [];
  for (const a of appliances) if (!APPLIANCES.includes(a)) errors.push(`unknown appliance "${a}"`);
  const tags = recipe.tags ?? [];
  for (const t of tags) if (!TAGS.includes(t)) errors.push(`unknown tag "${t}"`);
  const seasonings = recipe.seasonings ?? [];
  if (!Array.isArray(seasonings) || !seasonings.every(isText)) errors.push('seasonings must be a list of texts');
  const steps = recipe.instructions;
  if (!Array.isArray(steps) || steps.length < 2 || !steps.every(isText)) errors.push('instructions must be a list of at least 2 steps');

  const lines = Array.isArray(recipe.ingredients) ? recipe.ingredients : [];
  if (lines.length < 2) errors.push('at least 2 ingredients are needed');
  const total = Object.fromEntries(NUTRIENTS.map(n => [n, 0]));
  const contains = new Set();
  const ingredients = [];
  const seen = new Set();
  for (const line of lines) {
    const def = defs.get(line?.item);
    if (!def) {
      errors.push(`unknown ingredient "${line?.item}"`);
      continue;
    }
    if (seen.has(def.key)) errors.push(`"${def.key}" is listed twice`);
    seen.add(def.key);
    if (!def.per100g) {
      errors.push(`"${def.key}" has no nutrition data`);
      continue;
    }
    const { grams, error } = gramsOf(line, def);
    if (error) {
      errors.push(error);
      continue;
    }
    for (const n of NUTRIENTS) total[n] += (def.per100g[n] * grams) / 100;
    for (const c of def.contains ?? []) contains.add(c);
    ingredients.push(toAppIngredient(line, def, grams));
  }
  if (!seen.has(recipe.main)) errors.push('main must be the key of one of the ingredients');

  const range = KCAL_RANGE[recipe.mealType];
  if (range && errors.length === 0 && (total.kcal < range[0] || total.kcal > range[1])) {
    warnings.push(`${Math.round(total.kcal)} kcal is outside the usual ${range[0]}-${range[1]} for ${recipe.mealType}`);
  }
  if (errors.length) return { row: null, errors, warnings };

  const keywords = [...new Set([...tags, ...seen, ...appliances, recipe.difficulty, recipe.mealType])];
  return {
    errors,
    warnings,
    row: {
      id,
      name: recipe.name.trim(),
      description: recipe.description.trim(),
      meal_type: recipe.mealType,
      main: recipe.main,
      emoji: recipe.emoji,
      prep_time_min: recipe.prepTime,
      difficulty: recipe.difficulty,
      calories: Math.round(total.kcal),
      protein_g: Math.round(total.protein),
      carbs_g: Math.round(total.carbs),
      fat_g: Math.round(total.fat),
      fiber_g: Math.round(total.fiber),
      sugar_g: Math.round(total.sugar),
      sodium_mg: Math.round(total.sodiumMg),
      ingredients,
      seasonings: seasonings.map(s => s.trim()),
      instructions: steps.map(s => s.trim()),
      appliances,
      keywords,
      dietary_tags: dietaryTags(contains),
    },
  };
}

/**
 * Build every recipe. `files` is [{ name, recipes }].
 * @returns {{ rows: object[], problems: string[], warnings: string[] }}
 */
export function buildAll(files, defs) {
  const rows = [];
  const problems = [];
  const warnings = [];
  const ids = new Map();
  for (const { name, recipes } of files) {
    if (!Array.isArray(recipes)) {
      problems.push(`${name}: must contain a list of recipes`);
      continue;
    }
    recipes.forEach((recipe, i) => {
      const where = `${name} #${i + 1} (${recipe?.id ?? recipe?.name ?? '?'})`;
      const built = buildRecipe(recipe ?? {}, defs);
      for (const e of built.errors) problems.push(`${where}: ${e}`);
      for (const w of built.warnings) warnings.push(`${where}: ${w}`);
      if (!built.row) return;
      if (ids.has(built.row.id)) problems.push(`${where}: id is already used in ${ids.get(built.row.id)}`);
      ids.set(built.row.id, where);
      rows.push({ ...built.row, sort: rows.length });
    });
  }
  return { rows, problems, warnings };
}

const COLUMNS = [
  'id', 'name', 'description', 'meal_type', 'main', 'emoji', 'prep_time_min', 'difficulty',
  'calories', 'protein_g', 'carbs_g', 'fat_g', 'fiber_g', 'sugar_g', 'sodium_mg',
  'ingredients', 'seasonings', 'instructions', 'appliances', 'keywords', 'dietary_tags', 'sort',
];

const q = v =>
  typeof v === 'number' ? String(v) : typeof v === 'string' ? `'${v.replace(/'/g, "''")}'` : `'${JSON.stringify(v).replace(/'/g, "''")}'::jsonb`;

function upsertSql(rows) {
  const values = rows.map(r => `  (${COLUMNS.map(c => q(r[c])).join(', ')})`).join(',\n');
  const updates = COLUMNS.slice(1).map(c => `${c} = excluded.${c}`).join(', ');
  return `insert into public.recipes (${COLUMNS.join(', ')}) values\n${values}\non conflict (id) do update set ${updates}, updated_at = now();`;
}

function deleteSql(rows) {
  return `delete from public.recipes where id not in (${rows.map(r => q(r.id)).join(', ')});`;
}

/** A script for the Supabase SQL Editor that makes the table hold exactly `rows`. */
export function toSql(rows) {
  return [
    '-- Recipes, generated by scripts/recipes/build.mjs from data/recipes/*.json. Do not edit by hand.',
    '-- Paste into Supabase dashboard → SQL Editor and run (after supabase/recipes.sql). Safe to re-run.',
    'begin;',
    upsertSql(rows),
    '-- Recipes that are no longer in data/recipes.',
    deleteSql(rows),
    'commit;',
    '',
  ].join('\n');
}

/**
 * The same as several small scripts, for when the SQL Editor will not take the
 * whole file at once. Run them in order; the last one removes old recipes.
 */
export function toSqlParts(rows, size = 150) {
  const parts = [];
  for (let i = 0; i < rows.length; i += size) {
    parts.push(`-- Recipes ${i + 1} to ${Math.min(i + size, rows.length)} of ${rows.length}. Safe to re-run.\n${upsertSql(rows.slice(i, i + size))}\n`);
  }
  parts.push(`-- Last step: remove recipes that are no longer in data/recipes, and count.\n${deleteSql(rows)}\nselect meal_type, count(*) from public.recipes group by meal_type order by meal_type;\n`);
  return parts;
}
