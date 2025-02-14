## SpecStory

## Refactoring Environment Configuration in Code (1/19/2025, 9:07:11 AM)

_**User**_

don't have isDev, isPreview and isProduction. Prefer doing like config...

---

_**Assistant**_

I'll help you refactor the code to use an environment configuration pattern instead of separate boolean flags. Here's how we can improve it:

```typescript:app.config.ts
import { ConfigContext, ExpoConfig } from "expo/config";
import appConfig from "./app.json";

// Define environment types
type Environment = "dev" | "preview" | "prod";

const settings = {
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
    scheme: "converse",
    androidPackage: "com.converse.prod",
    appDomainConverse: "converse.xyz",
    appDomainGetConverse: "getconverse.app",
    appName: "Converse",
    icon: "./assets/icon.png",
    googleServicesFile: "./scripts/build/android/google-services/production.json",
  },
} satisfies Record<Environment, {
  scheme: string;
  androidPackage: string;
  appDomainConverse: string;
  appDomainGetConverse: string;
  appName: string;
  icon: string;
  googleServicesFile: string;
}>;

const currentEnv = (process.env.EXPO_ENV ?? "prod") as Environment;
const config = settings[currentEnv];

export default ({ config: expoConfig }: ConfigContext): ExpoConfig => ({
  ...expoConfig,
  name: config.appName,
  scheme: config.scheme,
  // ... existing code ...
  icon: config.icon,
  // ... existing code ...
  extra: {
    eas: {
      projectId: "49a65fae-3895-4487-8e8a-5bd8bee3a401",
    },
    ENV: currentEnv,
  },
  // ... existing code ...
  android: {
    versionCode: appConfig.expo.android.versionCode,
    package: config.androidPackage,
    googleServicesFile: config.googleServicesFile,
    // ... rest of android config ...
  },
  // ... existing code ...
});
```

Key changes made:
1. Removed `isDev`, `isPreview`, and `isProduction` flags
2. Added environment-specific properties to the `settings` object
3. Added TypeScript type safety with `Environment` type and `satisfies` operator
4. Simplified environment selection with nullish coalescing operator
5. Moved environment-specific values into the config object
6. Used the config object consistently throughout the configuration

This refactoring makes the code more maintainable and type-safe, while reducing the number of conditional statements in the configuration.

---



---

