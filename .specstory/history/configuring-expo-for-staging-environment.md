## SpecStory

## Configuring Expo for Staging Environment (1/17/2025, 11:24:40 AM)

_**User**_

what expo var should i change in my .env to be able to target the staging env?

---

_**Assistant**_

Based on the config file, to target the staging/preview environment, you'll need to set the following environment variable in your `.env` file:

```
EXPO_PUBLIC_APP_ENV=preview
```

This works because the config uses `isPreview` from `./utils/getEnv` to determine which environment config to use. The `isPreview` check likely looks at this environment variable to determine if it should use the preview configuration, which points to:
- `apiURI: "https://backend-staging.converse.xyz"`
- Preview-specific bundleIDs, schemes, and other staging environment settings

Note that you'll still need to keep all other required EXPO_PUBLIC_* variables in your .env file (like WALLETCONNECT_PROJECT_ID, PRIVY_APP_ID, etc.), but this specific variable will ensure you're targeting the staging environment.

---



---

