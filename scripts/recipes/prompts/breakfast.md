# Task

Write 40 breakfast recipes for a meal-planning app, as JSON. Each recipe is for one person.

## How the recipes are used

The app plans a week of meals for one person, builds a shopping list from the recipes and compares supermarket prices for it. Two things follow from that, and they are the reason for the strict rules below:

- Calories and macros are **not** written by you. A script adds them up from the ingredient amounts, using a nutrition table with one entry per ingredient. So do not include any nutrition numbers, and be accurate with amounts: they are what the numbers are computed from.
- Every ingredient must be one of the items in the table below, spelled exactly as in the `item` column. Prices and nutrition are looked up by that name, and a recipe with any other ingredient is rejected. If a dish needs something that is not in the table, pick a different dish; do not substitute silently and do not invent items.

## Ingredients you can use

| item | the weight means | amount can be given in | contains |
|---|---|---|---|
| chicken mince | raw | g | meat |
| chicken | raw | g | meat |
| turkey mince | raw | g | meat |
| turkey | raw | g | meat |
| pork mince | raw | g | meat, pork |
| pork | raw | g | meat, pork |
| beef mince | raw | g | meat |
| beef | raw | g | meat |
| mixed mince | raw | g | meat, pork |
| salmon | raw | g | fish |
| shrimp | raw, peeled | g | shellfish |
| tofu | as sold | g | - |
| lentils | dry | g | - |
| rice | dry | g | - |
| pasta | dry | g | gluten |
| noodles | dry | g | gluten, egg |
| quinoa | dry | g | - |
| potatoes | raw | g | - |
| tortilla | as sold | g, pieces (1 tortilla = 60 g) | gluten |
| onion | raw | g | - |
| carrots | raw | g | - |
| broccoli | raw | g | - |
| green beans | raw | g | - |
| peppers | raw | g | - |
| spinach | raw | g | - |
| zucchini | raw | g | - |
| oil | as sold | g, ml | - |
| tomato sauce | as sold | g, ml | - |
| cream sauce | as sold | g, ml | dairy |
| garlic sauce | as sold | g, ml | egg, dairy |
| pesto | as sold | g, ml | dairy, nuts |
| soy sauce | as sold | g, ml | gluten |
| teriyaki | as sold | g, ml | gluten |
| eggs | raw, without shell | g, pieces (1 egg = 55 g) | egg |
| coconut milk | canned | g | - |
| milk | as sold | g, ml | dairy |
| greek yogurt | as sold | g | dairy |
| yogurt | as sold | g | dairy |
| cottage cheese | as sold | g | dairy |
| feta | as sold | g | dairy |
| mozzarella | as sold | g | dairy |
| parmesan | as sold | g | dairy |
| cheese | as sold | g | dairy |
| peanut butter | as sold | g | nuts |
| butter | as sold | g | dairy |
| oats | dry | g | gluten |
| bread | as sold | g, pieces (1 slice = 35 g) | gluten |
| flour | dry | g | gluten |
| couscous | dry | g | gluten |
| banana | peeled | g, pieces (1 banana = 120 g) | - |
| apple | raw, with skin | g, pieces (1 apple = 180 g) | - |
| blueberries | raw or frozen | g | - |
| strawberries | raw or frozen | g | - |
| lemon | peeled | g, pieces (1 lemon = 60 g) | - |
| avocado | flesh only | g, pieces (1 avocado = 140 g) | - |
| chopped tomatoes | canned | g | - |
| tomato paste | as sold | g | - |
| tomato | raw | g | - |
| cucumber | raw | g | - |
| mushrooms | raw | g | - |
| garlic | peeled | g, pieces (1 clove = 4 g) | - |
| cauliflower | raw | g | - |
| sweet potato | raw | g | - |
| lettuce | raw | g | - |
| peas | frozen or canned, drained | g | - |
| corn | canned, drained | g | - |
| honey | as sold | g | honey |
| olive oil | as sold | g, ml | - |
| chickpeas | canned, drained | g | - |
| kidney beans | canned, drained | g | - |
| tuna | canned in water, drained | g | fish |
| white fish | raw | g | fish |
| bacon | raw | g | meat, pork |
| ham | as sold | g | meat, pork |

