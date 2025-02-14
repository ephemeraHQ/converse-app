## SpecStory

## Improving getCurrentUser Implementation (2/13/2025, 9:26:22 AM)

_**User**_

FUCK "getCurrentUser"

---

_**Assistant**_

I'll help fix the linter error by creating a proper implementation for the `getCurrentUser` function. Based on the context, we should create this function in the authentication feature folder.

Let's create the file and update the imports:

```typescript:features/authentication/get-current-user.ts
import { useAppStateStore } from "@/data/store/use-app-state-store";

export function getCurrentUser(): string | undefined {
  return useAppStateStore.getState().currentUser;
}
```

Now let's update the users.ts file to handle the case where getCurrentUser might return undefined:

```typescript:utils/api/users.ts
// ... existing code ...

export async function getUserForCurrentUser() {
  const currentUser = getCurrentUser();

  if (!currentUser) {
    apiLogger.error("[API USERS] getUserForCurrentUser: No current user found");
    throw new Error("No current user found");
  }

  apiLogger.debug(`[API USERS] getUser for privyId: ${currentUser}`);

  // ... rest of existing code ...
}

// ... rest of existing code ...
```

The changes:
1. Created a new file `get-current-user.ts` that exports a function to get the current user from the app state store
2. Updated the error handling in `getUserForCurrentUser` to include better logging
3. Fixed the import path in users.ts to correctly point to the new file

This implementation:
- Uses the app state store to get the current user
- Follows the functional programming pattern
- Includes proper error handling
- Uses the logger for debugging and errors
- Maintains type safety by returning string | undefined

---



---

