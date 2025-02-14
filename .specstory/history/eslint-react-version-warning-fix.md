## SpecStory

## ESLint React Version Warning Fix (11/6/2024, 2:18:11 PM)

_**User**_

Warning: React version not specified in eslint-plugin-react settings. See https://github.com/jsx-eslint/eslint-plugin-react#configuration

---

_**Assistant**_

To fix the React version warning, you need to add settings for the React version in your ESLint configuration. Here's how to modify your config file:

```javascript:eslint.config.mjs
// ... existing imports ...

/** @type {import('eslint').Linter.Config[]} */
export default [
  { files: ["**/*.{js,mjs,cjs,ts,jsx,tsx}"] },
  {
    languageOptions: {
      // globals: globals.pluginReact,
    },
    settings: {
      react: {
        version: 'detect' // Automatically detect React version
      }
    }
  },
  // ... existing configs ...
];
```

The key change is adding the `settings` object with React version detection. This tells eslint-plugin-react to automatically detect the React version from your project's dependencies, which is generally the most maintainable approach. The warning should now be resolved.

---



---

