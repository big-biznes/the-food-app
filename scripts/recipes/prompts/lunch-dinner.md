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

- The 25 lunches have `mealType` `"lunch"` and an `id` starting with `l-`; the 25 dinners have `"dinner"` and `d-`.
- Lunches are lighter and faster: roughly 400 to 650 kcal, 30 minutes or less, and many should travel well or be good cold (wraps, grain bowls, hearty salads, soups, sandwiches, fried rice, pasta salads, omelettes). Dinners are the main cooked meal of the day: roughly 500 to 850 kcal, a protein with a starch and vegetables in some form (stir-fries, curries, pasta dishes, traybakes, stews, chili, pan-fried fish with sides). Every recipe contains at least 100 g of vegetables or legumes.
- `main` is the protein of the dish and must be one of: chicken, chicken mince, turkey, turkey mince, pork, pork mince, beef, beef mince, mixed mince, salmon, white fish, tuna, shrimp, eggs, tofu, lentils, chickpeas, kidney beans. The app plans half a week around two proteins at a time, so it needs several lunches and several dinners for each one: within this batch use no more than 12 different mains, and give every main you use at least 2 lunches and 2 dinners. Do not let chicken take over; no main gets more than 6 recipes.
- People with dietary restrictions need full weeks too. Among the lunches and again among the dinners, include at least 5 vegan recipes, at least 8 vegetarian (the vegan ones count), at least 8 gluten-free and at least 10 dairy-free. Check these against the `contains` column, not from memory.
- A focused week needs seven different lunches and six different dinners from one category, and this batch is one of several. So among the lunches, and again among the dinners, include at least 5 recipes each for `asian`, `italian`, `mediterranean` and `mexican`, at least 5 tagged `spicy`, at least 6 light and at least 6 hearty by the rules above. Include at least 6 `fresh` lunches and at least 6 `comfort` dinners. Combinations matter too: within each cuisine, make one recipe light, one spicy where the cuisine allows it, and one quick. The remaining recipes are everyday dishes without a cuisine tag.
- Use the bottled sauces in fewer than half of the recipes. Most flavour should come from the ingredients and seasonings.
- About half of each group should be `"quick"`, most of the rest `"balanced"`, and at most 4 dinners `"weekend"`.
- These already exist, so do not write them again or close variations of them: Chicken Teriyaki Stir-Fry; Beef and Broccoli Stir-Fry; Thai Coconut Chicken Curry; Garlic Shrimp Noodles; Tofu Coconut Curry; Pork Fried Rice; Teriyaki Salmon with Green Beans; Chicken Chow Mein; Spicy Beef and Green Bean Rice Bowl; Turkey and Zucchini Stir-Fry; Vegetable Egg Fried Rice; Soy-Ginger Fish with Rice; Coconut Lentil Dal; Chili con Carne; Chicken Enchiladas; Beef and Bean Burritos; Fish Tacos; Sweet Potato and Bean Chili; Loaded Chicken Burrito Bowl; Pork Tacos with Corn Salsa; Shrimp Fajitas; Turkey and Bean Chili; Mexican Stuffed Peppers; Tofu and Bean Tacos; Chicken Quesadillas; Beef Burrito Salad Bowl; Spaghetti Bolognese; Creamy Chicken and Mushroom Pasta; Pesto Salmon with Potatoes and Green Beans; Pork Ragù with Penne; Lentil Bolognese; Chicken Parmesan Bake; Shrimp Arrabbiata; Chicken and Mushroom Risotto; Eggs in Purgatory; Turkey Meatballs in Tomato Sauce; Tuna Pasta Bake; Chickpea and Spinach Pasta; Greek Chicken Traybake; Baked Fish with Tomatoes and Potatoes; Beef Kofta with Couscous; Spanish Chickpea and Spinach Stew; Lemon Herb Salmon with Couscous; Harissa Chicken with Chickpeas and Couscous; Rice-Stuffed Peppers with Feta; Pork Souvlaki with Potatoes and Tzatziki; Shrimp with Tomato and Feta; Turkey Kofta with Rice and Yogurt; Mujadara; Ratatouille with Baked Eggs; Tofu Souvlaki Bowl; Beef and Chickpea Tagine; Salmon Niçoise Salad; Lemon Garlic Chicken with Potatoes and Green Beans; Cottage Pie; Salmon with Mash and Peas; Chicken and Spinach Curry; Pork in Mustard Cream Sauce with Mash; Slow Cooker Beef Stew; Oven Fish and Chips; Turkey Steaks with Sweet Potato Mash; Chicken Meatballs in Mushroom Sauce; Meatballs in Tomato Sauce with Mash; Pork and Potato Skillet; Lentil Shepherd's Pie; Chickpea and Sweet Potato Curry; Potato, Pepper and Egg Hash; Garlic Butter Shrimp with Rice; Tuna Fishcakes with Salad; Salmon, Sweet Potato and Broccoli Traybake; Steak with Garlic Potatoes and Green Beans; Creamy Chicken and Broccoli Rice Bake; Crispy Tofu with Sweet Potato and Green Beans; Smoky Bean and Potato Stew; Turkey Burgers with Sweet Potato Wedges; Fish Pie; Honey Mustard Pork with Rice and Broccoli; Chicken Caesar-Style Salad; Thai Beef Noodle Salad; Chickpea, Avocado and Quinoa Salad; Chicken Alfredo; Beef Stroganoff; Creamy Salmon and Spinach Pasta; Peanut Tofu Stir-Fry; Lentil and Chickpea Curry; Loaded Bean and Rice Burritos; Spaghetti Carbonara; Butter Chicken with Rice; Loaded Beef Burrito Bowl; Shrimp and Egg Fried Rice; Chicken Shawarma Plate; Tofu and Lentil Bolognese; Chickpea, Tofu and Spinach Curry; Bean and Tofu Chili; Crispy Tofu with Quinoa and Greens; Lentil and Tofu Dal; Garlic Tofu Steaks with Potatoes and Green Beans; Chicken Fried Rice; Teriyaki Salmon Rice Bowl; Tofu and Broccoli Stir-Fry; Shrimp Noodle Stir-Fry; Peanut Chicken Noodle Salad; Egg Fried Rice with Peas; Spicy Beef Lettuce Cups; Spicy Coconut Chickpea Curry; Teriyaki Chicken Rice Bowl; Ginger Turkey Noodle Soup; Spicy Tofu Fried Rice; Spicy Tuna Rice Bowl; Chicken Fajita Wraps; Bean and Cheese Quesadilla; Chicken Burrito Bowl; Beef Tacos; Sweet Potato and Bean Burrito; Shrimp and Avocado Tacos; Chicken Tortilla Soup; Smoky Bean Chili; Huevos Rancheros; Turkey Taco Salad; Tofu Fajita Bowl; Bean, Corn and Avocado Salad; Caprese Pasta Salad; Tuna Pasta Salad; Minestrone; Chicken Pesto Pasta; Spinach and Mushroom Frittata; Pasta e Ceci; Quick Turkey Bolognese; Garlic Chili Shrimp Spaghetti; Salmon and Pea Pesto Pasta; Vegetable and Chickpea Pasta; Chicken Caprese Salad; Greek Chicken Salad; Chickpea Couscous Salad; Chickpea and Feta Wrap; Turkish Eggs with Garlic Yogurt; Tuna and Chickpea Salad; Lemony Lentil Soup; Chicken Gyros Wrap; Salmon Couscous Bowl; Quinoa Greek Salad; Spanish Potato Omelette; Garlic Shrimp with Zucchini Couscous; Beef Kofta Wrap; Mediterranean Tofu Couscous Bowl; Chicken Shawarma Rice Bowl; Lentil and Feta Salad; Chicken Salad Wrap; Egg Salad Sandwich; Tuna Melt Toastie; Stuffed Sweet Potato with Chickpeas; Chicken and Vegetable Soup; Ham, Cheese and Spinach Omelette; Warm Salmon and Potato Salad; Turkey, Bacon and Avocado Sandwich; Chicken Quinoa Bowl; Beef and Potato Hash; Pork Schnitzel Sandwich; Tofu Scramble Wrap; Crispy Fish Sandwich; Shrimp and Avocado Salad; Chicken Burger; Turkey and Vegetable Rice Skillet; Meatball Sandwich; Egg, Potato and Green Bean Salad; Chicken, Bacon and Corn Chowder; Chicken and Avocado Rice Bowl; Beef Burger with Potato Wedges; Steak and Onion Sandwich; Pork and Apple Salad; Chicken Pesto Panini; Beef and Bean Lunch Burritos; Salmon and Avocado Rice Bowl; Peanut Chicken Noodles; Tuna Pesto Pasta; Beef and Egg Fried Rice; Chicken, Feta and Chickpea Couscous; Tofu Peanut Rice Bowl; Lentil and Chickpea Power Bowl; Turkey and Cheese Quesadilla; Bacon, Egg and Potato Hash; Creamy Garlic Shrimp Pasta; Chicken Meatball Sub; Warm Tofu and Lentil Salad; Chickpea and Tofu Spinach Bowl; Teriyaki Tofu Rice Bowl; Bean and Tofu Burrito Bowl; Lentil and Tofu Vegetable Soup; Tofu and Pea Quinoa Stir-Fry.
