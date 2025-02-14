## SpecStory

## Restart Message Streaming on New Conversation (1/28/2025, 3:18:40 PM)

_**User**_

on new conversation we also need to restart the streamMessages

---

_**Assistant**_

I'll help you modify the `onNewConversation` function to restart message streaming when a new conversation is detected. Based on the code style guide, I'll add the necessary import and update the function.

```typescript:features/streams/stream-conversations.ts
// ... existing code ...

import { startMessageStreaming } from "@/features/streams/stream-messages";

function onNewConversation(args: { account: string; conversation: any }) {
  const { account, conversation } = args;

  if (isConversationAllowed(conversation)) {
    addConversationToConversationsQuery({
      account,
      conversation,
    });
    // Restart message streaming for the new conversation
    startMessageStreaming({ account, conversation });
  } else if (isConversationConsentUnknown(conversation)) {
    addConversationToUnknownConsentConversationsQuery({
      account,
      conversation,
    });
  }
}
// ... existing code ...
```

I've made the following changes:
1. Added import for `startMessageStreaming` from the streams feature
2. Added a call to `startMessageStreaming` after adding the conversation to the conversations query, passing both the account and conversation as object parameters following the style guide
3. Only start message streaming for allowed conversations (not for unknown consent conversations)

---



---