Reading the table:

- Amounts are for **one serving** and are the weight **as bought, before cooking**: raw meat and fish, dry rice, pasta, oats and lentils, drained weight for canned beans, chickpeas, corn and tuna. A serving of dry rice, pasta, noodles, quinoa or couscous is usually 60 to 90 g, of meat or fish 120 to 180 g, of dry lentils 60 to 80 g.
- Give each amount in exactly one form: `"g"`, or `"ml"` / `"pieces"` where the table allows it. Use pieces for things people count (2 eggs, 1 banana, 2 slices of bread, 2 cloves of garlic, 1 tortilla) and whole numbers of pieces.
- List the fat the food is cooked in (oil, olive oil, butter) with a realistic amount, typically 5 to 15 g. It is a large part of the calories and leaving it out makes the numbers wrong.
- The bottled sauces (soy sauce, teriyaki, pesto, garlic sauce, cream sauce, tomato sauce) are store-bought products. Use them in the amounts a cook would: about 10 to 20 g of soy sauce, 20 to 40 g of teriyaki or pesto, 50 to 100 g of cream sauce, 100 to 200 g of tomato sauce.
- The `contains` column decides the dietary labels (vegetarian, vegan, gluten-free, dairy-free, nut-free, halal, kosher). Note the less obvious ones: soy sauce and teriyaki contain gluten, noodles contain gluten and egg, pesto contains dairy and nuts, oats count as gluten, honey is not vegan.

Things with no meaningful calories go in `seasonings` instead, as short free text: salt, pepper, dried herbs, ground spices, chili flakes, a squeeze of lemon juice, vinegar, mustard, a stock cube, water. They are shown to the cook but not counted or put on the shopping list, so never put anything with real calories there (no sugar, flour, oil, nuts, cheese, wine or sauces).

## Format

Answer with one JSON array and nothing else: no introduction, no comments inside the JSON, no trailing commas. Each recipe is an object with exactly these fields:

- `id`: unique, lowercase letters, digits and dashes, starting with the prefix given below.
- `name`: what the dish is actually called, as it would appear in a cookbook ("Chicken Fajita Wraps", not "Chicken Tortilla 3"). Every name is different.
- `description`: one plain sentence fragment saying what it is, at most 90 characters.
- `mealType`: given below.
- `prepTime`: total minutes from start to plate, cooking included.
- `difficulty`: `"quick"` (20 minutes or less, little technique), `"balanced"` (about 20 to 40 minutes) or `"weekend"` (longer or more involved).
- `appliances`: what is needed, from `"stovetop"`, `"oven"`, `"microwave"`, `"air fryer"`, `"slow cooker"`; an empty list for no-cook dishes.
- `emoji`: one emoji that fits the dish.
- `main`: the `item` the dish is built around. It must be one of the recipe's ingredients.
- `tags`: the categories below that the dish belongs to, from `"asian"`, `"italian"`, `"mediterranean"`, `"mexican"`, `"spicy"`, `"fresh"`, `"comfort"`. Often one or two, sometimes none.
- `ingredients`: 3 to 9 entries like `{"item": "rice", "g": 75}`, each item at most once.
- `seasonings`: list of short texts, may be empty.
- `instructions`: 3 to 7 steps a beginner can follow. Each step is one imperative sentence or two, with heat levels and times ("simmer for 8 to 10 minutes"), no step numbers. The steps use every listed ingredient and mention nothing that is not in `ingredients` or `seasonings`.

The app scales every recipe to the person, so a number that depends on how much is cooked is written in braces and the app fills it in: `"roll into {8} small balls"`, `"shape into {4} patties"`, `"{350} ml water"` in `seasonings`. Use `{n:item}` for the count of an ingredient given in pieces: `"make {n:eggs} wells and crack in the eggs"`. Do not put ingredient amounts in the steps (the app shows them next to each step), and leave times, temperatures and spoon measures of spices as plain numbers.

## Categories

