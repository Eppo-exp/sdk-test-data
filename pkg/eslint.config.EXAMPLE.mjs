// Copy & rename this file into typescript project roots and install the following dev deps
// yarn add prettier eslint typescript-eslint eslint-plugin-prettier eslint-config-prettier --dev

import globals from 'globals';
import pluginJs from '@eslint/js';
import tseslint from 'typescript-eslint';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';

export default [
  { files: ['**/*.{js,mjs,cjs,ts}'] },
  { languageOptions: { globals: globals.browser } },
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  eslintPluginPrettierRecommended,
 { ignores: ["dist/**"] }, // Ignore built artifacts
];

