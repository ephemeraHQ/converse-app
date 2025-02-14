## SpecStory

## Fixing Syntax Error in Code (1/31/2025, 11:51:23 AM)

_**User**_

where is the syntax error

---

_**Assistant**_

Looking at the provided code, there appears to be a missing closing curly brace `}` at the end of the `getConversation` function. Here's the fix:

```typescript:queries/conversation-query.ts
async function getConversation(args: IGetConversationArgs) {
  // ... existing code ...

  return conversation;
} // <-- Add this closing brace

export const useConversationQuery = (
  // ... rest of the file ...
```

The function `getConversation` was not properly closed before the `useConversationQuery` export. Adding the closing curly brace should resolve the syntax error.

---



---

