## SpecStory

## Inline Style Modification for React Component (1/30/2025, 3:35:56 PM)

_**User**_

remove messageContainer and put the style inline instead

---

_**Assistant**_

I'll help you remove the `MessageContainer` component and move its styles inline. Here's how to modify the code:

```typescript:features/conversation/conversation-message/conversation-message-layout.tsx
// ... existing code ...

export const ConversationMessageLayout = memo(
  function ConversationMessageLayout({
    message,
    reactions,
    messageStatus,
  }: IConversationMessageLayoutProps) {
    const { theme } = useAppTheme();
    const { spaceBetweenSenderAvatarAndMessage } =
      useConversationMessageStyles();

    const {
      senderInboxId,
      fromMe,
      hasNextMessageInSeries,
      hasPreviousMessageInSeries,
      isSystemMessage,
      nextMessage,
      message: messageData,
    } = useMessageContextStoreContext(
      useSelect([
        "senderInboxId",
        "fromMe",
        "hasNextMessageInSeries",
        "hasPreviousMessageInSeries",
        "isSystemMessage",
        "nextMessage",
        "message",
      ])
    );

    const isGroupUpdate = isGroupUpdatedMessage(messageData);

    return (
      <AnimatedVStack
        style={{
          ...(!hasNextMessageInSeries &&
            nextMessage && {
              marginBottom: theme.spacing.sm,
            }),
        }}
      >
        <AnimatedHStack
          style={{
            width: "100%",
            alignItems: "flex-end",
            ...(!isGroupUpdate && {
              ...(fromMe
                ? {
                    paddingRight: theme.spacing.sm,
                    justifyContent: "flex-end",
                  }
                : {
                    paddingLeft: theme.spacing.sm,
                    justifyContent: "flex-start",
                  }),
            }),
          }}
        >
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
            }}
          >
            {!fromMe && !hasPreviousMessageInSeries && !isSystemMessage && (
              <ConversationMessageSender inboxId={senderInboxId} />
            )}
            {message}
          </AnimatedVStack>
        </AnimatedHStack>

        {/* ... existing code for reactions and messageStatus ... */}
      </AnimatedVStack>
    );
  }
);

// Remove MessageContainer component
```

Key changes made:
1. Removed the `MessageContainer` component
2. Moved the styles from `MessageContainer` directly into the `AnimatedHStack`
3. Added `message` to the `useSelect` array to access it for `isGroupUpdate` check
4. Moved the `isGroupUpdate` check into the main component
5. Preserved all the existing styling logic and functionality

---



---

