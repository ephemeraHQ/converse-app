## SpecStory

## Enforcing Module Alias Imports in Code (11/6/2024, 3:14:35 PM)

_**User**_

I wnat to add a rule where we want import like @design-system/ etc... and not "../.."

---

_**Assistant**_

I'll help you add an import rule to enforce using module aliases (like `@design-system/`) instead of relative paths. We'll use the `no-relative-parent-imports` and `no-restricted-imports` rules to achieve this.

```javascript:eslint.config.mjs
// ... existing imports and config start ...

rules: {
  // ... existing rules ...
  
  "import/no-relative-parent-imports": "error",
  "no-restricted-imports": [
    "error",
    {
      patterns: [{
        group: ["../*", "../../*"],
        message: "Please use module aliases (e.g., @design-system/) instead of relative paths"
      }],
      paths: [
        {
          name: "i18n-js",
          message: "Use @i18n app module instead.",
        },
      ],
    },
  ],

  // ... rest of existing rules ...
}
```

This update adds two key changes:
1. Adds `"import/no-relative-parent-imports": "error"` to prevent imports using parent directories
2. Expands the existing `no-restricted-imports` rule to include a `patterns` array that blocks `../` and `../../` style imports

Make sure you have your module aliases properly configured in your `tsconfig.json` for this to work effectively.

---

_**User**_

possible to allow if it's only like "./" or "../" ?

---

_**Assistant**_

Yes! We can modify the pattern to only restrict imports that go up more than one level. Here's the updated rule:

```javascript:eslint.config.mjs
// ... existing rules ...

"no-restricted-imports": [
  "error",
  {
    patterns: [{
      group: ["../../*", "../../../*"],
      message: "Please use module aliases (e.g., @design-system/) instead of relative paths when going up more than one directory"
    }],
    paths: [
      {
        name: "i18n-js",
        message: "Use @i18n app module instead.",
      },
    ],
  },
],

// Remove or comment out this rule since it blocks all parent imports
// "import/no-relative-parent-imports": "error",

// ... rest of existing rules ...
```

This configuration will:
- Allow `./something` imports
- Allow `../something` imports
- Block `../../something` or deeper relative imports
- Keep the existing `i18n-js` restriction

---



---

