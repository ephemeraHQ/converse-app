## SpecStory

## Updating ESLint Config for Flat System (11/6/2024, 2:43:43 PM)

_**User**_

A config object is using the "extends" key, which is not supported in flat config system.

Instead of "extends", you can include config objects that you'd like to extend from directly in the flat config array.

---

_**Assistant**_

I'll help you update the ESLint config to use the flat config system correctly. The main change will be to replace the `extends` field with the actual rules from the recommended configs.

```javascript:eslint.config.mjs
// ... imports remain the same ...

/** @type {import('eslint').Linter.Config[]} */
export default [
  {
    files: ["**/*.{ts,tsx}"],
    ignores: ["dist/", "node_modules/", "vendor/"],
    languageOptions: {
      parser: parserTypescript,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
      },
    },
    plugins: {
      "@typescript-eslint": pluginTypescript,
      react: pluginReact,
      import: pluginImport,
      "react-hooks": pluginReactHooks,
      "react-native": fixupPluginRules(pluginReactNative),
      "custom-plugin": customPlugin,
    },
    // Remove extends and spread the recommended configs directly
    ...pluginTypescript.configs["recommended"],
    ...pluginReactHooks.configs["recommended"],
    rules: {
      // ... rest of rules remain the same ...
    }
  },
  // ... second config object remains the same ...
];
```

The key change is removing the `extends` array and spreading the recommended configs directly into the config object. This is the proper way to handle configuration inheritance in the new flat config system. The recommended configs will be merged with your custom rules, with your custom rules taking precedence in case of conflicts.

Note that you might need to ensure that the recommended configs are compatible with the flat config system. If they're not, you might need to manually copy over their rules instead of spreading them.

---



---

