## SpecStory

## Updating Conversation Metadata with Device ID (2/19/2025, 11:41:59 AM)

_**User**_

ok here we pass account in args but we also need to get the deviceIdentiyId, to get that we need to go get the @curent-user.query.ts so we'll add a getCurrentUserQueryData, get the user and get the deviceIdenityId from there

---

_**Assistant**_

I'll help you modify the conversation-metadata.api.ts file to use the current user's deviceIdentityId. First, let's add the getCurrentUserQueryData function to the current-user.query.ts file, and then update the conversation-metadata.api.ts to use it.

First, let's add the getter to current-user.query.ts:

```typescript:features/current-user/curent-user.query.ts
// ... existing code ...

export const getCurrentUserQueryData = () => {
  return queryClient.getQueryData<CreateUserResponse>(
    getCurrentUserQueryOptions().queryKey
  );
};

// ... rest of existing code ...
```

Now, let's update the conversation-metadata.api.ts to use the current user's deviceIdentityId:

```typescript:features/conversation/conversation-metadata/conversation-metadata.api.ts
import { getCurrentUserQueryData } from "@/features/current-user/curent-user.query";
// ... existing imports ...

// Helper function for metadata updates
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
  if (!currentUser?.deviceIdentityId) {
    throw new Error("No device identity ID found for current user");
  }

  const { data } = await api.post(`/api/metadata/conversation`, {
    conversationId,
    deviceIdentityId: currentUser.deviceIdentityId,
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

// ... rest of existing code ...
```

The changes:
1. Added import for getCurrentUserQueryData
2. Updated updateConversationMetadata to get the deviceIdentityId from the current user instead of using account
3. Added error handling if no deviceIdentityId is found

This ensures we're using the correct deviceIdentityId from the current user when making metadata updates.

---



---