Users can ask for a week that focuses on a category or a combination ("Mexican", "Asian and spicy", "light and quick"), and the app then only picks recipes that carry it. A tag is therefore a promise: give one only when someone who asked for that category would agree the dish belongs, and never to make a quota.

You assign these in `tags`:

- `asian`: East and Southeast Asian cooking. Stir-fries, fried rice, noodle dishes, teriyaki, coconut curries; soy sauce, ginger, garlic, chili, sesame-style flavours.
- `italian`: pasta dishes, risotto-style rice, pesto, tomato and basil, mozzarella and parmesan, frittata.
- `mediterranean`: Greek, Spanish, Turkish, Levantine and North African cooking. Olive oil, lemon, feta, yogurt, chickpeas, cucumber and tomato, couscous, oregano, cumin, paprika. Italian dishes get `italian` instead, not both.
- `mexican`: Mexican and Tex-Mex. Tortillas, kidney beans, corn, avocado, tomato salsa, cumin, chili, lime: burritos, tacos, quesadillas, fajitas, chili con carne, burrito bowls.
- `spicy`: clearly hot when cooked as written, from chili flakes, fresh chili, cayenne, sambal or similar in `seasonings`. Not for dishes that are merely well seasoned.
- `fresh`: raw or barely cooked vegetables or fruit are a large part of the plate. Salads, grain bowls with raw toppings, cold wraps, yogurt and fruit bowls. Not for stews, bakes or anything where the produce is cooked down.
- `comfort`: warm, rich and familiar. Creamy pasta, stews, chili, mash, bakes, porridge, pancakes.

A dish from one cuisine gets that cuisine only; give two cuisines only to a real fusion dish. Everyday dishes with no clear origin (an omelette, chicken with potatoes and green beans) get no cuisine tag.

These three are **not** written by you. The build script works them out from the recipe, so do not put them in `tags`, but know the rules because users ask for them just as often and each needs enough recipes:

- quick: `prepTime` of 20 minutes or less.
- light: at most 400 kcal for a breakfast, 550 for a lunch, 650 for a dinner. In practice: lean protein or legumes, plenty of vegetables, a smaller portion of starch, little oil, cheese or cream.
- hearty: at least 500 kcal and 20 g protein for a breakfast, 650 kcal and 30 g for a lunch, 750 kcal and 30 g for a dinner.

You cannot compute calories exactly and are not asked to; as a rough guide per 100 g: oil 884 kcal, butter 717, cheese 300 to 390, dry rice, pasta, oats and couscous 365 to 380, bread 250, raw chicken breast 120, raw salmon 208, mince 140 to 260, eggs 143 (one egg 80), drained canned beans and chickpeas 125 to 140, potatoes 77, most vegetables 15 to 40.

Here is one finished recipe so you can see the level of detail:

```json
{
  "id": "b-shakshuka",
  "name": "Shakshuka",
  "description": "Eggs poached in a spiced tomato and pepper sauce",
  "mealType": "breakfast",
  "prepTime": 25,
  "difficulty": "balanced",
  "appliances": [
    "stovetop"
  ],
  "emoji": "🍅",
  "main": "eggs",
  "tags": [
    "mediterranean",
    "spicy",
    "comfort"
  ],
  "ingredients": [
    {
      "item": "eggs",
      "pieces": 2
    },
    {
      "item": "chopped tomatoes",
      "g": 250
    },
    {
      "item": "peppers",
      "g": 80
    },
    {
      "item": "onion",
      "g": 60
    },
    {
      "item": "garlic",
      "pieces": 2
    },
    {
      "item": "olive oil",
      "g": 10
    }
  ],
  "seasonings": [
    "1 tsp ground cumin",
    "1 tsp paprika",
    "pinch of chili flakes",
    "salt",
    "black pepper"
  ],
  "instructions": [
    "Slice the onion and pepper and finely chop the garlic",
    "Heat the olive oil in a small pan and soften the onion and pepper for 5 minutes, then add the garlic and spices for 1 minute",
    "Pour in the chopped tomatoes, season and simmer for 8 to 10 minutes until slightly thickened",
    "Make two wells in the sauce, crack in the eggs, cover and cook 4 to 5 minutes until the whites are set"
  ]
}
```

