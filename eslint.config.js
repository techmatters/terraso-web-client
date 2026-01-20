import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { FlatCompat } from '@eslint/eslintrc';
import js from '@eslint/js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
});

const compatConfigs = compat.config({
  parser: '@typescript-eslint/parser',
  parserOptions: {
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
      modules: true,
    },
  },
  plugins: ['prettier', 'lodash-fp', 'jest', 'jsx-a11y'],
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react/jsx-runtime',
    'plugin:react-hooks/recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:testing-library/react',
    'plugin:jest/recommended',
    'prettier',
    'plugin:lodash-fp/recommended',
  ],
  globals: {
    global: 'readonly',
  },
  rules: {
    'prettier/prettier': 'error',
    curly: 'error',
    'react/jsx-curly-brace-presence': 'error',
    'react/prop-types': 'off',
    'react/display-name': 'off',
    'react-hooks/set-state-in-effect': 'off',
    'react-hooks/static-components': 'off',
    'react-hooks/refs': 'off',
    'react-hooks/incompatible-library': 'off',
    'react-hooks/preserve-manual-memoization': 'off',
    'react-hooks/immutability': 'off',
    'react-hooks/globals': 'off',
    'react/jsx-key': 'off',
    'react/no-children-prop': 'off',
    '@typescript-eslint/no-unused-vars': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    'testing-library/no-unnecessary-act': 'off',
    'testing-library/prefer-find-by': 'off',
    'testing-library/prefer-screen-queries': 'off',
    'testing-library/no-await-sync-events': 'off',
    'jest/valid-expect': 'off',
    'no-restricted-imports': [
      'error',
      {
        patterns: [
          {
            group: ['./*', '../*'],
            message:
              'Please do not use relative imports. Instead use absolute imports starting with terraso-web-client/*.',
          },
        ],
      },
    ],
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
  env: {
    browser: true,
  },
});

export default [
  {
    ignores: [
      'node_modules/**',
      'build/**',
      'server/**',
      'src/terrasoApi/shared/graphqlSchema/**',
    ],
  },
  ...compatConfigs.map(config => ({
    ...config,
    files: ['**/*.{js,jsx,ts,tsx}'],
  })),
];
