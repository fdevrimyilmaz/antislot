// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*'],
  },
  // Detox / E2E tests (Jest-style globals)
  {
    files: [
      "**/e2e/**/*.{js,jsx,ts,tsx}",
      "e2e/**/*.{js,jsx,ts,tsx}",
      "**/*.e2e.{js,jsx,ts,tsx}",
    ],
    languageOptions: {
      globals: {
        describe: "readonly",
        it: "readonly",
        test: "readonly",
        beforeAll: "readonly",
        beforeEach: "readonly",
        afterAll: "readonly",
        afterEach: "readonly",

        device: "readonly",
        element: "readonly",
        by: "readonly",
        expect: "readonly",
        waitFor: "readonly",
      },
    },
    rules: {
      "no-undef": "off",
    },
  },
]);
