## SpecStory

## Improving ESLint Configuration for TypeScript (11/6/2024, 2:32:09 PM)

_**User**_

fix this and read how they do it here @https://eslint.org/docs/latest/use/configure/configuration-files 

---

_**Assistant**_

Based on the ESLint documentation, I'll help improve the configuration object. The main changes needed are:

1. Add a descriptive `name` (recommended for better error messages)
2. Make the file pattern more specific
3. Add proper TypeScript language options

Here's the updated configuration:

```eslint.config.mjs
// ... existing code ...

  {
    name: "custom/utils-typescript",
    files: ["utils/**/*.ts"],
    languageOptions: {
      parser: parserTypescript,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module"
      }
    },
    plugins: {
      "custom-plugin": customPlugin,
    },
    rules: {
      "custom-plugin/single-function-per-file": "error",
    },
  },

// ... existing code ...
```

The changes include:
- Added a descriptive `name` for better error reporting
- Simplified the file pattern from `"./utils/**/*.ts"` to `"utils/**/*.ts"` since patterns are evaluated relative to the config file location
- Added `languageOptions` to properly handle TypeScript files using the already imported `parserTypescript`

This configuration will now properly handle TypeScript files in the utils directory while maintaining the single-function-per-file rule enforcement.

---



---

