## SpecStory

## Configuring TypeScript ESLint Plugin Recommended Rules (11/6/2024, 2:40:46 PM)

_**User**_

I want to use @typescript-eslint/eslint-plugin recommended plugin

---

_**Assistant**_

I'll help you add the recommended TypeScript ESLint plugin configuration. We need to modify the rules section to extend from the recommended configuration.

```javascript:eslint.config.mjs
// ... imports remain the same ...

export default [
  {
    files: ["**/*.{ts,tsx}"],
    // ... other config remains the same ...
    
    plugins: {
      "@typescript-eslint": pluginTypescript,
      // ... other plugins remain the same ...
    },
    
    // Add extends before rules
    extends: [
      ...pluginTypescript.configs["recommended"].extends,
      pluginTypescript.configs["recommended"],
    ],
    
    rules: {
      // ... existing rules remain the same ...
    },
    // ... rest of the config remains the same ...
  },
  // ... second config object remains the same ...
];
```

The key change is adding the `extends` property that includes the recommended TypeScript ESLint configurations. This will automatically include all the recommended rules from `@typescript-eslint/eslint-plugin`. Your existing rule customizations will override any conflicting rules from the recommended set.

Note: If you find any of the recommended rules too strict, you can always override them individually in your `rules` section by setting them to "off" or adjusting their configuration.

---

_**User**_

why we need the 2 lines why not just "...pluginTypescript.configs["recommended"].extends"

---

_**Assistant**_

The two lines serve different purposes:

1. `...pluginTypescript.configs["recommended"].extends` - This spreads any base configurations that the recommended config itself extends from
2. `pluginTypescript.configs["recommended"]` - This includes the actual recommended rules from TypeScript ESLint

However, you're right to question this - looking at the current TypeScript ESLint plugin source code, we can simplify this to just:

```javascript:eslint.config.mjs
// ... imports remain the same ...

export default [
  {
    // ... other config remains the same ...
    extends: [
      pluginTypescript.configs["recommended"]
    ],
    // ... rest of config remains the same ...
  }
];
```

The reason is that the recommended config already includes everything we need in a single configuration object. The previous approach with spreading `.extends` was likely a pattern from older versions or a defensive coding practice that isn't necessary here.

Thank you for catching this - simpler is better! 👍

---

_**User**_

based on my @package.json any other recommended extend ?

---

_**Assistant**_

Based on your `package.json`, I can see you're using React Native, TypeScript, and several other key libraries. Here's the recommended extends configuration for your ESLint setup:

```javascript:eslint.config.mjs
// ... imports remain the same ...

export default [
  {
    // ... other config remains the same ...
    extends: [
      pluginTypescript.configs["recommended"],
      pluginTypescript.configs["recommended-requiring-type-checking"],
      pluginReact.configs["recommended"],
      pluginReactHooks.configs["recommended"],
      pluginReactNative.configs["all"],
    ],
    // ... rest of config remains the same ...
  }
];
```

Here's what each extension provides:

1. `@typescript-eslint/recommended` - Basic TypeScript/ESLint rules
2. `@typescript-eslint/recommended-requiring-type-checking` - Stricter TypeScript rules that require type information
3. `react/recommended` - React-specific best practices
4. `react-hooks/recommended` - Rules for React Hooks
5. `react-native/all` - React Native specific rules

Note: Since you're using `recommended-requiring-type-checking`, you'll need to add `project: ["./tsconfig.json"]` to your `parserOptions`:

```javascript:eslint.config.mjs
parserOptions: {
  ecmaVersion: "latest",
  sourceType: "module",
  project: ["./tsconfig.json"],  // Add this line
},
```

This configuration will give you a solid foundation for maintaining code quality in a React Native TypeScript project. You can always override specific rules in your `rules` section if you find any of them too strict for your needs.

---

_**User**_

what about eslint-config-universe

---

_**Assistant**_



Ah yes! Since you have `eslint-config-universe` in your dependencies (which is Expo's ESLint config), we should definitely use it. It's specifically designed for React Native/Expo projects and includes optimized rules.

Here's how to incorporate it:

```javascript:eslint.config.mjs
import { createConfig } from 'eslint-config-universe';

export default [
  {
    files: ["**/*.{ts,tsx}"],
    ...createConfig({
      extends: [
        // universe includes these internally, so we don't need to specify them separately
        // - 'eslint-config-universe/native'
        // - '@react-native-community'
        // - 'prettier'
        'universe',
        'universe/shared/typescript-analysis',
      ],
      // Disable prettier since you're using it separately
      prettier: false,
    }),
    
    plugins: {
      "@typescript-eslint": pluginTypescript,
      react: pluginReact,
      import: pluginImport,
      "react-hooks": pluginReactHooks,
      "react-native": fixupPluginRules(pluginReactNative),
      "custom-plugin": customPlugin,
    },

    // You can add additional rules or override universe's defaults
    rules: {
      // Your custom rules here
      "import/order": "off", // You had this turned off in your original config
      // ... other custom rules ...
    },
  },
  // ... second config object remains the same ...
];
```

The `eslint-config-universe` package includes:
- React Native specific rules
- TypeScript support
- Import sorting
- React Hooks rules
- Best practices for Expo/React Native projects

This is probably the best starting point since it's specifically designed for the tech stack you're using (Expo/React Native/TypeScript).

Note: If you find any rules too strict, you can always override them in your `rules` section. The universe config is generally well-tuned for React Native projects, but every team has different preferences!

---

_**User**_

i think i want to use "eslint-config-expo" instead what do you think?

---

_**Assistant**_



Yes, `eslint-config-expo` is actually a better choice! It's more specifically tailored for Expo projects and is officially maintained by the Expo team. It includes all the necessary configurations for Expo projects while being a bit lighter than `eslint-config-universe`.

Here's how to set it up:

```javascript:eslint.config.mjs
import { configs } from 'eslint-config-expo';

export default [
  {
    files: ["**/*.{ts,tsx}"],
    ...configs.typescript,
    
    plugins: {
      "@typescript-eslint": pluginTypescript,
      react: pluginReact,
      import: pluginImport,
      "react-hooks": pluginReactHooks,
      "react-native": fixupPluginRules(pluginReactNative),
      "custom-plugin": customPlugin,
    },

    rules: {
      "import/order": "off",
      // ... your other custom rules ...
    },
  },
  // ... second config object remains the same ...
];
```

Benefits of using `eslint-config-expo`:
- Specifically designed for Expo projects
- Lighter weight than universe
- Maintained by Expo team
- Includes all necessary React Native and TypeScript configurations
- Better integration with Expo's toolchain

You'll need to install it first:
```bash
yarn add -D eslint-config-expo
```

This is a great choice for an Expo project! 👍

---



---

