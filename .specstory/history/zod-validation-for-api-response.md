## SpecStory

## Zod Validation for API Response (1/13/2025, 11:08:07 AM)

_**User**_

I want to use zod here to make sure the returned data as the expected type

---

_**Assistant**_

I'll help you add Zod validation to ensure the returned data matches the expected `ConversationTopicData` type. First, we'll need to create a Zod schema for the `ConversationTopicData` type and then use it to validate the API response.

Here's how to modify the code:

```typescript:utils/api.ts
// ... existing imports ...
import { z } from "zod";

// Create a Zod schema for ConversationTopicStatus
const ConversationTopicStatusSchema = z.enum(["deleted", "unread", "read"]);

// Create a Zod schema for ConversationTopicData
const ConversationTopicDataSchema = z.object({
  status: ConversationTopicStatusSchema,
  readUntil: z.number().optional(),
  isPinned: z.boolean().optional(),
});

export async function getConversationTopicData(
  account: string,
  topic: ConversationTopic
) {
  const { data } = await api.get(`/api/topics/${topic}`, {
    headers: await getXmtpApiHeaders(account),
  });
  // Parse and validate the response data
  return ConversationTopicDataSchema.parse(data);
}
```

This update:
1. Imports the Zod library
2. Creates a schema for the `ConversationTopicStatus` enum
3. Creates a schema for the `ConversationTopicData` type with all its fields
4. Uses `parse()` to validate the response data against the schema

Now if the API returns data that doesn't match the expected structure, Zod will throw a detailed error explaining what's wrong with the data.

---



---

