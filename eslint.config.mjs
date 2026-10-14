import tsParser from '@typescript-eslint/parser';

export default [
  {
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: { parser: tsParser, ecmaVersion: 2022, sourceType: 'module' },
    rules: {
      'no-debugger': 'error',
      'no-constant-condition': 'error',
      'no-duplicate-imports': 'error',
      eqeqeq: ['error', 'always'],
    },
  },
];
