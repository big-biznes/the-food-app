// Names that are never a cooking ingredient, whatever else they contain:
// pet food, baby food, seasonings, snacks, ready meals. Keyed by the language
// a source's names are in, which is the first two letters of the source ("bgOffers" → "bg").
const NEVER = {
  bg: ['коте', 'котки', 'куче', 'пауч', 'gerber', 'hipp', 'бебешк', 'бебе', 'подправка', 'пастет', 'чипс', 'бульон', 'месеца', '4+', '6+', '8+', '12+'],
  nl: [
    'kattenvoer', 'hondenvoer', 'katten', 'honden', 'brokken', 'gourmet gold', 'cesar', 'felix', 'whiskas', 'sheba', 'pedigree', 'purina', 'iams', 'smuldier',
    'olvarit', "ella's kitchen", 'organix', 'bambix', 'nutrilon', 'babyvoeding', 'knijpfruit', 'hapje', 'maanden', 'mnd', 'm+', 'jaar', '6+', '8+', '12+', '15+',
    'chips', 'crisps', 'crackers', 'wafel', 'cookies', 'popcorn', 'zoutjes', 'noten', 'nootjes', "pinda's", "lay's", 'pringles', 'doritos', 'snack', 'chocola', 'mochi',
    'smaak', 'flavour', 'dip', 'spread', 'hoemoes', 'hummus', 'chutney', 'poeder', 'capsules',
    'verspakket', 'pakket', 'maaltijd', 'meals', 'salade', 'soep', 'soup', 'pizza', 'schotel', 'bowl', 'burger', 'quiche', 'lasagne', 'bakplaat', 'mix', 'kit',
    'knorr', 'unox', 'maggi', 'pasta pronto', 'stoom & klaar', 'vers aan tafel', 'roerbak sensatie', 'insalatissime',
    'gerookt', 'gemarin', ' gem.', 'gekruid', 'gepaneerd', 'krokant', 'gevuld', 'schnitzel', 'spies', 'rollade', 'nuggets', 'kroket', 'croquet', 'tempura',
  ],
};

// Any letter, so an accented one ("crémier") does not start a new word.
const LETTER = /\p{L}/u;

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
 *   minAmount:  the pack must hold at least this much, in its base unit (when given)
 */
export function matchIngredient(product, ingredients, source) {
  const name = product.name.toLowerCase();
  if (NEVER[source.slice(0, 2)]?.some(t => name.includes(t))) return null;
  for (const ing of ingredients) {
    const rules = ing[source];
    if (!rules) continue;
    if (rules.categories && !rules.categories.includes(product.category)) continue;
    if (rules.include && !rules.include.some(t => hasWord(name, t))) continue;
    if (rules.exclude && rules.exclude.some(t => name.includes(t))) continue;
    if (rules.minAmount && !(product.packAmount >= rules.minAmount)) continue;
    return ing.key;
  }
  return null;
}
