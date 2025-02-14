## SpecStory

## Message Layout Padding Adjustments (1/30/2025, 3:34:12 PM)

_**User**_

need to handle the padding left and right better . Need to check if fromMe and also to put the right padding for like "spaceBetweenSenderAvatarAndMessage" abd the avatarSize if the message isn't fromme

---

_**Assistant**_

I'll help you adjust the padding for the reactions HStack to match the message layout logic. Here's the updated code:

```typescript:features/conversation/conversation-message/conversation-message-layout.tsx
// ... existing code ...

        <HStack
          style={{
            ...(fromMe
              ? {
                  paddingRight: theme.spacing.sm,
                  justifyContent: "flex-end",
                }
              : {
                  paddingLeft: theme.spacing.sm + spaceBetweenSenderAvatarAndMessage + theme.avatarSize.sm,
                  justifyContent: "flex-start",
                }),
          }}
        >
          {reactions}
        </HStack>

// ... existing code ...
```

This update:
1. Adds conditional styling based on `fromMe`
2. For messages from others (`!fromMe`), adds proper left padding that accounts for:
   - Base padding (`theme.spacing.sm`)
   - Space between avatar and message (`spaceBetweenSenderAvatarAndMessage`)
   - Avatar width (`theme.avatarSize.sm`)
3. For own messages (`fromMe`), adds right padding and right alignment
4. Adds `justifyContent` to ensure reactions align with the message direction

This will ensure the reactions align properly with the message bubbles above them, taking into account the avatar space for messages from others.

---



---

