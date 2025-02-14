## SpecStory

## Update Function for Current User Access (2/13/2025, 9:25:26 AM)

_**User**_

chagn thie for currentUser and no arguments needed here

---

_**Assistant**_

I'll help modify the `getUserByPrivyUserId` function to use the current user pattern. Here's how we should update the file:

```typescript:utils/api/users.ts
// ... existing code ...

// Remove the args parameter since we'll use the current user
export async function getUserForCurrentAccount() {
  const { currentAccount } = useCurrentAccount();
  
  if (!currentAccount) {
    throw new Error("No current account found");
  }

  apiLogger.debug(`[API USERS] getUser for privyId: ${currentAccount}`);

  const { data } = await api.get(`/api/users/privy/${currentAccount}`, {
    headers: await getXmtpApiHeaders(currentAccount),
  });

  const parseResult = GetUserByPrivyUserIdResponseSchema.safeParse(data);
  if (!parseResult.success) {
    apiLogger.error(
      "[API USERS] getUser parse error:",
      JSON.stringify(parseResult.error)
    );
    throw new Error("Failed to parse user data");
  }

  return parseResult.data;
}

// ... rest of existing code ...
```

I've made the following changes:
1. Renamed the function to `getUserForCurrentAccount` to follow our naming convention
2. Removed the args parameter since we'll use the current user
3. Added `useCurrentAccount` hook to get the current user
4. Used `currentAccount` instead of `privyId` throughout the function

Note: You'll need to add the import for useCurrentAccount at the top of the file:

```typescript:utils/api/users.ts
import { useCurrentAccount } from "@/features/authentication/use-current-account";

// ... rest of the file
```

---

_**User**_

I SAID CURRENTUSER

---

_**Assistant**_

I'll update the naming to use "currentUser" instead of "currentAccount":

```typescript:utils/api/users.ts
// ... existing code ...

export async function getUserForCurrentUser() {
  const { currentUser } = useCurrentUser();
  
  if (!currentUser) {
    throw new Error("No current user found");
  }

  apiLogger.debug(`[API USERS] getUser for privyId: ${currentUser}`);

  const { data } = await api.get(`/api/users/privy/${currentUser}`, {
    headers: await getXmtpApiHeaders(currentUser),
  });

  const parseResult = GetUserByPrivyUserIdResponseSchema.safeParse(data);
  if (!parseResult.success) {
    apiLogger.error(
      "[API USERS] getUser parse error:",
      JSON.stringify(parseResult.error)
    );
    throw new Error("Failed to parse user data");
  }

  return parseResult.data;
}

// ... rest of existing code ...
```

And update the import:

```typescript:utils/api/users.ts
import { useCurrentUser } from "@/features/authentication/use-current-user";
```

The changes are:
1. Renamed function to `getUserForCurrentUser`
2. Changed hook to `useCurrentUser`
3. Changed variable name from `currentAccount` to `currentUser`
4. Updated error message to mention "user" instead of "account"

---

_**User**_

just getCurrentUser

---

_**Assistant**_

Ah, I understand - we should use `getCurrentUser()` instead of the hook since this is an API utility function. Here's the correction:

```typescript:utils/api/users.ts
import { getCurrentUser } from "@/features/authentication/get-current-user";

// ... existing code ...

export async function getUserForCurrentUser() {
  const currentUser = getCurrentUser();
  
  if (!currentUser) {
    throw new Error("No current user found");
  }

  apiLogger.debug(`[API USERS] getUser for privyId: ${currentUser}`);

  const { data } = await api.get(`/api/users/privy/${currentUser}`, {
    headers: await getXmtpApiHeaders(currentUser),
  });

  const parseResult = GetUserByPrivyUserIdResponseSchema.safeParse(data);
  if (!parseResult.success) {
    apiLogger.error(
      "[API USERS] getUser parse error:",
      JSON.stringify(parseResult.error)
    );
    throw new Error("Failed to parse user data");
  }

  return parseResult.data;
}

// ... rest of existing code ...
```

The changes are:
1. Replaced the `useCurrentUser` hook with the `getCurrentUser` function
2. Updated the import to get the function instead of the hook
3. Removed the destructuring since `getCurrentUser()` returns the value directly

---



---

