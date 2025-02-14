## SpecStory

## ESLint Configuration Update Guidance (11/6/2024, 2:33:52 PM)

_**User**_

Invalid option '--ext' - perhaps you meant '-c'?
You're using eslint.config.js, some command line flags are no longer available. Please see https://eslint.org/docs/latest/use/command-line-interface for details.

---

_**Assistant**_

It looks like you're trying to use the `--ext` flag with the new ESLint flat config system, but this flag is no longer supported in the new format. Let's update your lint script to work with the flat config.

Here's how to modify your package.json:

```json:package.json
// ... existing code ...
    "lint": "eslint . --max-warnings 420",
// ... existing code ...
```

The file extensions are now handled directly in your eslint.config.mjs configuration file. You should modify your config to explicitly specify which files to lint using the `files` pattern. Here's how to update your eslint.config.mjs:

```javascript:eslint.config.mjs
// ... existing code ...
  {
    files: ["**/*.{ts,tsx}"],  // This replaces the need for --ext flag
    plugins: {
      "custom-plugin": customPlugin,
    },
    rules: {
      "custom-plugin/single-function-per-file": "error",
    },
  },
// ... existing code ...
```

The `files` pattern `**/*.{ts,tsx}` will match all TypeScript and TypeScript React files in your project, effectively replacing the `--ext` flag functionality. This is the recommended approach with the new flat config system.

---



---

