## SpecStory

## ESLint Plugin Directory Import Error Solution (11/6/2024, 2:20:11 PM)

_**User**_

Error [ERR_UNSUPPORTED_DIR_IMPORT]: Directory import '/Users/thierryskoda/Programming/converse-app/custom-eslint-plugin' is not supported resolving ES modules imported from /Users/thierryskoda/Programming/converse-app/eslint.config.mjs

---

_**Assistant**_

It seems the error is related to how you're importing the custom ESLint plugin. When importing an ESLint plugin, you need to point to the specific file rather than just the directory. Here's how to fix it:

```javascript:eslint.config.mjs
// ... existing imports ...
import customPlugin from "./custom-eslint-plugin/index.js";
// or
import customPlugin from "./custom-eslint-plugin/index.mjs";
// ... rest of the config ...
```

You need to:
1. Create an index file in your custom-eslint-plugin directory if you haven't already
2. Make sure to include the file extension (.js or .mjs) in the import path

The error occurs because ES modules don't support directory imports - you need to specify the exact file you want to import. Make sure your custom-eslint-plugin directory has an index file that exports your plugin configuration.

If you haven't set up your custom plugin yet, you'll need to create a structure like this:

```
custom-eslint-plugin/
  ├── index.js (or index.mjs)
  └── rules/
      └── your-rules.js
```

And your index.js/mjs should export your plugin configuration:

```javascript:custom-eslint-plugin/index.js
export default {
  rules: {
    'single-function-per-file': require('./rules/single-function-per-file')
  }
};
```

---



---

