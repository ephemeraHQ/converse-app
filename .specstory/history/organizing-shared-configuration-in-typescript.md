## SpecStory

## Organizing Shared Configuration in TypeScript (1/19/2025, 10:33:30 AM)

_**User**_

i have stuff in config folder like dev, preview prod and base and also have stuff in app.config.json. How can i put somewhere some stuff that will be shared for both

---

_**Assistant**_

I'll help you organize shared configuration between your TypeScript config files and app.config.json. A good approach would be to create a shared constants file that can be used by both.

Here's how we can restructure this:

1. First, let's create a new file for shared constants:

```typescript:config/shared-constants.ts
export const APP_CONSTANTS = {
  BASE_BUNDLE_ID: "com.converse",
  BASE_WEBSITE_DOMAIN: "converse.xyz",
  BASE_SCHEME: "converse",
} as const;

export function getEnvSpecificConstants(env: string) {
  const envPrefix = env === "prod" ? "" : `${env}.`;
  const envSuffix = env === "prod" ? "" : `-${env}`;
  
  return {
    bundleId: `${APP_CONSTANTS.BASE_BUNDLE_ID}${env === "prod" ? "" : "."+env}`,
    websiteDomain: `${envPrefix}${APP_CONSTANTS.BASE_WEBSITE_DOMAIN}`,
    scheme: `${APP_CONSTANTS.BASE_SCHEME}${envSuffix}`,
    appleAppGroup: `group.${APP_CONSTANTS.BASE_BUNDLE_ID}${env === "prod" ? "" : "."+env}`,
  } as const;
}
```

2. Then modify your dev config to use these shared constants:

```typescript:config/dev.ts
// ... existing code ...
import { getEnvSpecificConstants } from "./shared-constants";

export const devConfig = {
  ...base,
  env: Environments.dev,
  xmtpEnv: (process.env.EXPO_PUBLIC_DEV_XMTP_ENV || "dev") as XmtpEnv,
  apiURI: getApiUri(),
  debugMenu: true,
  ...getEnvSpecificConstants("dev"),
  usernameSuffix: ".conversedev.eth",
  universalLinks: ["dev.converse.xyz/", "dev.getconverse.app/"].flatMap(
    (domain) => [`https://${domain}`, `http://${domain}`, domain]
  ),
  // ... rest of existing code ...
} as const;
```

3. You can then use the shared constants in your app.config.json by creating a dynamic config file:

```javascript:app.config.js
const { APP_CONSTANTS } = require('./config/shared-constants');

module.exports = {
  expo: {
    // ... other config
    ios: {
      bundleIdentifier: process.env.BUNDLE_ID || APP_CONSTANTS.BASE_BUNDLE_ID,
      // ... other ios config
    },
    android: {
      package: process.env.BUNDLE_ID || APP_CONSTANTS.BASE_BUNDLE_ID,
      // ... other android config
    },
    scheme: process.env.APP_SCHEME || APP_CONSTANTS.BASE_SCHEME,
    // ... rest of config
  }
};
```

This approach:
- Creates a single source of truth for shared constants
- Makes it easy to generate environment-specific variations of these constants
- Keeps the configuration DRY (Don't Repeat Yourself)
- Makes it easier to maintain and update shared values
- Works for both TypeScript configs and app.config.json (by using app.config.js instead)

You can follow the same pattern for your preview and prod configs by using `getEnvSpecificConstants("preview")` and `getEnvSpecificConstants("prod")` respectively.

---



---

