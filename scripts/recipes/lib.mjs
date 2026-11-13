// Turns a hand-written recipe (data/recipes/*.json) into a row of the Supabase
// `recipes` table. Nutrition is never written by hand: it is added up from the
// per-100g values in data/ingredients.json, so a recipe can only use
// ingredients that are listed there.

export const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'];
export const DIFFICULTIES = ['quick', 'balanced', 'weekend'];
export const APPLIANCES = ['stovetop', 'oven', 'microwave', 'air fryer', 'slow cooker'];
// The categories a plan can focus on (the craving chips on the home screen).
// Three of them are facts about a recipe and are worked out here, so they mean
// the same thing for every recipe. The rest are a judgement and are written in
// the recipe's `tags`; scripts/recipes/prompts.mjs says what each one means.
export const CUISINES = ['asian', 'italian', 'mediterranean', 'mexican'];
export const AUTHORED_TAGS = [...CUISINES, 'spicy', 'fresh', 'comfort'];
export const COMPUTED_TAGS = ['quick', 'light', 'hearty'];

/** quick: on the table within this many minutes. */
export const QUICK_MAX_MINUTES = 20;
/** light: at most this many kcal per serving. */
export const LIGHT_MAX_KCAL = { breakfast: 400, lunch: 550, dinner: 650, snack: 220 };
/** hearty: at least this many kcal and this much protein per serving. */
export const HEARTY_MIN = { breakfast: { kcal: 500, protein: 20 }, lunch: { kcal: 650, protein: 30 }, dinner: { kcal: 750, protein: 30 }, snack: { kcal: 300, protein: 12 } };
// A seasoning that brings chili heat makes a dish spicy even when the tag was forgotten.
const HEAT = /chil|cayenne|sambal|harissa|sriracha|jalape|tabasco|hot sauce|gochu/i;

/** The recipe's categories: its own tags plus the computed ones. */
function categories(recipe, total) {
  const tags = new Set(recipe.tags ?? []);
  if ((recipe.seasonings ?? []).some(s => HEAT.test(s))) tags.add('spicy');
  if (recipe.prepTime <= QUICK_MAX_MINUTES) tags.add('quick');
  if (total.kcal <= LIGHT_MAX_KCAL[recipe.mealType]) tags.add('light');
  const hearty = HEARTY_MIN[recipe.mealType];
  if (total.kcal >= hearty.kcal && total.protein >= hearty.protein) tags.add('hearty');
  return [...AUTHORED_TAGS, ...COMPUTED_TAGS].filter(t => tags.has(t));
}

/** Calories per serving outside these ranges are reported, not rejected. */
const KCAL_RANGE = { breakfast: [200, 800], lunch: [350, 900], dinner: [400, 1000], snack: [150, 450] };

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

// Numbers in steps and seasonings that depend on the portion (data/portions.ts fills them in):
//   {8}        a count or an amount of water that scales with the portion
//   {n:eggs}   the number of pieces of a counted ingredient of this recipe
function markerErrors(texts, lines, defs) {
  const errors = [];
  for (const text of texts) {
    for (const [all, inner] of String(text).matchAll(/\{([^}]*)\}/g)) {
      if (/^\d+$/.test(inner)) continue;
      const key = inner.startsWith('n:') ? inner.slice(2) : null;
      const line = key && lines.find(l => l?.item === key);
      if (!line) errors.push(`${all} must be {number} or {n:ingredient of this recipe}`);
      else if (!defs.get(key)?.piece) errors.push(`${all}: "${key}" is not counted in pieces`);
    }
    if (/[{}]/.test(String(text).replace(/\{[^{}]*\}/g, ''))) errors.push(`unbalanced braces in "${text}"`);
  }
  return errors;
}

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
  for (const t of tags) {
    if (COMPUTED_TAGS.includes(t)) errors.push(`tag "${t}" is worked out from the recipe; remove it`);
    else if (!AUTHORED_TAGS.includes(t)) errors.push(`unknown tag "${t}"`);
  }
  const seasonings = recipe.seasonings ?? [];
  if (!Array.isArray(seasonings) || !seasonings.every(isText)) errors.push('seasonings must be a list of texts');
  const steps = recipe.instructions;
  if (!Array.isArray(steps) || steps.length < 2 || !steps.every(isText)) errors.push('instructions must be a list of at least 2 steps');

  const lines = Array.isArray(recipe.ingredients) ? recipe.ingredients : [];
  if (Array.isArray(steps) && Array.isArray(seasonings)) errors.push(...markerErrors([...steps, ...seasonings], lines, defs));
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

  // Categories first, then the words a free-text craving can match.
  const keywords = [...new Set([...categories(recipe, total), ...seen, ...appliances, recipe.mealType])];
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
