# Task

Write 25 lunch recipes and 25 dinner recipes for a meal-planning app, as JSON: one array of 50, lunches first. Each recipe is for one person.

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
- `tags`: one to three of `"spicy"`, `"light"`, `"hearty"`, `"fresh"`, `"asian"`, `"italian"`, `"mediterranean"`, `"mexican"`, `"comfort"`, `"quick"`, only where they truly fit.
- `ingredients`: 3 to 9 entries like `{"item": "rice", "g": 75}`, each item at most once.
- `seasonings`: list of short texts, may be empty.
- `instructions`: 3 to 7 steps a beginner can follow. Each step is one imperative sentence or two, with heat levels and times ("simmer for 8 to 10 minutes"), no step numbers. The steps use every listed ingredient and mention nothing that is not in `ingredients` or `seasonings`.

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

- The 25 lunches have `mealType` `"lunch"` and an `id` starting with `l-`; the 25 dinners have `"dinner"` and `d-`.
- Lunches are lighter and faster: roughly 400 to 650 kcal, 30 minutes or less, and many should travel well or be good cold (wraps, grain bowls, hearty salads, soups, sandwiches, fried rice, pasta salads, omelettes). Dinners are the main cooked meal of the day: roughly 500 to 850 kcal, a protein with a starch and vegetables in some form (stir-fries, curries, pasta dishes, traybakes, stews, chili, pan-fried fish with sides). Every recipe contains at least 100 g of vegetables or legumes.
- `main` is the protein of the dish and must be one of: chicken, chicken mince, turkey, turkey mince, pork, pork mince, beef, beef mince, mixed mince, salmon, white fish, tuna, shrimp, eggs, tofu, lentils, chickpeas, kidney beans. The app plans half a week around two proteins at a time, so it needs several lunches and several dinners for each one: within this batch use no more than 12 different mains, and give every main you use at least 2 lunches and 2 dinners. Do not let chicken take over; no main gets more than 6 recipes.
- People with dietary restrictions need full weeks too. Among the lunches and again among the dinners, include at least 5 vegan recipes, at least 8 vegetarian (the vegan ones count), at least 8 gluten-free and at least 10 dairy-free. Check these against the `contains` column, not from memory.
- Spread the cuisines: no more than a third of the recipes from any one tradition, and use the bottled sauces in fewer than half of them. Most flavour should come from the ingredients and seasonings.
- About half of each group should be `"quick"`, most of the rest `"balanced"`, and at most 4 dinners `"weekend"`.
- There are no recipes of this kind yet.
