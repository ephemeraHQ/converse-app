## SpecStory

## Best Practices for app.config.ts Imports (1/27/2025, 7:22:53 PM)

_**User**_

is it okay for app.config.ts to import something from utils like i'm doing with Environemnt?

---

_**Assistant**_

No, it's generally not a good practice to import from the application's source code (`@/utils`) in `app.config.ts`. The app config is part of the build configuration and should be independent of the application's source code. This is because:

1. The app config is evaluated during the build process, before your application code is compiled
2. It can lead to circular dependencies
3. It makes the build configuration dependent on your application structure

Here's how you can fix this:

```typescript:app.config.ts
// ... existing code ...

// Move the Environment type definition directly into this file
type Environment = "development" | "preview" | "production";

// ... existing code ...
```

You should either:
1. Define the Environment type directly in the config file (as shown above)
2. Create a separate config-specific types file (like `config-types.ts`) outside of your src directory
3. If the Environment type is needed in both places, consider moving it to a shared types file that's at the root level (not in `@/utils`)

This keeps your build configuration independent of your application code and prevents potential build-time issues.

---



---

