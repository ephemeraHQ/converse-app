## SpecStory

## Adapting ESLint Configuration for TypeScript and React (11/6/2024, 2:18:50 PM)

_**User**_

adpat this file with all this that i have here:

"use strict";

export default [
  {
    root: true,
    extends: ["universe/native", "plugin:@typescript-eslint/recommended"],
    ignorePatterns: ["dist/", "node_modules/", "vendor/"],
    languageOptions: {
      parser: "@typescript-eslint/parser",
    },
    plugins: {
      "@typescript-eslint": require("@typescript-eslint/eslint-plugin"),
      react: require("eslint-plugin-react"),
      import: require("eslint-plugin-import"),
      "react-hooks": require("eslint-plugin-react-hooks"),
      "react-native": require("eslint-plugin-react-native"),
      "custom-plugin": require("./custom-eslint-plugin"),
    },
    rules: {
      // --- Import Rules ---
      "import/no-default-export": "warn",
      "import/order": "off", // Disabled due to alias usage
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

      // --- React Hooks Rules ---
      "react-hooks/exhaustive-deps": "error", // Enforce dependencies in useEffect
      "react-hooks/rules-of-hooks": "error", // Enforce Hooks at top level

      // --- React Native Rules ---
      "react-native/no-inline-styles": "warn", // Discourage inline styles
      "react-native/no-raw-text": "error", // Ensure text in Text components

      // --- React JSX Rules ---
      "react/jsx-key": "error", // Ensure keys for array elements in JSX
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

      // --- TypeScript-Specific Rules ---
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          vars: "all",
          args: "none",
          ignoreRestSiblings: true,
        },
      ],
      "@typescript-eslint/no-explicit-any": "warn", // Discourage use of 'any' type
      "@typescript-eslint/explicit-function-return-type": "off", // We prefer inferred return types
      "@typescript-eslint/consistent-type-definitions": ["error", "type"], // Prefer type over interface
      "@typescript-eslint/naming-convention": [
        "error",
        {
          selector: "typeAlias",
          format: ["PascalCase"],
        },
      ],

      // --- Other Rules ---
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
      "prettier/prettier": "off", // Since we handle it with lint-staged

      "custom-plugin/single-function-per-file": "error",
    },
    settings: {
      react: {
        version: "detect",
      },
    },
  },
];


---

_**Assistant**_

I'll help you adapt your eslint.config.mjs file to incorporate the new configuration. Here's the updated version:

```javascript:eslint.config.mjs
import pluginTypescript from "@typescript-eslint/eslint-plugin";
import parserTypescript from "@typescript-eslint/parser";
import pluginImport from "eslint-plugin-import";
import pluginReact from "eslint-plugin-react";
import pluginReactHooks from "eslint-plugin-react-hooks";
import pluginReactNative from "eslint-plugin-react-native";
import customPlugin from "./custom-eslint-plugin";

/** @type {import('eslint').Linter.Config[]} */
export default [
  {
    files: ["**/*.{js,mjs,cjs,ts,jsx,tsx}"],
    ignorePatterns: ["dist/", "node_modules/", "vendor/"],
    languageOptions: {
      parser: parserTypescript,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
      }
    },
    plugins: {
      "@typescript-eslint": pluginTypescript,
      react: pluginReact,
      import: pluginImport,
      "react-hooks": pluginReactHooks,
      "react-native": pluginReactNative,
      "custom-plugin": customPlugin
    },
    rules: {
      "import/no-default-export": "warn",
      "import/order": "off",
      "no-restricted-imports": ["error", {
        paths: [{
          name: "i18n-js",
          message: "Use @i18n app module instead."
        }]
      }],

      "react-hooks/exhaustive-deps": "error",
      "react-hooks/rules-of-hooks": "error",

      "react-native/no-inline-styles": "warn",
      "react-native/no-raw-text": "error",

      "react/jsx-key": "error",
      "react/jsx-no-bind": ["warn", {
        ignoreRefs: true,
        allowArrowFunctions: false,
        allowFunctions: false,
        allowBind: false,
        ignoreDOMComponents: true
      }],

      "@typescript-eslint/no-unused-vars": ["warn", {
        vars: "all",
        args: "none",
        ignoreRestSiblings: true
      }],
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/explicit-function-return-type": "off",
      "@typescript-eslint/consistent-type-definitions": ["error", "type"],
      "@typescript-eslint/naming-convention": ["error", {
        selector: "typeAlias",
        format: ["PascalCase"]
      }],

      "padding-line-between-statements": [
        "warn",
        { blankLine: "always", prev: "multiline-const", next: "multiline-expression" },
        { blankLine: "always", prev: "multiline-expression", next: "multiline-const" },
        { blankLine: "always", prev: "multiline-block-like", next: "*" },
        { blankLine: "always", prev: "*", next: "multiline-block-like" }
      ],
      "prettier/prettier": "off",

      "custom-plugin/single-function-per-file": "error"
    },
    settings: {
      react: {
        version: "detect"
      }
    }
  }
];
```

Key changes made:
1. Removed unused imports (globals)
2. Updated imports to include all required plugins
3. Consolidated configuration into a single object
4. Added all the rules from your provided configuration
5. Added proper TypeScript parser configuration
6. Added ignore patterns
7. Removed the spread of tseslint configs since we're now explicitly defining rules
8. Added custom plugin configuration
9. Added proper plugin declarations
10. Removed the separate configurations and merged them into a single comprehensive config

The new configuration maintains all your specified rules while adapting them to the new ESLint flat config format.

---



---

