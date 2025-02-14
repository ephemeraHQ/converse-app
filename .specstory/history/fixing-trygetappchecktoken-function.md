## SpecStory

## Fixing tryGetAppCheckToken Function (2/6/2025, 9:13:49 AM)

_**User**_

fix appCheck in tryGetAppCheckToken

---

_**Assistant**_

I notice that `appCheck` is not defined in the `tryGetAppCheckToken` function. We need to get the Firebase App Check instance similar to how it's done in `setupAppAttest`. Here's the fix:

```typescript:utils/appCheck.ts
// ... existing code ...

export const tryGetAppCheckToken = async () => {
  logger.debug("Getting token");
  try {
    const appCheck = firebase.appCheck();
    const { token } = await appCheck.getLimitedUseToken();
    return token;
  } catch (error) {
    logger.error("Error getting token", error);
    return undefined;
  }
};

// ... existing code ...
```

The change adds the line to get the App Check instance before trying to get the token. This ensures we're using the properly initialized App Check instance from Firebase.

---



---

