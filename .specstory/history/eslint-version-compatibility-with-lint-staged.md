## SpecStory

## ESLint Version Compatibility with lint-staged (11/6/2024, 2:34:56 PM)

_**User**_

which version of eslint will lint-staged use?

---

_**Assistant**_

Based on the `package.json`, lint-staged will use ESLint version 9.14.0, which is specified in the devDependencies:

```json:package.json
"devDependencies": {
  "eslint": "^9.14.0",
  // ... other deps
}
```

However, I should point out that ESLint 9.14.0 seems unusual, as the latest stable version of ESLint is currently 8.x. Version 9.x is still in development/experimental. You might want to consider downgrading to a stable 8.x version to avoid potential issues.

The caret (^) in front of the version number means it will use any version that's compatible with 9.14.0 (same major version number).

---



---

