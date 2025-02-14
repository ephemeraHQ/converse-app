## SpecStory

## Expo Update Configuration Options (1/19/2025, 3:18:20 PM)

_**User**_

what are the different expo update possibility options here

---

_**Assistant**_

Let me explain the Expo updates configuration options. The `updates` field in app.config.ts can have several properties to control how your app handles over-the-air (OTA) updates:

1. **Main Options:**
```typescript
updates: {
  // How long (in ms) to wait before falling back to cache if update download fails
  fallbackToCacheTimeout: number;
  
  // URL to check for updates
  url: string;

  // Whether updates are enabled (default: true)
  enabled: boolean;

  // Update check frequency: 'ON_ERROR' | 'ON_LOAD' | 'NEVER'
  checkAutomatically: string;

  // Whether to run update check on app launch (default: true)
  checkOnLaunch: boolean;

  // Whether to launch app with most recent update without checking (default: false)
  launchWaitMs: number | false;
}
```

2. **Common Configurations:**

```typescript
// Disable updates completely
updates: {
  enabled: false
}

// Check for updates only when there's an error
updates: {
  checkAutomatically: 'ON_ERROR'
}

// Check for updates on every app load
updates: {
  checkAutomatically: 'ON_LOAD',
  fallbackToCacheTimeout: 30000  // Wait 30 seconds before using cache
}
```

Key points:
- `fallbackToCacheTimeout: 0` means it will immediately use cached version if update fails
- The `url` points to your Expo project's update server
- For development, updates are always disabled regardless of these settings
- These settings only apply to builds created with EAS Build or `expo build`

Would you like me to explain any specific option in more detail?

---



---

