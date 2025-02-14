## SpecStory

## Code Refactoring for Clarity (1/14/2025, 1:14:33 PM)

_**User**_

I'm sure we can make this cleaner no?

---

_**Assistant**_

Yes, we can make this code cleaner by extracting the conversation processing logic into separate functions and making the flow more readable. Here's a suggested refactoring:

```typescript:features/conversation-requests-list/conversation-requests-list.screen.tsx
// ... existing imports ...

type ProcessedConversation = {
  conversation: ConversationWithCodecsType;
  isSpam: boolean;
} | null;

function getMessageContent(lastMessage: any): string {
  try {
    const decodedContent = lastMessage.content() ?? lastMessage.fallback ?? "";
    return typeof decodedContent === "string" 
      ? decodedContent 
      : (lastMessage.fallback ?? "");
  } catch {
    return lastMessage.fallback ?? "";
  }
}

async function getSpamScoreForMessage(content: string, contentTypeId: string): Promise<number> {
  try {
    const contentType = getMessageContentType(contentTypeId);
    if (!contentType) return 0;

    return await getV3SpamScore({
      message: content,
      contentType,

---

_**User**_

Make cleaner but NOT external functions

---

_**Assistant**_

Ah, I understand - let's clean up the code while keeping it within the same scope. Here's a more readable version with better flow control and cleaner logic:

```typescript:features/conversation-requests-list/conversation-requests-list.screen.tsx
// ... existing code ...
        const results = await Promise.allSettled(
          (conversations ?? []).map(async (conversation) => {
            // Skip non-unknown state conversations
            if (conversation.state !== "unknown") return null;
            if (!conversation.lastMessage) return null;

            const lastMessage = conversation.lastMessage;
            
            // Get message content with fallback handling
            const content = await (async () => {
              try {
                const decodedContent = lastMessage.content() ?? lastMessage.fallback ?? "";
                return typeof decodedContent === "string" 
                  ? decodedContent 
                  : lastMessage.fallback ?? "";
              } catch {
                return lastMessage.fallback ?? "";
              }
            })();

            // Calculate spam score
            const spamScore = await (async () => {
              try {
                const contentType = getMessageContentType(lastMessage.contentTypeId!);
                return contentType 
                  ? await getV3SpamScore({ message: content, contentType })
                  : 0;
              } catch (error) {
                logger.error("Couldn't get spam score", error);
                return 0;
              }
            })();

            return {
              conversation,
              isSpam: spamScore > 1,
            };
          })
        );
// ... existing code ...
```

Key improvements:
- Early returns for invalid conditions
- Grouped related logic into immediately-invoked async functions for better readability
- Simplified nested conditionals
- More consistent error handling
- Clearer separation between content extraction and spam score calculation
- Removed unnecessary variable declarations

The code now has a clearer flow while maintaining all the original functionality.

---



---

