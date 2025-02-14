## SpecStory

## Adjusting Message Container Margins (1/30/2025, 3:39:50 PM)

_**User**_

for the reaction contaier if we have a nextMessageInSeries,  add a xxxs marginbottom

---

_**Assistant**_

I'll help you modify the reactions container to add a margin bottom when there's a next message in series. Here's the change:

```typescript:features/conversation/conversation-message/conversation-message-layout.tsx
// ... existing code ...

        <HStack
          style={{
            marginTop: theme.spacing["4xs"],
            ...(hasNextMessageInSeries && {
              marginBottom: theme.spacing["3xs"],
            }),
            ...(fromMe
              ? {
                  paddingRight: theme.spacing.sm,
                  justifyContent: "flex-end",
                }
              : {
                  paddingLeft:
                    theme.spacing.sm +
                    spaceBetweenSenderAvatarAndMessage +
                    theme.avatarSize.sm,
                  justifyContent: "flex-start",
                }),
          }}
        >
          {reactions}
        </HStack>

// ... existing code ...
```

I've added a conditional margin bottom using the `hasNextMessageInSeries` flag. When there's a next message in the series, it will add a `3xs` margin bottom to the reactions container. The rest of the styling remains unchanged.

---



---

