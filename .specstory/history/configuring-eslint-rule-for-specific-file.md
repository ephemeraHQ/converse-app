## SpecStory

## Configuring ESLint Rule for Specific File (11/6/2024, 2:30:20 PM)

_**User**_

in eslint v9 how cna i make sure that ""custom-plugin/single-function-per-file": "error"," is only applied to files in utils.ts

---

_**Assistant**_

To apply the `custom-plugin/single-function-per-file` rule only to files in `utils.ts`, you'll need to create a separate configuration object in the array. Here's how to modify your ESLint config:

```javascript:eslint.config.mjs
// ... existing imports ...

export default [
  // ... existing base config ...
  {
    files: ["**/utils.ts"],
    rules: {
      "custom-plugin/single-function-per-file": "error",
    },
  },
];
```

The key changes are:
1. Remove the `custom-plugin/single-function-per-file` rule from the main configuration
2. Add a new configuration object that targets only `utils.ts` files using the `files` pattern
3. Apply the rule specifically to those files

This way, the rule will only be enforced for files matching the `**/utils.ts` pattern, while all other ESLint rules from your base configuration will still apply to all files.

---

_**User**_

doesn't work

---

_**Assistant**_

In ESLint v9 flat config, we need to make sure the base config is extended. Here's the correct way to do it:

```javascript:eslint.config.mjs
// ... existing imports ...

const baseConfig = {
  files: ["**/*.{js,mjs,cjs,ts,jsx,tsx}"],
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
  rules: {
    // ... all your existing rules except custom-plugin/single-function-per-file ...
  },
  settings: {
    react: {
      version: "detect",
    },
  },
};

export default [
  baseConfig,
  {
    files: ["**/utils.ts"],
    plugins: {
      "custom-plugin": customPlugin,
    },
    rules: {
      "custom-plugin/single-function-per-file": "error",
    },
  },
];
```

The key changes are:
1. We need to include the plugin in the utils.ts config as well
2. The order matters - the more specific config should come after the base config
3. Make sure to remove the rule from the base config if it exists there

This should now correctly apply the rule only to utils.ts files.

---



---

