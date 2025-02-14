## SpecStory

## Base Configuration for Environments (1/19/2025, 9:16:04 AM)

_**User**_

Ok I need a way to set some "base" config that for now are applied in each environement, like it's the same in each

---

_**Assistant**_

I'll help you refactor the code to have a base configuration that can be shared across environments. Here's how we can modify the code:

```typescript:app.config.ts
// ... existing code ...

const baseConfig: Partial<EnvironmentConfig> = {
  appDomainConverse: "converse.xyz",
  appDomainGetConverse: "getconverse.app",
  icon: "./assets/icon.png",
  googleServicesFile: "./scripts/build/android/google-services/production.json",
};

const settings: Record<Environment, EnvironmentConfig> = {
  dev: {
    scheme: "converse-dev",
    androidPackage: "com.converse.dev",
    appDomainConverse: "dev.converse.xyz",
    appDomainGetConverse: "dev.getconverse.app",
    appName: "Converse DEV",
    icon: "./assets/icon-preview.png",
    googleServicesFile: "./scripts/build/android/google-services/dev.json",
  },
  preview: {
    scheme: "converse-preview",
    androidPackage: "com.converse.preview",
    appDomainConverse: "preview.converse.xyz",
    appDomainGetConverse: "preview.getconverse.app",
    appName: "Converse PREVIEW",
    icon: "./assets/icon-preview.png",
    googleServicesFile: "./scripts/build/android/google-services/preview.json",
  },
  prod: {
    ...baseConfig,
    scheme: "converse",
    androidPackage: "com.converse.prod",
    appName: "Converse",
  },
};

// ... existing code ...
```

I've introduced a `baseConfig` object that contains the shared configuration values. For now, I've only moved the production values there since they seem to be the "default" ones. You can then spread this base config into any environment that should use these default values (currently just `prod`).

You can easily extend this by:
1. Moving more shared values to `baseConfig`
2. Spreading `baseConfig` into other environments
3. Overriding specific values per environment as needed

This makes it easier to maintain shared configuration values and reduces duplication in the code.

---



---

