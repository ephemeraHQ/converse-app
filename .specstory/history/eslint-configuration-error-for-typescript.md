## SpecStory

## ESLint Configuration Error for TypeScript (11/6/2024, 2:25:42 PM)

_**User**_

ESLint: 9.14.0

Error: Error while loading rule '@typescript-eslint/naming-convention': You have used a rule which requires parserServices to be generated. You must therefore provide a value for the "parserOptions.project" property for @typescript-eslint/parser.
Occurred while linting /Users/thierryskoda/Programming/converse-app/utils/debug.ts
    at Object.getParserServices (/Users/thierryskoda/Programming/converse-app/node_modules/@typescript-eslint/eslint-plugin/node_modules/@typescript-eslint/utils/dist/eslint-utils/getParserServices.js:18:15)
    at create (/Users/thierryskoda/Programming/converse-app/node_modules/@typescript-eslint/eslint-plugin/dist/rules/naming-convention.js:79:38)
    at Object.create (/Users/thierryskoda/Programming/converse-app/node_modules/@typescript-eslint/eslint-plugin/node_modules/@typescript-eslint/utils/dist/eslint-utils/RuleCreator.js:38:20)
    at createRuleListeners (/Users/thierryskoda/Programming/converse-app/node_modules/eslint/lib/linter/linter.js:943:21)
    at /Users/thierryskoda/Programming/converse-app/node_modules/eslint/lib/linter/linter.js:1068:84
    at Array.forEach (<anonymous>)
    at runRules (/Users/thierryskoda/Programming/converse-app/node_modules/eslint/lib/linter/linter.js:999:34)
    at #flatVerifyWithoutProcessors (/Users/thierryskoda/Programming/converse-app/node_modules/eslint/lib/linter/linter.js:1911:31)
    at Linter._verifyWithFlatConfigArrayAndWithoutProcessors (/Users/thierryskoda/Programming/converse-app/node_modules/eslint/lib/linter/linter.js:1992:49)
    at Linter._verifyWithFlatConfigArray (/Users/thierryskoda/Programming/converse-app/node_modules/eslint/lib/linter/linter.js:2081:21)

---

_**Assistant**_

Based on the error message, we need to add the `parserOptions.project` configuration to the TypeScript parser options. This is required for certain TypeScript-specific rules like `naming-convention`. Here's how to fix it:

```eslint.config.mjs
    languageOptions: {
      parser: parserTypescript,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        project: "./tsconfig.json",  // Add this line
        tsconfigRootDir: ".",        // Add this line
      },
    },
```

This update tells the TypeScript parser where to find your TypeScript configuration file, which is necessary for type-aware linting rules. The `tsconfigRootDir` option helps the parser locate the `tsconfig.json` file relative to your project root.

If you're still getting errors after this change, make sure:
1. Your `tsconfig.json` file exists in the project root
2. The path to the `tsconfig.json` is correct relative to where ESLint is being run

---

_**User**_

same error

Oops! Something went wrong! :(

ESLint: 9.14.0

Error: Error while loading rule '@typescript-eslint/naming-convention': You have used a rule which requires parserServices to be generated. You must therefore provide a value for the "parserOptions.project" property for @typescript-eslint/parser.
Occurred while linting /Users/thierryskoda/Programming/converse-app/utils/debug.ts
    at Object.getParserServices (/Users/thierryskoda/Programming/converse-app/node_modules/@typescript-eslint/eslint-plugin/node_modules/@typescript-eslint/utils/dist/eslint-utils/getParserServices.js:18:15)
    at create (/Users/thierryskoda/Programming/converse-app/node_modules/@typescript-eslint/eslint-plugin/dist/rules/naming-convention.js:79:38)
    at Object.create (/Users/thierryskoda/Programming/converse-app/node_modules/@typescript-eslint/eslint-plugin/node_modules/@typescript-eslint/utils/dist/eslint-utils/RuleCreator.js:38:20)
    at createRuleListeners (/Users/thierryskoda/Programming/converse-app/node_modules/eslint/lib/linter/linter.js:943:21)
    at /Users/thierryskoda/Programming/converse-app/node_modules/eslint/lib/linter/linter.js:1068:84
    at Array.forEach (<anonymous>)
    at runRules (/Users/thierryskoda/Programming/converse-app/node_modules/eslint/lib/linter/linter.js:999:34)
    at #flatVerifyWithoutProcessors (/Users/thierryskoda/Programming/converse-app/node_modules/eslint/lib/linter/linter.js:1911:31)
    at Linter._verifyWithFlatConfigArrayAndWithoutProcessors (/Users/thierryskoda/Programming/converse-app/node_modules/eslint/lib/linter/linter.js:1992:49)
    at Linter._verifyWithFlatConfigArray (/Users/thierryskoda/Programming/converse-app/node_modules/eslint/lib/linter/linter.js:2081:21)

---

_**Assistant**_

Let's try a different approach. Since you're using the new flat config format for ESLint, we need to adjust the configuration slightly. Here's the modified version:

```eslint.config.mjs
// ... existing imports ...

export default [
  {
    files: ["**/*.{js,mjs,cjs,ts,jsx,tsx}"],
    ignores: ["dist/", "node_modules/", "vendor/"],
    languageOptions: {
      parser: parserTypescript,
      parserOptions: {
        ecmaFeatures: {
          jsx: true
        },
        ecmaVersion: "latest",
        sourceType: "module",
        project: true  // Changed this line
      },
    },
    // ... rest of the config ...
  }
];
```

If that doesn't work, we could try an alternative approach by either:

1. Removing the `naming-convention` rule temporarily:
```eslint.config.mjs
// ... existing code ...
"@typescript-eslint/naming-convention": "off", // Replace the existing rule with this
```

2. Or using a simpler version of the naming convention rule that doesn't require type information:
```eslint.config.mjs
"@typescript-eslint/naming-convention": [
  "error",
  {
    selector: "default",
    format: ["camelCase"],
  },
  {
    selector: "typeLike",
    format: ["PascalCase"],
  }
]
```

Let me know if any of these solutions work for you.

---



---

