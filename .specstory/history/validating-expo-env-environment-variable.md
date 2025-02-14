## SpecStory

## Validating EXPO_ENV Environment Variable (1/19/2025, 9:10:43 AM)

_**User**_

i want to make usre that if process.env.EXPO_ENV is passed, it's one of dev, preview or prod value

---

_**Assistant**_

I'll help you add type safety for the `EXPO_ENV` environment variable. We'll use TypeScript to ensure the value is one of the allowed environments.

```typescript:app.config.ts
// ... existing code ...

const currentEnv = (() => {
  const env = process.env.EXPO_ENV;
  if (env && !["dev", "preview", "prod"].includes(env)) {
    throw new Error(
      `Invalid EXPO_ENV value: "${env}". Must be one of: dev, preview, prod`
    );
  }
  return (env ?? "prod") as Environment;
})();

const config = settings[currentEnv];

// ... existing code ...
```

This change:
1. Wraps the environment check in an IIFE (Immediately Invoked Function Expression)
2. Validates that if `EXPO_ENV` is provided, it must be one of the valid environments
3. Throws a descriptive error if an invalid value is provided
4. Returns the environment value (or "prod" as default) with proper typing

This ensures type safety and runtime validation of the environment variable while maintaining the existing default behavior.

---

_**User**_

easier way to do this I'm sure

---

_**Assistant**_

Yes, you're right! Here's a simpler way using TypeScript's type assertion:

```typescript:app.config.ts
// ... existing code ...

const currentEnv = (process.env.EXPO_ENV ?? "prod") satisfies Environment;
if (!settings[currentEnv]) {
  throw new Error(
    `Invalid EXPO_ENV value: "${currentEnv}". Must be one of: dev, preview, prod`
  );
}
const config = settings[currentEnv];

// ... existing code ...
```

This is more concise while still providing both type checking and runtime validation. The `satisfies` operator ensures type safety at compile time, and the simple object key check provides runtime validation.

---



---

