## SpecStory

## Hide Splash Screen on Auth Status Change (2/12/2025, 10:24:23 AM)

_**User**_

how cna i make sure to hide splash only one time when authStatus isn't idle anymore

---

_**Assistant**_

I'll help you modify the code to ensure the splash screen is hidden only once when the authStatus changes from "idle". We can use a ref to track if we've already hidden the splash screen.

Here's how to update the code:

```typescript:screens/app-navigator.tsx
// ... existing imports ...
import { useRef } from "react";

const AppStack = () => {
  const authStatus = useAuthStore((state) => state.status);
  const hasHiddenSplash = useRef(false);

  useEffect(() => {
    if (authStatus !== "idle" && !hasHiddenSplash.current) {
      hasHiddenSplash.current = true;
      hideSplashScreen().catch(captureError);
    }
  }, [authStatus]);

  // ... rest of the component code ...
};
```

This change:

1. Adds a `useRef` to track if we've already hidden the splash screen
2. Only calls `hideSplashScreen()` if:
   - `authStatus` is not "idle" AND
   - we haven't hidden the splash screen yet (`!hasHiddenSplash.current`)
3. Sets the ref to `true` before hiding the splash screen to prevent future calls

This ensures the splash screen is hidden exactly once when the auth status first changes from "idle" to any other state.

---



---

