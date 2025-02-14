## SpecStory

## ESLint Config Migration to Flat Format (11/6/2024, 2:23:48 PM)

_**User**_


ESLint: 9.14.0

A config object is using the "ignorePatterns" key, which is not supported in flat config system.

Flat config uses "ignores" to specify files to ignore.

Please see the following page for information on how to convert your config object into the correct format:
https://eslint.org/docs/latest/use/configure/migration-guide#ignoring-files

If you're not using "ignorePatterns" directly (it may be coming from a plugin), please see the following:
https://eslint.org/docs/latest/use/configure/migration-guide#using-eslintrc-configs-in-flat-config

---

_**Assistant**_

I'll help you update the ESLint config to use the new flat config system. The main change needed is replacing `ignorePatterns` with `ignores`. Here's the update:

```javascript:eslint.config.mjs
// ... imports remain the same ...

export default [
  {
    files: ["**/*.{js,mjs,cjs,ts,jsx,tsx}"],
    ignores: ["dist/", "node_modules/", "vendor/"],  // Changed from ignorePatterns to ignores
    languageOptions: {
      parser: parserTypescript,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
      },
    },
    // ... rest of the config remains the same ...
  },
];
```

The change is simple - we just need to rename the `ignorePatterns` key to `ignores`. This is part of ESLint's flat config system migration, which aims to make configurations more consistent and easier to understand. All other configuration options remain the same.

---



---

