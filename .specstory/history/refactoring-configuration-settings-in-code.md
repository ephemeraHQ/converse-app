## SpecStory

## Refactoring Configuration Settings in Code (1/19/2025, 9:01:52 AM)

_**User**_

make this better like const settings = { dev: , preview, prod} and then const config = settings[env]

---

_**Assistant**_

I'll help refactor this code to use a settings object for better maintainability. Here's how we can improve it:

```typescript:app.config.ts
// ... existing code ...

const settings = {
  dev: {
    scheme: "converse-dev",
    androidPackage: "com.converse.dev",
    appDomainConverse: "dev.converse.xyz",
    appDomainGetConverse: "dev.getconverse.app",
  },
  preview: {
    scheme: "converse-preview",
    androidPackage: "com.converse.preview",
    appDomainConverse: "preview.converse.xyz",
    appDomainGetConverse: "preview.getconverse.app",
  },
  prod: {
    scheme: "converse",
    androidPackage: "com.converse.prod",
    appDomainConverse: "converse.xyz",
    appDomainGetConverse: "getconverse.app",
  },
} as const;

const env = isDev ? "dev" : isPreview ? "preview" : "prod";
const config = settings[env];

const { scheme, androidPackage, appDomainConverse, appDomainGetConverse } = config;

// ... existing code ...
```

This refactoring:
1. Creates a single `settings` object that groups all environment-specific values
2. Uses a type-safe `as const` assertion to preserve literal types
3. Determines the environment once and uses it to access the correct config
4. Destructures the needed values from the config

The code is now more maintainable as all environment-specific values are grouped together, making it easier to add or modify values for each environment. It also reduces repetition and makes the relationship between different environment values more explicit.

---



---

