## SpecStory

## ESLint Directory Import Error Fix (11/6/2024, 2:23:06 PM)

_**User**_

ESLint: 9.14.0

Error [ERR_UNSUPPORTED_DIR_IMPORT]: Directory import '/Users/thierryskoda/Programming/converse-app/custom-eslint-plugin' is not supported resolving ES modules imported from /Users/thierryskoda/Programming/converse-app/eslint.config.mjs

---

_**Assistant**_

It seems the error is related to importing a custom ESLint plugin. The issue is with the direct import of a directory. Let's fix the import path and structure of the custom plugin.

First, you'll need to ensure your custom ESLint plugin is properly structured and has an index file. Here's how to fix the config file:

```mjs:eslint.config.mjs
// ... existing imports ...
import customPlugin from "./custom-eslint-plugin/index.js";  // Update this line
// ... rest of the config remains the same ...
```

You'll need to make sure your custom-eslint-plugin directory has the following structure:

```
custom-eslint-plugin/
  ├── index.js        // or index.ts
  └── package.json    // optional but recommended
```

The `index.js` should export your plugin configuration:

```javascript:custom-eslint-plugin/index.js
module.exports = {
  rules: {
    'single-function-per-file': {
      create: function(context) {
        // Your rule implementation
      }
    }
  }
};
```

If you're using ES modules, use this format instead:

```javascript:custom-eslint-plugin/index.js
export default {
  rules: {
    'single-function-per-file': {
      create: function(context) {
        // Your rule implementation
      }
    }
  }
};
```

The error occurs because Node.js doesn't support importing directories directly when using ES modules. You need to explicitly point to a file.

---



---

