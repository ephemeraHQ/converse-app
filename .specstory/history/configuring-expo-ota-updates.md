## SpecStory

## Configuring Expo OTA Updates (2/5/2025, 7:15:23 PM)

_**User**_

will when i open expo , eas automatically downloads the next OTA update so that when i kill the app and reoopen it opens with the new one?

---

_**Assistant**_

Based on the configuration in your `app.config.ts` file, Expo's OTA (Over The Air) updates are configured, but there are a few important points to understand:

1. Looking at your config, you have updates enabled:
```typescript:app.config.ts
// ... existing code ...
    updates: {
      fallbackToCacheTimeout: 0,
      url: "https://u.expo.dev/49a65fae-3895-4487-8e8a-5bd8bee3a401",
    },
    runtimeVersion: version,
// ... existing code ...
```

However, by default:
- Updates are not automatically downloaded when you open the app
- Updates are checked when the app launches
- If an update is available, it will be downloaded but will only take effect after the app is restarted

To enable automatic downloads of updates, you would need to modify your configuration to include `checkAutomatically`. Here's how you can modify it:

```typescript:app.config.ts
// ... existing code ...
    updates: {
      fallbackToCacheTimeout: 0,
      url: "https://u.expo.dev/49a65fae-3895-4487-8e8a-5bd8bee3a401",
      checkAutomatically: "ON_LOAD",
    },
// ... existing code ...
```

Options for `checkAutomatically` are:
- `ON_LOAD` - Checks for updates when the app loads
- `ON_ERROR_RECOVERY` - Checks for updates when the app recovers from an error
- `NEVER` - Never automatically checks for updates

Even with automatic checking enabled, the update will still only take effect after the app is restarted. If you want updates to be applied immediately, you would need to programmatically reload the app using Expo's Updates API in your application code.

---



---

