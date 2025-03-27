// While eslint-plugin-react-native fix to handle eslint flat config (https://github.com/Intellicode/eslint-plugin-react-native/issues/333#issuecomment-2150582430)
import { fixupPluginRules } from "@eslint/compat"
import pluginQuery from "@tanstack/eslint-plugin-query"
import pluginImport from "eslint-plugin-import"
import pluginReact from "eslint-plugin-react"
import pluginReactHooks from "eslint-plugin-react-hooks"
import pluginReactNative from "eslint-plugin-react-native"
import tsESLint from "typescript-eslint"
import customPlugin from "./custom-eslint-plugin/index.js"

/** @type {import('eslint').Linter.Config} */
const config = {
  files: ["**/*.{ts,tsx}"],
  ignores: [],
  languageOptions: {
    parser: tsESLint.parser,
  },
  plugins: {
    "@tanstack/query": pluginQuery,
    react: pluginReact,
    "typescript-eslint": tsESLint.plugin,
    import: pluginImport,
    "react-hooks": pluginReactHooks,
    "react-native": fixupPluginRules(pluginReactNative),
    "custom-plugin": customPlugin,
  },
  rules: {
    ...tsESLint.configs["recommended"].rules,
    ...pluginReact.configs["recommended"].rules,
    ...pluginImport.configs["recommended"].rules,
    ...pluginReactHooks.configs["recommended"].rules,
    ...pluginReactNative.configs["all"].rules,
    ...pluginQuery.configs["recommended"].rules,

    "@tanstack/query/exhaustive-deps": "error",
    "@tanstack/query/no-rest-destructuring": "warn",
    "@tanstack/query/stable-query-client": "error",
    "@tanstack/query/no-unstable-deps": "warn",

    "import/no-unresolved": "off",
    "import/no-relative-parent-imports": "off",
    "import/no-default-export": "warn",
    "import/order": "off",

    "no-restricted-imports": [
      "error",
      {
        paths: [
          {
            name: "i18n-js",
            message: "Use @i18n app module instead.",
          },
          {
            name: "react-native-reanimated",
            importNames: ["useAnimatedKeyboard"],
            message:
              "Do not use useAnimatedKeyboard from react-native-reanimated. Use our custom keyboard hook instead.",
          },
        ],
      },
    ],

    "react-hooks/exhaustive-deps": "error",
    "react-hooks/rules-of-hooks": "error",

    "react-native/no-raw-text": "off",
    "react-native/no-color-literals": "warn",
    "react-native/sort-styles": "off",
    "react-native/no-unused-styles": "off",
    "react-native/no-inline-styles": "warn",

    "react/no-unescaped-entities": "off",
    "react/prop-types": "off",
    "react/display-name": "off",
    "react/react-in-jsx-scope": "off",
    "react/jsx-key": "error",
    "react/jsx-no-bind": "off",
    "react/jsx-no-target-blank": "off", // Was causing weird eslint issues

    "typescript-eslint/no-unused-vars": [
      "warn",
      {
        vars: "all",
        varsIgnorePattern: "^_",
        args: "none",
        ignoreRestSiblings: true,
      },
    ],
    "typescript-eslint/no-explicit-any": "warn",
    "typescript-eslint/explicit-function-return-type": "off",
    "typescript-eslint/consistent-type-definitions": ["warn", "type"],

    "padding-line-between-statements": "off",
    "custom-plugin/padding-before-react-hooks": "warn",
    "custom-plugin/require-promise-error-handling": "warn",
  },
  settings: {
    "import/resolver": {
      typescript: true,
      node: true,
    },
    react: {
      version: "detect",
    },
  },
}

export default config
