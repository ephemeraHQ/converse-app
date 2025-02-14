## SpecStory

## Configuring ESLint for Different Import Rules (11/7/2024, 8:43:21 AM)

_**User**_

how can i have errors for i18n but warning for the other one?

---

_**Assistant**_

I'll help you modify the `no-restricted-imports` rule to have different severity levels. You'll need to split it into two separate rules:

```eslint.config.mjs
// ... existing code ...
      "no-restricted-imports": ["error", {
        paths: [
          {
            name: "i18n-js",
            message: "Use @i18n app module instead.",
          },
        ],
      }],
      "no-restricted-imports": ["warn", {
        patterns: [
          {
            group: ["../../*", "../../../*"],
            message: "Please use module aliases (e.g., @design-system/) instead of relative paths when going up more than one directory",
          },
        ],
      }],
// ... existing code ...
```

However, since we can't have duplicate keys in an object, we'll need to use the alternative array syntax for this rule:

```eslint.config.mjs
// ... existing code ...
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "i18n-js",
              message: "Use @i18n app module instead.",
            },
          ],
          patterns: [
            {
              group: ["../../*", "../../../*"],
              severity: "warn",
              message: "Please use module aliases (e.g., @design-system/) instead of relative paths when going up more than one directory",
            },
          ],
        },
      ],
// ... existing code ...
```

This configuration will:
- Show an error for importing `i18n-js`
- Show a warning for relative imports going up more than one directory
- Use the `severity` property in the patterns object to override the default "error" level

---



---

