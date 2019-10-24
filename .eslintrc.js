module.exports = {
  env: {
    browser: true,
    es6: true,
    jest: true,
  },
  parser:  '@typescript-eslint/parser',
  extends: [
    'plugin:@typescript-eslint/recommended', 
    'plugin:prettier/recommended',
    'prettier/@typescript-eslint',
  ],
  globals: {
    Atomics: 'readonly',
    SharedArrayBuffer: 'readonly',
  },
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: 'module',
  },
  plugins: ['prettier'],
  rules: {
    'comma-dangle': [
      'error',
      'always-multiline',
    ],
    'no-await-in-loop': [0],
    quotes: ['error', 'single', { avoidEscape: true }],
    'object-curly-spacing': ['error', 'always'],
    'import/order': [
      'error',
      {
        groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
        'newlines-between': 'always',
      },
    ],
    'max-len': ['error', { code: 100, tabWidth: 2 }],
    'no-plusplus': ['error', { 'allowForLoopAfterthoughts': true }],
    'no-unused-vars': ["error", { "varsIgnorePattern": "_" }],
  },
};
