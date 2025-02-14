## SpecStory

## Best Practices for Date Formatting in APIs (2/19/2025, 11:53:16 AM)

_**User**_

if my backend expect a Datetime it'S good to send new Date().toIsostring right6

---

_**Assistant**_

Let me explain why sending dates as ISO strings can be problematic and suggest a better approach.

```typescript:features/conversation/hooks/use-mark-conversation-as-read.ts
// ... existing code ...

// ❌ Using local timezone ISO string can cause issues
readUntil: new Date().toISOString(),

// ✅ Better: Use UTC timestamp to avoid timezone issues
readUntil: new Date().toUTCString(),
```

Here's why:

1. `toISOString()` includes timezone information, but it converts the date to UTC first. This can lead to unexpected behavior if your backend is not properly handling timezone conversions.

2. If your backend expects a DateTime:
   - Using `toUTCString()` is generally safer as it explicitly works with UTC
   - Even better would be to use a date handling library like `date-fns` or `dayjs` that provides more consistent cross-platform formatting

Here's how I would update the file:

```typescript:features/conversation/hooks/use-mark-conversation-as-read.ts
import { getCurrentAccount } from "@/features/multi-inbox/multi-inbox.store";
import {
  getConversationMetadataQueryData,
  updateConversationMetadataQueryData,
} from "@/features/conversation/conversation-metadata/conversation-metadata.query";
import { markConversationAsRead } from "@/features/conversation/conversation-metadata/conversation-metadata.api";
import { useMutation } from "@tanstack/react-query";
import { ConversationTopic } from "@xmtp/react-native-sdk";

export function useMarkConversationAsRead(args: { topic: ConversationTopic }) {
  const { topic } = args;

  const { mutateAsync: markAsReadAsync } = useMutation({
    mutationFn: async () => {
      const currentAccount = getCurrentAccount()!;
      const readUntil = new Date().toUTCString();
      
      await markConversationAsRead({
        account: currentAccount,
        topic,
        readUntil,
      });
    },
    onMutate: () => {
      const currentAccount = getCurrentAccount()!;
      const readUntil = new Date().toUTCString();
      
      const previousData = getConversationMetadataQueryData({
        account: currentAccount,
        topic,
      });

      updateConversationMetadataQueryData({
        account: currentAccount,
        topic,
        updateData: {
          readUntil,
          unread: false,
        },
      });

      return { previousData };
    },
    onError: (error, _, context) => {
      const currentAccount = getCurrentAccount()!;
      updateConversationMetadataQueryData({
        account: currentAccount,
        topic,
        updateData: context?.previousData ?? null,
      });
    },
  });

  return {
    markAsReadAsync,
  };
}
```

I would also recommend:

1. If possible, store the date format requirement in a constant or config file
2. Consider using a date utility function that handles the formatting consistently:

```typescript
// date.utils.ts
export function formatDateForApi(date: Date): string {
  return date.toUTCString();
}
```

This way, if you need to change the date format in the future, you only need to update it in one place.

Remember to check with your backend team about:
1. The exact date format they expect
2. How they handle timezones
3. Whether they need millisecond precision

This will help ensure your date handling is robust and maintainable.

---

_**User**_

how would i know if my backend wants utc or not?

---

_**Assistant**_

The best way to know what date format your backend expects is to:

1. Check the API documentation
2. Look at the backend code if you have access
3. Ask the backend developers directly
4. Test the API endpoint and observe what format it accepts/returns

Here's a quick way to test it:

```typescript
// Test different formats and check which one works
const dates = {
  iso: new Date().toISOString(),        // "2024-03-14T15:30:00.000Z"
  utc: new Date().toUTCString(),        // "Thu, 14 Mar 2024 15:30:00 GMT"
  locale: new Date().toString(),         // "Thu Mar 14 2024 11:30:00 GMT-0400"
  timestamp: new Date().getTime(),       // 1710425400000
}

// Make test API calls with each format and see which one works correctly
```

You can also inspect your API responses - the date format in the responses often matches what the backend expects for inputs.

Common backend date format expectations:
1. ISO 8601 (`toISOString()`): Most common for modern APIs, especially with frameworks like Node.js/Express
2. Unix timestamp (milliseconds): Common with Java backends
3. UTC string: Less common, but used in some legacy systems
4. Custom format: Some backends might require specific formatting

If you're working with a modern API:
```typescript
// This is usually the safest choice
readUntil: new Date().toISOString() // "2024-03-14T15:30:00.000Z"
```

I recommend:
1. Create a date utility file to centralize date formatting
2. Document the expected format in comments
3. Add validation if possible

```typescript:utils/date.utils.ts
/**
 * Formats a date for API requests
 * Format: ISO 8601 (e.g. "2024-03-14T15:30:00.000Z")
 */
export function formatDateForApi(date: Date): string {
  // Use the format your backend expects
  return date.toISOString();
}
```

Then use it in your code:
```typescript:features/conversation/hooks/use-mark-conversation-as-read.ts
import { formatDateForApi } from "@/utils/date.utils";

// ...
const readUntil = formatDateForApi(new Date());
```

This way, if the backend's date format requirements change, you only need to update one place.

---

_**User**_

we use Prisma and here's what in our schema

readUntil        DateTime?

---

_**Assistant**_



---



---

