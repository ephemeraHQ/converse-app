## SpecStory

## Fixing Return Value Logic in Code (1/14/2025, 2:31:45 PM)

_**User**_

problem here i return false but in the result it shows value: true?

---

_**Assistant**_

Looking at the code from `conversation-requests-list.screen.tsx`, I can see the issue. The problem is in the `finally` block which is overriding your return value. Here's how to fix it:

```typescript:features/conversation-requests-list/conversation-requests-list.screen.tsx
        const isSpamResults = await Promise.allSettled(
          conversations.map(async (conversation) => {
            try {
              // ! since we check for lastMessage in the select, we can safely assume it's not undefined
              const lastMessage = conversation.lastMessage!;
              const messageText = getMessageStringContent(lastMessage);

              if (!messageText) {
                return true;
              }

              // Get spam score
              const contentType = getMessageContentType(
                lastMessage.contentTypeId!
              );

              if (!contentType) {
                return true;
              }

              const spamScore = await getV3SpamScore({
                messageText: messageText,
                contentType,
              });

              console.log("spamScore:", spamScore);

              return spamScore !== 0;
            } catch (error) {
              captureError(error);
              return true;
            }
          })
        );
```

The changes made:
1. Removed the `finally` block as it was always returning `true` regardless of the spam check result
2. Simplified the return logic to `spamScore !== 0` instead of the if-statement
3. Moved the `return true` into the catch block

The `finally` block always executes after `try/catch`, so it was overwriting whatever value you returned from the spam check. Now the function will properly return `false` when the spam score is 0, and `true` otherwise or if there's an error.

---



---

