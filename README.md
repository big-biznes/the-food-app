# fudapp

A week of meals, sized for you, with the shopping list to match. Expo (React Native) app with a Supabase backend; English, Bulgarian and Dutch.

## Run it

```bash
npm install
cp .env.example .env        # Supabase URL and anon key, Google web client ID
npx expo run:android        # development build on a phone or emulator
```

`npm test` runs the unit tests, `npx tsc --noEmit` the type check, `npm run lint` the linter.

## Backend

Run the scripts in `supabase/` in the Supabase SQL Editor. All of them are safe to re-run.

| Script | What it sets up |
| --- | --- |
| `schema.sql` | per-user data, account deletion, crash reports, feedback |
| `recipes.sql`, then `recipes_data.sql` | the recipes table and its rows (`recipes_data/` holds the same rows in smaller parts) |
| `prices.sql`, then `prices_data.sql` | shop prices |

## Content

- **Recipes** are written in `data/recipes/*.json`; their translations are in `data/recipes/i18n/<language>/`. `npm run recipes` checks them, computes the nutrition from `data/ingredients.json` and writes `supabase/recipes_data.sql`.
- **App texts** are in `locales/`.
- **Privacy Policy and Terms** are in `constants/legal/`. `npm run legal` writes them as web pages to `docs/legal/`, for the link the app stores ask for. The publisher's name and contact address go in `constants/legal/config.json`.
- **Prices** are refreshed daily by `.github/workflows/ingest-prices.yml` (`npm run ingest`).

## Release (Android)

```bash
eas build --platform android --profile production   # signed app bundle for Google Play
eas submit --platform android --profile production  # uploads it to the internal testing track
```

`eas build --profile preview` gives an APK to install directly. The build takes the `EXPO_PUBLIC_…` values from the project's EAS environment variables, not from `.env`.

A release build made on your own machine (`npx expo run:android --variant release`) is signed with the debug key unless the upload key is set in `~/.gradle/gradle.properties` (see `android/app/build.gradle`).
