module.exports = [
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/web-build/**',
      '**/.expo/**',
      '**/.expo-shared/**',
      '**/.metro-cache/**',
      '**/android/**',
      '**/ios/**',
      'web-admin/**',
      'backend/**',
      'tem-aki-front-adm/**',
    ],
  },
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    rules: {},
  },
];
