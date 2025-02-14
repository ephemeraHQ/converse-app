## SpecStory

## Function Name Update: Topic to Conversation (1/13/2025, 12:13:22 PM)

_**User**_

instead of like "deleteTopic" update to "deleteConversation" update all 

---

_**Assistant**_

I'll help you rename all the functions from "Topic" to "Conversation" to maintain consistency. Here are the changes needed:

```typescript:utils/api/conversation-data.ts
// ... existing schemas ...

export async function markConversationAsRead(args: {
  account: string;
  topic: ConversationTopic;
  readUntil: number;
}) {
  // ... same implementation ...
}

export async function markConversationAsUnread(args: {
  account: string;
  topic: ConversationTopic;
}) {
  // ... same implementation ...
}

export async function pinConversation(args: {
  account: string;
  topic: ConversationTopic;
  isPinned: boolean;
}) {
  // ... same implementation ...
}

export async function restoreConversation(args: {
  account: string;
  topic: ConversationTopic;
}) {
  // ... same implementation ...
}

export async function deleteConversation(args: {
  account: string;
  topic: ConversationTopic;
}) {
  // ... same implementation ...
}

// getConversationsData is already correctly named
```

The changes involve renaming these functions:
- `markTopicAsRead` → `markConversationAsRead`
- `markTopicAsUnread` → `markConversationAsUnread`
- `pinTopic` → `pinConversation`
- `restoreTopic` → `restoreConversation`
- `deleteTopic` → `deleteConversation`

The implementations remain exactly the same, only the function names have changed. Note that `getConversationsData` was already using the "conversation" terminology, so it doesn't need to be changed.

---



---

