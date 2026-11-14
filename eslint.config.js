// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*', '.next/*', '.expo/*', 'android/*', 'ios/*'],
  },
  // Build and data scripts run in Node, not in the app bundle.
  {
    files: ['scripts/**/*.mjs'],
    languageOptions: { globals: { Buffer: 'readonly', process: 'readonly' } },
    rules: { 'expo/no-env-var-destructuring': 'off' },
  },
]);
