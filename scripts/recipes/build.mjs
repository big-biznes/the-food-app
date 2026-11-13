#!/usr/bin/env node
// Builds the recipes table from data/recipes/*.json. Calories and macros are
// computed from data/ingredients.json; a recipe that uses an unknown
// ingredient, or is malformed, stops the build.
//
//   node scripts/recipes/build.mjs            check, and write supabase/recipes_data.sql
//   node scripts/recipes/build.mjs --check    check only
//   node scripts/recipes/build.mjs --split    check, and write supabase/recipes_data/01.sql, 02.sql, …
//                                             (small scripts, for when the SQL Editor rejects the big one)
//   node scripts/recipes/build.mjs --push     check, and write straight to Supabase
//                                             (env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

import { mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { AUTHORED_TAGS, COMPUTED_TAGS, MEAL_TYPES, buildAll, indexIngredients, toSql, toSqlParts } from './lib.mjs';

const args = process.argv.slice(2);
const root = new URL('../../', import.meta.url);
const read = path => JSON.parse(readFileSync(new URL(path, root), 'utf8'));

const defs = indexIngredients(read('data/ingredients.json'));
const dir = new URL('data/recipes/', root);
const files = [];
const problems = [];
for (const name of readdirSync(dir).filter(f => f.endsWith('.json')).sort()) {
  try {
    files.push({ name, recipes: read(`data/recipes/${name}`) });
  } catch (e) {
    problems.push(`${name}: not valid JSON (${e.message})`);
  }
}

const built = buildAll(files, defs);
problems.push(...built.problems);
const { rows, warnings } = built;

const count = type => rows.filter(r => r.meal_type === type).length;
console.log(`${rows.length} recipes: ${MEAL_TYPES.map(type => `${count(type)} ${type}`).join(', ')}`);

// A plan focused on a category needs a week of different meals from it.
const WEEK = 7;
const thin = [];
console.log('\nRecipes per category (a focused week needs 7 of a meal type):');
console.log('  ' + ''.padEnd(14) + MEAL_TYPES.map(t => t.padStart(10)).join(''));
for (const tag of [...AUTHORED_TAGS, ...COMPUTED_TAGS]) {
  const counts = MEAL_TYPES.map(type => rows.filter(r => r.meal_type === type && r.keywords.includes(tag)).length);
  console.log('  ' + tag.padEnd(14) + counts.map(n => String(n).padStart(10)).join(''));
  MEAL_TYPES.forEach((type, i) => {
    // Breakfasts rarely belong to a cuisine, and snacks are not chosen by focus; that is not a gap.
    if (counts[i] < WEEK && type !== 'snack' && !(type === 'breakfast' && AUTHORED_TAGS.indexOf(tag) < 4)) thin.push(`${tag} ${type} (${counts[i]})`);
  });
}
if (thin.length) console.log(`\nToo few for a full focused week, the plan fills up with the closest other meals:\n  ${thin.join(', ')}`);

if (warnings.length) console.log(`\n${warnings.length} to look at:\n` + warnings.map(w => `  ${w}`).join('\n'));
if (problems.length) {
  console.error(`\n${problems.length} problems, nothing written:\n` + problems.map(p => `  ${p}`).join('\n'));
  process.exit(1);
}

if (args.includes('--check')) {
  console.log('\nAll recipes are valid.');
} else if (args.includes('--split')) {
  const out = new URL('supabase/recipes_data/', root);
  rmSync(out, { recursive: true, force: true });
  mkdirSync(out);
  const parts = toSqlParts(rows);
  parts.forEach((sql, i) => writeFileSync(new URL(`${String(i + 1).padStart(2, '0')}.sql`, out), sql));
  console.log(`\nWrote ${parts.length} scripts to supabase/recipes_data/. Run them in the Supabase SQL Editor in order.`);
} else if (args.includes('--push')) {
  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY, or run without --push to get a SQL file.');
    process.exit(1);
  }
  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
  const runStart = new Date().toISOString();
  for (let i = 0; i < rows.length; i += 500) {
    const batch = rows.slice(i, i + 500).map(r => ({ ...r, updated_at: runStart }));
    const { error } = await supabase.from('recipes').upsert(batch, { onConflict: 'id' });
    if (error) {
      console.error(error.message);
      process.exit(1);
    }
  }
  const { error } = await supabase.from('recipes').delete().lt('updated_at', runStart);
  if (error) console.warn(`! could not remove old recipes: ${error.message}`);
  console.log(`\nWrote ${rows.length} recipes to Supabase.`);
} else {
  writeFileSync(new URL('supabase/recipes_data.sql', root), toSql(rows));
  console.log('\nWrote supabase/recipes_data.sql. Paste it into the Supabase SQL Editor and run it.');
}
