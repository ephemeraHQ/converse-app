## SpecStory

## Implementing Navigation for Conversation Requests (1/14/2025, 1:01:42 PM)

_**User**_

just do like @conversation.nav.tsx and implement stuff based on what's in @ConversationRequestsListNav.ios.tsx 

---

_**Assistant**_

I'll help create a simplified navigation file for conversation requests list following the pattern from conversation.nav.tsx. Here's the implementation:

```typescript:features/conversation-requests-list/conversation-requests-list.nav.tsx
import { NativeStack } from "@/screens/Navigation/Navigation";
import ConversationRequestsListNav from "./ConversationRequestsListNav.ios";

export const ConversationRequestsListScreenConfig = {
  path: "/conversation-requests",
};

export function ConversationRequestsListNav() {
  return (
    <NativeStack.Screen
      options={{
        title: "",
        headerBackTitle: "",
      }}
      name="ChatsRequests"
      component={ConversationRequestsListNav}
    />
  );
}
```

This implementation:
1. Follows the same pattern as conversation.nav.tsx
2. Creates a simple navigation wrapper for the ConversationRequestsListNav component
3. Defines the screen configuration with a path
4. Uses consistent naming and structure with the rest of the application

The actual component logic remains in ConversationRequestsListNav.ios.tsx, while this file serves as the navigation configuration layer.

---



---