## Quality bar

These should be dishes people really cook and would be glad to see in a weekly plan: familiar classics and good everyday cooking from different cuisines, not ingredient combinations with a name attached. Before you include a recipe, check that the amounts make a sensible single portion, that the method would work as written, and that the cooking times are realistic. Favour recipes that share common ingredients with each other (onion, peppers, rice, tomatoes), because the app shops for several days at once and leftovers of an ingredient get used up that way.

Write in English with metric units.

If I answer with "more", write another batch of the same size under the same rules, with new ids and without repeating any dish from your earlier answers. If I paste error messages from the build script, return the corrected recipes in full.

## This batch

- `mealType` is `"breakfast"` for all of them, and every `id` starts with `b-`.
- They must be things people eat in the morning: porridge and overnight oats, yogurt and cottage cheese bowls, eggs in their many forms, toast and sandwiches, pancakes, breakfast wraps, savoury hashes. No lunch or dinner dishes relabelled as breakfast.
- Aim for roughly 300 to 600 kcal per serving, which in practice means: one portion of oats is 40 to 70 g, of yogurt 150 to 250 g, 2 or 3 eggs, 1 or 2 slices of bread.
- Most mornings are rushed: at least 25 of the 40 should take 15 minutes or less, and at least 8 should need no cooking at all. The rest can be slower weekend breakfasts.
- Mix sweet and savoury about evenly.
- A focused week needs six different breakfasts, so make sure there are at least 10 light and at least 8 hearty breakfasts by the rules above, at least 8 tagged `fresh` and at least 8 tagged `comfort`. Cuisine tags are rare at breakfast; use them only where they are true (a breakfast burrito, shakshuka), and include at least 4 such `mexican` and 4 `mediterranean` breakfasts.
- People with dietary restrictions need a full week of different breakfasts, so include at least 8 vegan recipes, at least 10 gluten-free, at least 10 dairy-free and at least 30 without meat or fish. Check these against the `contains` column, not from memory.
- These already exist, so do not write them again or close variations of them: Banana Peanut Butter Oatmeal; Apple Cinnamon Oatmeal; Coconut Berry Overnight Oats; Peanut Butter Banana Toast; Avocado Tomato Toast; Avocado Toast with Fried Eggs; Greek Yogurt Berry Bowl; Apple Bircher Muesli; Spinach and Feta Scrambled Eggs; Pepper and Mushroom Omelette; Ham and Cheese Omelette with Toast; Bacon and Eggs with Toast; Tofu Scramble on Toast; Chickpea and Potato Breakfast Hash; Shakshuka; Cottage Cheese Bowl with Apple and Honey; Pancakes with Strawberries; Banana Egg Pancakes; Breakfast Burrito; Sweet Potato and Bean Hash; Spicy Egg and Avocado Breakfast Taco; Chili Scrambled Eggs on Toast; Spicy Tofu and Bean Breakfast Wrap; Harissa Chickpeas on Toast; Menemen; Yogurt, Banana and Oat Bowl; Cottage Cheese and Tomato Toast; Fruit Salad with Yogurt; Dairy-Free Banana Berry Porridge; Strawberry Banana Smoothie Bowl; French Toast with Strawberries; Full Cooked Breakfast; Egg, Ham and Cheese Toastie; Scrambled Eggs with Salmon on Toast; Banana Oat Pancakes; Cheese and Tomato Omelette; Avocado and Chickpea Smash on Toast; Tofu and Vegetable Scramble; Creamy Rice Porridge with Cinnamon Apple; Feta, Tomato and Egg Toast; Big Breakfast Burrito; Peanut Butter Protein Oats; Egg, Bacon and Cheese Sandwich; Salmon, Avocado and Egg Toast; Loaded Potato, Ham and Cheese Omelette; Tofu Scramble Burrito; Peanut Butter Banana Overnight Oats; Greek Yogurt Power Bowl; Cheesy Egg and Spinach Quesadilla; Banana Pancake Stack; Tofu and Bean Breakfast Plate.
