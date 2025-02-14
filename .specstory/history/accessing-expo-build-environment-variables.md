## SpecStory

## Accessing Expo Build Environment Variables (1/27/2025, 6:56:44 PM)

_**User**_

is there a public variable like EXPO_PUBLIC_... that give info of the build eas channel that was used? or info like the environemnt or something like that

---

_**Assistant**_

Yes! In Expo, you can access build-time environment information through the `extra` field that's already defined in your config. The environment value is already being set there as `expoEnv`. You can access it in your app using `Constants.expoConfig.extra.expoEnv`.

However, if you want to use an `EXPO_PUBLIC_` variable, you can add it to your config. Here's how to modify your config file:

```typescript:app.config.ts
// ... existing code ...

export default (): ExpoConfig => {
  const environment = (process.env.EXPO_ENV || "development") as Environment;
  const config = settings[environment];

  return {
    // ... existing config ...
    extra: {
      expoEnv: environment,
      eas: {
        projectId: "49a65fae-3895-4487-8e8a-5bd8bee3a401",
      },
    },
    // Add this new section
    plugins: [
      ["expo-constants", {
        expoConfig: {
          EXPO_PUBLIC_ENVIRONMENT: environment,
          EXPO_PUBLIC_APP_VARIANT: process.env.EAS_BUILD_PROFILE || "development",
        }
      }],
      // ... rest of your existing plugins ...
    ],
  };
};
```

After this change, you can access these values in your app in two ways:

1. Using Constants:
```typescript
import Constants from 'expo-constants';

// Access environment
const environment = Constants.expoConfig?.extra?.expoEnv;
// Or using the public variables
const publicEnvironment = Constants.expoConfig?.EXPO_PUBLIC_ENVIRONMENT;
const buildProfile = Constants.expoConfig?.EXPO_PUBLIC_APP_VARIANT;
```

2. Using process.env directly (TypeScript will need type definitions):
```typescript
const environment = process.env.EXPO_PUBLIC_ENVIRONMENT;
const buildProfile = process.env.EXPO_PUBLIC_APP_VARIANT;
```

The `EAS_BUILD_PROFILE` will contain the build profile name used in EAS (like 'development', 'preview', or 'production'), which is automatically set during the EAS build process.

---



---

