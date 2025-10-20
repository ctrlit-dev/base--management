import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  { ignores: ['dist'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',
      
      // DRY-spezifische Regeln
      'no-duplicate-string': 'off', // Deaktiviert, da wir eigene Regeln haben
      
      // Verhindert wiederholte CSS-Klassen-Kombinationen
      'no-restricted-syntax': [
        'error',
        {
          selector: 'Literal[value*="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white"]',
          message: 'Verwenden Sie PrimaryButton statt wiederholter Button-Styles'
        },
        {
          selector: 'Literal[value*="px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200"]',
          message: 'Verwenden Sie SecondaryButton statt wiederholter Button-Styles'
        },
        {
          selector: 'Literal[value*="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"]',
          message: 'Verwenden Sie card-base Utility-Klasse statt wiederholter Card-Styles'
        },
        {
          selector: 'Literal[value*="flex items-center justify-between"]',
          message: 'Verwenden Sie flex-between Utility-Klasse statt wiederholter Flex-Styles'
        },
        {
          selector: 'Literal[value*="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md"]',
          message: 'Verwenden Sie form-input Utility-Klasse oder Input-Komponenten statt wiederholter Input-Styles'
        }
      ],
      
      // Verhindert zu lange className-Strings
      'max-len': [
        'warn',
        {
          code: 120,
          ignoreStrings: true,
          ignoreTemplateLiterals: true,
          ignoreRegExpLiterals: true
        }
      ],
      
      // Verhindert komplexe Template-Literals in className
      'no-template-curly-in-string': 'error',
      
      // Verhindert mehrfache Leerzeichen in className
      'no-multiple-empty-lines': [
        'error',
        {
          max: 1,
          maxEOF: 0,
          maxBOF: 0
        }
      ]
    },
  },
)