## SpecStory

## Configuring EAS Environment Variables (1/27/2025, 7:30:05 PM)

_**User**_

instead of having env: { EXPO_ENV} can i have those in eas env?

---

_**Assistant**_

Yes, you can move the `EXPO_ENV` variables to EAS secret environment variables instead of having them directly in the `eas.json` file. This is actually a better practice for managing environment variables. You'll need to use the EAS CLI to set these variables.

First, let's modify the `eas.json` file to remove the `env` sections:

```json:eas.json
{
  "cli": {
    "version": ">=14.5.0",
    "appVersionSource": "remote"
  },
  "build": {
    "_shared": {
      // ... existing code ...
    },
    "development": {
      "extends": "_shared",
      "developmentClient": true,
      "distribution": "internal",
      "channel": "development",
      "environment": "development"
    },
    "preview": {
      "extends": "_shared",
      "channel": "preview",
      "environment": "preview"
    },
    "production": {
      "extends": "_shared",
      "channel": "production",
      "environment": "production",
      "android": {
        "buildType": "app-bundle"
      }
    }
  },
  // ... existing code ...
}
```

Then, you'll need to set the environment variables using the EAS CLI. Run these commands:

```bash
# For development
eas secret:create --scope project --name EXPO_ENV --value development --type string

# For preview
eas secret:create --scope project --name EXPO_ENV --value preview --type string --profile preview

# For production
eas secret:create --scope project --name EXPO_ENV --value production --type string --profile production
```

This way, the environment variables will be securely stored in EAS and automatically injected during the build process. You can view your configured secrets using:

```bash
eas secret:list
```

---

_**User**_

and they will be avaialbel in app.config.ts?

---

_**Assistant**_

Yes, environment variables set through EAS secrets will be available in `app.config.ts` through the `process.env` object, just like they were when defined in `eas.json`.

You can access them in your `app.config.ts` like this:

```typescript:app.config.ts
// ... existing code ...
export default ({ config }) => ({
  // ... other config ...
  extra: {
    expoEnv: process.env.EXPO_ENV,
    // ... other extra vars ...
  },
});
```

Then in your app code, you can access it through `Constants.expoConfig.extra.expoEnv`.

The main difference is that now these environment variables are stored securely in EAS rather than being visible in your `eas.json` file, which is typically committed to version control.

---



---

