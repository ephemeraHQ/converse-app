## SpecStory

## Resolving EAS Build Scheme Issues (1/24/2025, 11:03:38 AM)

_**User**_

@eas.json @app.config.ts Why does it keep resolving to the .dev scheme??

npx eas build --profile preview --platform ios --non-interactive --local
Environment variables with visibility "Plain text" and "Sensitive" loaded from the "preview" environment on EAS: EXPO_PUBLIC_EVM_RPC_ENDPOINT, EXPO_PUBLIC_PRIVY_APP_ID, EXPO_PUBLIC_THIRDWEB_CLIENT_ID, SENTRY_AUTH_TOKEN.
Environment variables loaded from the "preview" build profile "env" configuration: EXPO_ENV.


We've found multiple schemes in your Xcode project: Converse, ConverseNotificationExtension
You've run EAS CLI in non-interactive mode, choosing the Converse scheme.

✔ Incremented buildNumber from 17 to 18.
✔ Using remote iOS credentials (Expo server)

We found that the scheme you want to build consists of many targets.
You have to set up credentials for each of the targets.
They can share the same Distribution Certificate but require separate Provisioning Profiles.

Setting up credentials for following targets:
- Target: Converse
  Bundle Identifier: com.converse.dev
- Target: ConverseNotificationExtension
  Bundle Identifier: com.converse.dev.ConverseNotificationExtension

---

_**Assistant**_

Based on the logs and configuration files, I can see why it's resolving to the dev scheme. The issue appears to be in the `app.config.ts` file where the environment fallback is set to "dev". Let me help you fix this.

```typescript:app.config.ts
// ... existing code ...

export default ({ config: defaultConfig }: ConfigContext): ExpoConfig => {
  // Add logging to debug the environment
  console.log("process.env.EXPO_ENV:", process.env.EXPO_ENV);
  const environment = (process.env.EXPO_ENV || "dev") as Environment;
  
  // Add validation to ensure correct environment
  if (!settings[environment]) {
    throw new Error(`Invalid environment: ${environment}. Must be one of: ${Object.keys(settings).join(", ")}`);
  }
  
  const config = settings[environment];
  // Add debug logging
  console.log("Selected environment config:", environment, config.scheme);

  // ... rest of the config ...
```

The issue might be that `process.env.EXPO_ENV` is not being properly passed or interpreted. In your EAS command, you're using `--profile preview`, and in your `eas.json`, you have:

```json:eas.json
"preview": {
  "extends": "_shared",
  "channel": "preview",
  "environment": "preview",
  "env": {
    "EXPO_ENV": "preview"
  }
}
```

A few things to check:

1. Make sure `process.env.EXPO_ENV` is being set to "preview" and not being overridden somewhere else
2. Verify that the environment value matches exactly one of: "dev" | "preview" | "prod"
3. Try running the build with explicit environment setting:
   ```bash
   EXPO_ENV=preview npx eas build --profile preview --platform ios --non-interactive --local
   ```

The fact that it's using `com.converse.dev` as the bundle identifier suggests that the environment is falling back to "dev" instead of using "preview". The added logging should help identify where exactly this is happening.

---



---

