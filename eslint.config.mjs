import pluginImport from "eslint-plugin-import";
import pluginReact from "eslint-plugin-react";
import pluginReactHooks from "eslint-plugin-react-hooks";
import pluginReactNative from "eslint-plugin-react-native";
import tsESLint from "typescript-eslint";
import customPlugin from "./custom-eslint-plugin/index.js";

// While eslint-plugin-react-native fix to handle eslint flat config (https://github.com/Intellicode/eslint-plugin-react-native/issues/333#issuecomment-2150582430)
import { fixupPluginRules } from "@eslint/compat";

/** @type {import('eslint').Linter.Config[]} */
export default [
  {
    files: ["**/*.{ts,tsx}"],
    ignores: [],
    languageOptions: {
      parser: tsESLint.parser,
    },
    plugins: {
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

      "import/no-unresolved": "off", // Disable since TypeScript already handles module resolution and import validation
      "import/no-relative-parent-imports": "off", // Disable for now
      "import/no-default-export": "warn",
      "import/order": "off", // Since we use @design-system/, etc... there seems to be a lot of false positives

      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "i18n-js",
              message: "Use @i18n app module instead.",
            },
          ],
        },
      ],
      "no-restricted-imports": [
        "warn",
        {
          patterns: [
            {
              group: ["../../*", "../../../*"],
              message:
                "Please use module aliases (e.g., @design-system/) instead of relative paths when going up more than one directory",
            },
          ],
        },
      ],

      "react-hooks/exhaustive-deps": "error",
      "react-hooks/rules-of-hooks": "error",

      "react-native/no-raw-text": "off", // We have so many Text wrapper components... and eslint doesn't know that OnboardingTitleSubtitle.Title is a Text component
      "react-native/no-color-literals": "warn", // We need to use the colors in theme!
      "react-native/sort-styles": "off", // Not needed
      "react-native/no-unused-styles": "off", // Because it's giving warning for styles we use in useStyles hook even though they are used
      "react-native/no-inline-styles": "warn",

      "react/no-unescaped-entities": "off", // Not needed
      "react/prop-types": "off", // Disable since we use TypeScript
      "react/display-name": "off", // Not needed
      "react/react-in-jsx-scope": "off", // Disable since we use React 18
      "react/jsx-key": "error",
      "react/jsx-no-bind": [
        "warn",
        {
          ignoreRefs: true,
          allowArrowFunctions: false,
          allowFunctions: false,
          allowBind: false,
          ignoreDOMComponents: true,
        },
      ],

      "typescript-eslint/no-unused-vars": [
        "warn",
        {
          vars: "all",
          args: "none",
          ignoreRestSiblings: true,
        },
      ],
      "typescript-eslint/no-explicit-any": "warn",
      "typescript-eslint/explicit-function-return-type": "off",
      "typescript-eslint/consistent-type-definitions": ["warn", "type"],

      "padding-line-between-statements": [
        "warn",
        {
          blankLine: "always",
          prev: "multiline-const",
          next: "multiline-expression",
        },
        {
          blankLine: "always",
          prev: "multiline-expression",
          next: "multiline-const",
        },
        { blankLine: "always", prev: "multiline-block-like", next: "*" },
        { blankLine: "always", prev: "*", next: "multiline-block-like" },
      ],

      "prettier/prettier": "off", // We use prettier manually with linted-staged for example

      "custom-plugin/padding-before-react-hooks": "warn",
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
  },
  // Custom logics to enable single function per file for files in utils directory so we can more easily implement tests for them (maybe)
  // {
  //   name: "custom/utils-typescript",
  //   files: ["utils/**/*.ts"],
  //   languageOptions: {
  //     parser: parserTypescript,
  //   },
  //   plugins: {
  //     "custom-plugin": customPlugin,
  //   },
  //   rules: {
  //     "custom-plugin/single-function-per-file": "off", // Off for now
  //   },
  // },
];
