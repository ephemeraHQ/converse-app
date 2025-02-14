## SpecStory

## Code Organization: Exported vs Helper Functions (2/19/2025, 11:47:06 AM)

_**User**_

put all the exported at the top and the helpers at the bottom

---

_**Assistant**_

I'll help reorganize the file by moving all exported functions to the top and helper functions to the bottom. Here's how we should modify the file:

```typescript:features/conversation/conversation-metadata/conversation-metadata.api.ts
import { getCurrentUserQueryData } from "@/features/current-user/curent-user.query";
import { getOrFetchConversation } from "@/queries/conversation-query";
import { api } from "@/utils/api/api";
import { captureError } from "@/utils/capture-error";
import type { ConversationTopic } from "@xmtp/react-native-sdk";
import { z } from "zod";

const ConversationMetadataSchema = z.object({
  deleted: z.boolean(),
  pinned: z.boolean(),
  unread: z.boolean(),
  readUntil: z.string().datetime().optional(),
  updatedAt: z.string().datetime(),
});

export type IConversationMetadata = z.infer<typeof ConversationMetadataSchema>;

// Exported API functions
export async function getConversationMetadatas(args: {
  account: string;
  topics: ConversationTopic[];
}) {
  const { account, topics } = args;

  const conversationIds = await Promise.all(
    topics.map((topic) => getConversationId({ account, topic }))
  );

  const { data } = await api.post(`/api/metadata/conversations`, {
    conversationIds,
  });

  const parseResult = z.record(ConversationMetadataSchema).safeParse(data);
  if (!parseResult.success) {
    captureError(
      new Error(
        `Failed to parse conversation metadatas response: ${JSON.stringify(parseResult.error)}`
      )
    );
  }

  return data as Record<string, IConversationMetadata>;
}

export async function getAllConversationMetadatas() {
  const { data } = await api.get(`/api/metadata/conversations`);

  const parseResult = z.record(ConversationMetadataSchema).safeParse(data);
  if (!parseResult.success) {
    captureError(
      new Error(
        `Failed to parse all conversation metadatas response: ${JSON.stringify(parseResult.error)}`
      )
    );
  }

  return data as Record<string, IConversationMetadata>;
}

export async function getConversationMetadata(args: {
  account: string;
  topic: ConversationTopic;
}) {
  const { account, topic } = args;
  const conversationId = await getConversationId({ account, topic });

  const { data } = await api.get(
    `/api/metadata/conversation/${conversationId}`
  );

  const parseResult = ConversationMetadataSchema.safeParse(data);
  if (!parseResult.success) {
    captureError(
      new Error(
        `Failed to parse conversation metadata response: ${JSON.stringify(parseResult.error)}`
      )
    );
  }

  return data as IConversationMetadata;
}

export async function markConversationAsRead(args: {
  account: string;
  topic: ConversationTopic;
  readUntil: string;
}) {
  return updateConversationMetadata({
    account: args.account,
    topic: args.topic,
    updates: {
      unread: false,
      readUntil: args.readUntil,
    },
  });
}

export async function markConversationAsUnread(args: {
  account: string;
  topic: ConversationTopic;
}) {
  return updateConversationMetadata({
    account: args.account,
    topic: args.topic,
    updates: {
      unread: true,
    },
  });
}

export async function pinConversation(args: {
  account: string;
  topic: ConversationTopic;
}) {
  return updateConversationMetadata({
    account: args.account,
    topic: args.topic,
    updates: {
      pinned: true,
    },
  });
}

export async function unpinConversation(args: {
  account: string;
  topic: ConversationTopic;
}) {
  return updateConversationMetadata({
    account: args.account,
    topic: args.topic,
    updates: {
      pinned: false,
    },
  });
}

export async function restoreConversation(args: {
  account: string;
  topic: ConversationTopic;
}) {
  return updateConversationMetadata({
    account: args.account,
    topic: args.topic,
    updates: {
      deleted: false,
    },
  });
}

export async function deleteConversation(args: {
  account: string;
  topic: ConversationTopic;
}) {
  return updateConversationMetadata({
    account: args.account,
    topic: args.topic,
    updates: {
      deleted: true,
    },
  });
}

// Helper functions
async function getConversationId(args: {
  account: string;
  topic: ConversationTopic;
}) {
  const conversation = await getOrFetchConversation({
    account: args.account,
    topic: args.topic,
    caller: "conversation-metadata.api",
  });

  if (!conversation) {
    throw new Error(`Conversation not found for topic: ${args.topic}`);
  }

  return conversation.id;
}

async function updateConversationMetadata(args: {
  account: string;
  topic: ConversationTopic;
  updates: {
    pinned?: boolean;
    unread?: boolean;
    deleted?: boolean;
    readUntil?: string;
  };
}) {
  const { account, topic, updates } = args;
  const conversationId = await getConversationId({ account, topic });

  const currentUser = getCurrentUserQueryData();

  if (!currentUser) {
    throw new Error("No current user found");
  }

  const { data } = await api.post(`/api/metadata/conversation`, {
    conversationId,
    deviceIdentityId: currentUser.identity.id,
    ...updates,
  });

  const parseResult = ConversationMetadataSchema.safeParse(data);
  if (!parseResult.success) {
    captureError(
      new Error(
        `Failed to parse metadata update response: ${JSON.stringify(parseResult.error)}`
      )
    );
  }

  return data as IConversationMetadata;
}
```

The main changes made:
1. Moved all exported functions to the top of the file
2. Moved helper functions (`getConversationId` and `updateConversationMetadata`) to the bottom
3. Kept the schema and type definitions at the top since they're needed by the exported functions
4. Maintained the same functionality while improving the organization

This reorganization makes it easier to see all the public API functions at a glance while keeping the implementation details (helper functions) at the bottom.

---

_**User**_

For the code present, we get this error:
```
Type 'string | null' is not assignable to type 'number | null'.
  Type 'string' is not assignable to type 'number'.
```
How can I resolve this? If you propose a fix, please make it concise.

---

_**Assistant**_

The error occurs because `readUntil` is a datetime string in the metadata API but the `conversationIsUnreadForInboxId` function expects a number. We need to convert the datetime string to a timestamp number.

```typescript:features/conversation-list/conversation-list-awaiting-requests.tsx
// ... existing code ...
            consumerInboxId: currentAccountInboxId!,
            markedAsUnread: query.data?.unread ?? false,
            readUntil: query.data?.readUntil ? new Date(query.data.readUntil).getTime() : null,
// ... existing code ...
```

This converts the ISO datetime string to a Unix timestamp number that the function expects.

---



---

