## SpecStory

## Refactoring Notification Functions (1/15/2025, 4:19:25 PM)

_**User**_

move notificaiton function into a new file

---

_**Assistant**_

I'll help you move the notification-related functions into a new file. Here's how to split this up:

1. First, create a new file for notifications:

```typescript:utils/notifications-api.ts
import api from "./api";
import { getXmtpApiHeaders } from "./api";
import logger from "./logger";

export const getLastNotificationsSubscribeHash = async (
  account: string,
  nativeToken: string
) => {
  const { data } = await api.post(
    "/api/notifications/subscriptionhash",
    { nativeToken },
    {
      headers: await getXmtpApiHeaders(account),
    }
  );
  return data?.hash as string | undefined;
};

export const saveNotificationsSubscribe = async (
  account: string,
  nativeToken: string,
  nativeTokenType: string,
  notificationChannel: string | null,
  topicsWithKeys: {
    [topic: string]: {
      status: "PUSH" | "MUTED";
      hmacKeys?: any;
    };
  }
) => {
  const { data } = await api.post(
    "/api/subscribe",
    { nativeToken, nativeTokenType, notificationChannel, topicsWithKeys },
    {
      headers: await getXmtpApiHeaders(account),
    }
  );
  return data.subscribeHash as string;
};
```

2. Then modify the original file by removing these functions:

```typescript:utils/api.ts
// ... existing code ...

// Remove these functions:
// - getLastNotificationsSubscribeHash
// - saveNotificationsSubscribe

// ... rest of the code ...
```

The changes:
1. Created a new file specifically for notification-related API calls
2. Moved the two notification functions to the new file
3. Imported necessary dependencies in the new file
4. Kept the same function signatures and implementation

The notification functions are now better organized in their own dedicated file while maintaining the same functionality.

---



---

