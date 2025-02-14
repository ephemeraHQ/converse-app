## SpecStory

## Adjusting Message Layout for Reactions (1/30/2025, 3:11:47 PM)

_**User**_

reactions should be under children BUT i need to make sure that ConversationSenderAvatar isn't aligned with the reactions. It should be aligned with the message

---

_**Assistant**_

I'll help modify the layout to ensure the reactions appear under the message while keeping the sender avatar aligned with the message content. Here's how we can adjust the structure:

```typescript:features/conversation/conversation-message/conversation-message-layout.tsx
// ... existing code ...

export const ConversationMessageLayout = memo(
  function ConversationMessageLayout({
    children,
    reactions,
  }: IConversationMessageLayoutProps) {
    const { theme } = useAppTheme();
    const { spaceBetweenSenderAvatarAndMessage } =
      useConversationMessageStyles();

    // ... existing code ...

    return (
      <>
        <MessageContainer>
          <HStack style={{ alignItems: "flex-start" }}>
            {!fromMe && !isSystemMessage && (
              <>
                {!hasNextMessageInSeries ? (
                  <ConversationSenderAvatar inboxId={senderInboxId} />
                ) : (
                  <VStack style={{ width: theme.avatarSize.sm }} />
                )}
                <VStack style={{ width: spaceBetweenSenderAvatarAndMessage }} />
              </>
            )}
            <AnimatedVStack
              style={{
                rowGap: theme.spacing["4xs"],
                alignItems: fromMe ? "flex-end" : "flex-start",
                flex: 1,
              }}
            >
              {!fromMe && !hasPreviousMessageInSeries && !isSystemMessage && (
                <ConversationMessageSender inboxId={senderInboxId} />
              )}
              {children}
            </AnimatedVStack>
          </HStack>
          {reactions && (
            <HStack
              style={{
                paddingLeft: fromMe ? 0 : theme.spacing.sm,
                paddingRight: fromMe ? theme.spacing.sm : 0,
                justifyContent: fromMe ? "flex-end" : "flex-start",
                marginLeft: !fromMe ? theme.avatarSize.sm + spaceBetweenSenderAvatarAndMessage : 0,
              }}
            >
              {reactions}
            </HStack>
          )}
        </MessageContainer>
      </>
    );
  }
);

// ... existing code ...
```

Key changes made:
1. Wrapped the avatar and message content in a `HStack` with `alignItems: "flex-start"` to ensure proper alignment
2. Moved reactions outside of the message content `AnimatedVStack`
3. Added proper spacing for reactions by offsetting them when there's an avatar
4. Added conditional rendering for reactions
5. Added proper padding and justification for reactions based on message direction (fromMe)

This structure will ensure that:
- The avatar stays aligned with the message content
- Reactions appear below the message
- Proper spacing is maintained for both fromMe and received messages
- The layout remains consistent with the existing design

---



---

