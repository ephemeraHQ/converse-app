## SpecStory

## Preference for Inferred Function Types (11/6/2024, 11:44:29 AM)

_**User**_

fix this, I prefered infered type and never want want explicit type for functions

---

_**Assistant**_

I'll help you modify the ESLint configuration to prefer inferred return types. Here's the change:

```json:.eslintrc.json
// ... existing rules ...
    "@typescript-eslint/explicit-function-return-type": "off", // We prefer inferred return types
// ... existing rules ...
```

This change:
1. Turns off the rule that requires explicit return types for functions
2. Aligns with the preference for TypeScript's type inference capabilities
3. Makes the code cleaner and less verbose while still maintaining type safety

The TypeScript compiler is very good at inferring return types, so this is a safe change that will reduce boilerplate in your codebase while maintaining type safety.

---



---

