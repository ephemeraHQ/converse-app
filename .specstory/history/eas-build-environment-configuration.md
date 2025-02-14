## SpecStory

## EAS Build Environment Configuration (1/24/2025, 10:38:29 AM)

_**User**_

you see that I use process.env.EXPO_ENV to determine the env here. When I call "eas build --profile preview" , do i need to do EXPO_ENV=preview or EXPO_ENV=prod before calling eas build? how it will know which one to choose? I have some variables set in eas variables in expo.dev . Look at my also @eas.json 

---

_**Assistant**_

Looking at your configuration, you don't need to manually set EXPO_ENV before running `eas build`. The environment is automatically determined by the build profile you specify in the `eas build` command through the `environment` field in your eas.json configuration.

In your eas.json, each build profile has an `environment` field:

```json
"preview": {
  "extends": "base",
  "channel": "preview",
  "environment": "preview"  // This sets EXPO_ENV
},
"production": {
  "extends": "base",
  "channel": "production",
  "environment": "production"  // This sets EXPO_ENV
}
```

So when you run:
- `eas build --profile preview` → This will set `EXPO_ENV=preview`
- `eas build --profile production` → This will set `EXPO_ENV=production`

The `environment` field in eas.json is automatically translated to `EXPO_ENV` during the build process. This is how EAS Build knows which environment configuration to use from your `app.config.ts`.

This means:
1. When you run `eas build --profile preview`, it will use the `preview` configuration from your `settings` object in app.config.ts
2. When you run `eas build --profile production`, it will use the `prod` configuration

You don't need to manually set the environment variable - EAS handles this for you based on the build profile configuration.

---

_**User**_

is there another way to access the environemnt ? Let's say I want to kill process.env.EXPO_ENV

---

_**Assistant**_

Yes, you can access the environment through the EAS Constants API. Here's how to modify your app.config.ts to remove the dependency on process.env.EXPO_ENV:

```typescript:app.config.ts
import { ConfigContext, ExpoConfig } from "expo/config";
import versions from "./versions.json";

// ... existing code ...

// Replace process.env.EXPO_ENV with Constants.expoConfig.extra.environment
export default ({ config: defaultConfig }: ConfigContext): ExpoConfig => {
  const environment = (defaultConfig.extra?.environment ?? "dev") as Environment;
  const config = settings[environment];

  return {
    ...defaultConfig,
    name: config.appName,
    scheme: config.scheme,
    // ... rest of your existing config ...
    extra: {
      environment, // Make environment available to your app code
    },
  };
};
```

Then in your app code, you can access the environment using Constants:

```typescript
import Constants from 'expo-constants';

const environment = Constants.expoConfig?.extra?.environment as Environment;
```

This approach is more reliable because:
1. It uses the official Expo configuration system
2. The environment value is bundled with your app configuration
3. It's type-safe and can be accessed throughout your app
4. It follows Expo's recommended patterns for configuration management

The environment will still be set by your eas.json profile's `environment` field when building, but now it flows through Expo's configuration system instead of process.env.

---

_**User**_

wait where does defaultconfig is coming from? and also look at my @app.config.ts I have the stuff declared above the export, should i then move all this inside the export default function?

---

_**Assistant**_



The `defaultConfig` comes from the `ConfigContext` parameter in your export default function. It contains the base configuration that Expo provides.

You don't need to move your types and settings inside the function. Here's how to modify your code while keeping the structure:

```typescript:app.config.ts
import { ConfigContext, ExpoConfig } from "expo/config";
import versions from "./versions.json";

// ... keep all your existing types and settings here ...
type Environment = "dev" | "preview" | "prod";
const settings: Record<Environment, EnvironmentConfig> = {
  // ... your existing settings ...
};

// Just modify the config assignment and export
export default ({ config: defaultConfig }: ConfigContext): ExpoConfig => {
  const environment = (defaultConfig.extra?.environment ?? "dev") as Environment;
  const config = settings[environment];

  return {
    ...defaultConfig,
    name: config.appName,
    scheme: config.scheme,
    owner: "converse",
    // ... rest of your existing config ...
    extra: {
      environment,
    },
  };
};
```

The main changes are:
1. Remove `const expoEnv = process.env.EXPO_ENV...`
2. Get the environment from `defaultConfig.extra.environment`
3. Add `extra` field to the returned config to make the environment available in your app

All your types and settings can stay exactly where they are - they're still needed at the module level to support the configuration function.

---

_**User**_

but I just tried "npx eas config and selected preview and it still showed "dev" for "defaultConfig.extra?.environment"

---

_**Assistant**_

Ah, I see the issue. The `npx eas config` command doesn't automatically set the environment - it's specifically set during the EAS build process.

For local development and testing, you'll need to set the environment in your app.json or app.config.js. Here's how you can modify your app.config.ts to handle this:

```typescript:app.config.ts
// ... existing code ...

export default ({ config: defaultConfig }: ConfigContext): ExpoConfig => {
  // Get environment from EAS build-time environment or fallback to "dev"
  const environment = ((process.env.EAS_BUILD_PROFILE === "preview" 
    ? "preview"
    : process.env.EAS_BUILD_PROFILE === "production"
    ? "prod"
    : "dev")) as Environment;

  console.log("EAS_BUILD_PROFILE:", process.env.EAS_BUILD_PROFILE);
  console.log("Selected environment:", environment);

  const config = settings[environment];

  return {
    ...defaultConfig,
    // ... rest of your config ...
    extra: {
      ...defaultConfig.extra,
      environment, // This makes the environment available to your app
      eas: {
        projectId: "49a65fae-3895-4487-8e8a-5bd8bee3a401",
      },
    },
  };
};
```

This change:
1. Uses `process.env.EAS_BUILD_PROFILE` which is automatically set by EAS during builds
2. Maps the EAS build profile names to your environment types
3. Falls back to "dev" for local development

Now:
- When you run `eas build --profile preview` → It will use "preview" environment
- When you run `eas build --profile production` → It will use "prod" environment
- When running locally or using `npx eas config` → It will use "dev" environment

The `EAS_BUILD_PROFILE` environment variable is automatically set by EAS during the build process based on the profile you specify in the build command.

---



---

