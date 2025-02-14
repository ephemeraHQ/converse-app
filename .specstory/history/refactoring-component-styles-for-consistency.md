## SpecStory

## Refactoring Component Styles for Consistency (1/30/2025, 4:12:26 PM)

_**User**_

use vlaues from @conversation-message.styles.ts and if it's not there, add it and use it then

---

_**Assistant**_

I'll help you refactor the code to use values from the styles file. I notice some spacing values that should be moved to the styles file for consistency. I'll first update the styles file and then show the changes needed in the layout component.

First, let's add the missing style values to `conversation-message.styles.ts`:

```typescript:features/conversation/conversation-message/conversation-message.styles.ts
// ... existing code ...
  return {
    senderAvatarSize: theme.avatarSize.sm,
    spaceBetweenSenderAvatarAndMessage: theme.spacing.xxs,
    messageContainerSidePadding: theme.spacing.sm,
    smallSpaceBetweenMessageAndReactions: theme.spacing["4xs"],
    spaceBetweenMessageFromDifferentUserOrType: theme.spacing.sm,
    // Add new values
    spaceBetweenMessagesInSeries: theme.spacing["4xs"],
    spaceBetweenMessageAndSender: theme.spacing.xxxs,
    senderNameLeftMargin: theme.spacing.xs,
    spaceBetweenSeriesWithReactions: `${theme.spacing["3xs"] + theme.spacing["4xs"]}`,
  };
// ... existing code ...
```

Now, let's update the layout component to use these style values:

```typescript:features/conversation/conversation-message/conversation-message-layout.tsx
// ... existing code ...
export const ConversationMessageLayout = memo(
  function ConversationMessageLayout({
    message,
    reactions,
    messageStatus,
  }: IConversationMessageLayoutProps) {
    const { theme } = useAppTheme();
    const {
      messageContainerSidePadding,
      spaceBetweenSenderAvatarAndMessage,
      senderAvatarSize,
      spaceBetweenMessageFromDifferentUserOrType,
      spaceBetweenMessagesInSeries,
      spaceBetweenMessageAndSender,
      senderNameLeftMargin,
      spaceBetweenSeriesWithReactions,
    } = useConversationMessageStyles();

    // ... existing code ...

    return (
      <VStack
        style={{
          ...(!hasNextMessageInSeries &&
            nextMessage && {
              marginBottom: spaceBetweenMessageFromDifferentUserOrType,
            }),
        }}
      >
        <HStack
          style={{
            width: "100%",
            alignItems: "flex-end",
            ...(!isGroupUpdate && {
              ...(fromMe
                ? {
                    paddingRight: messageContainerSidePadding,
                    justifyContent: "flex-end",
                  }
                : {
                    paddingLeft: messageContainerSidePadding,
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
                <VStack style={{ width: senderAvatarSize }} />
              )}
              <VStack style={{ width: spaceBetweenSenderAvatarAndMessage }} />
            </>
          )}

          <VStack
            style={{
              alignItems: fromMe ? "flex-end" : "flex-start",
              ...((hasNextMessageInSeries || !!reactions) && {
                marginBottom: spaceBetweenMessagesInSeries,
              }),
            }}
          >
            {!fromMe && !hasPreviousMessageInSeries && !isSystemMessage && (
              <VStack
                style={{
                  flexDirection: "row",
                  marginLeft: senderNameLeftMargin,
                  marginBottom: spaceBetweenMessageAndSender,
                }}
              >
                <ConversationMessageSender inboxId={senderInboxId} />
              </VStack>
            )}

            {message}
          </VStack>
        </HStack>

        {!!reactions && (
          <HStack
            style={{
              ...(hasNextMessageInSeries && {
                marginBottom: spaceBetweenSeriesWithReactions,
              }),
              ...(fromMe
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
                  }),
            }}
          >
            {reactions}
          </HStack>
        )}

        {!!messageStatus && (
          <HStack
            style={{
              paddingRight: messageContainerSidePadding,
              justifyContent: "flex-end",
            }}
          >
            {messageStatus}
          </HStack>
        )}
      </VStack>
    );
  }
);
```

The changes include:
1. Added new style values to the styles file for consistency
2. Replaced all hardcoded theme spacing values with the corresponding style values
3. Destructured all needed style values at the top of the component
4. Used the style values throughout the component's JSX

This makes the styling more maintainable and consistent across the component.

---



---

