## SpecStory

## Fixing Loading State in React Hook (1/29/2025, 3:47:41 PM)

_**User**_

ok but what is isLoading is false on first time?

---

_**Assistant**_

Ah, good catch! The current implementation has a bug where if `isLoading` starts as `false`, `isMinLoadingComplete` will remain `false` and the hook will always return `true`. Let's fix this by handling the case when `isLoading` becomes `false`:

```typescript:hooks/use-minimum-loading-time.ts
export function useMinimumLoadingTime(args: {
  isLoading: boolean;
  minimumTime: number;
}) {
  const { isLoading, minimumTime } = args;
  const [isMinLoadingComplete, setIsMinLoadingComplete] = useState(!isLoading);

  useEffect(() => {
    if (isLoading) {
      setIsMinLoadingComplete(false);
      const timer = setTimeout(() => {
        setIsMinLoadingComplete(true);
      }, minimumTime);
      return () => clearTimeout(timer);
    } else {
      setIsMinLoadingComplete(true);
    }
  }, [isLoading, minimumTime]);

  // ... existing code ...
}
```

Key changes made:
1. Initialize `isMinLoadingComplete` with `!isLoading` so it starts as `true` when `isLoading` is `false`
2. Added an `else` clause to set `isMinLoadingComplete` to `true` when `isLoading` becomes `false`

This ensures that:
- If `isLoading` starts as `false`, the hook will return `false` (not loading)
- If `isLoading` becomes `true`, it will wait for the minimum time before allowing the loading state to complete
- If `isLoading` becomes `false`, it will immediately mark the minimum loading time as complete

Also, since we're following the style guide, we should replace the console.logs with logger:

```typescript:hooks/use-minimum-loading-time.ts
import { useEffect, useState } from "react";
import { logger } from "@/utils/logger";

export function useMinimumLoadingTime(args: {
  isLoading: boolean;
  minimumTime: number;
}) {
  // ... existing code ...

  logger.debug(`[useMinimumLoadingTime] isMinLoadingComplete: ${isMinLoadingComplete}, isLoading: ${isLoading}`);

  return isLoading || !isMinLoadingComplete;
}
```

---



---

