## SpecStory

## Refactoring TypeScript: Replacing !! with Boolean() (1/30/2025, 8:30:58 PM)

_**User**_

replace !! with Boolean(...)

---

_**Assistant**_

I'll help you replace the `!!` operators with `Boolean()`. Here are the necessary edits:

```typescript:features/conversation/conversation-message/conversation-message-layout.tsx
// ... existing code ...

        {Boolean(reactions) && (
          <HStack
            style={[
              fromMe
                ? {
                    paddingRight: messageContainerSidePadding,
                    justifyContent: "flex-end",
                  }
                : {
                    paddingLeft:
                      messageContainerSidePadding +
                      spaceBetweenSenderAvatarAndMessage +
                      senderAvatarSize,
                    justifyContent: "flex-start",
                  },
              hasNextMessageInSeries && {
                marginBottom: spaceBetweenSeriesWithReactions,
              },
            ]}
          >
            {reactions}
          </HStack>
        )}

        {Boolean(messageStatus) && (
          <HStack
            style={{
              paddingRight: messageContainerSidePadding,
              justifyContent: "flex-end",
            }}
          >
            {messageStatus}
          </HStack>
        )}

// ... existing code ...
```

I've replaced both instances of the `!!` operator with `Boolean()`. This change makes the code more explicit and follows better TypeScript practices while maintaining the same functionality of converting values to booleans.

---



---

