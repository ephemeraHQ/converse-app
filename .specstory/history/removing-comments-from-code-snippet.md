## SpecStory

## Removing Comments from Code Snippet (1/30/2025, 4:03:04 PM)

_**User**_

remove comments

---

_**Assistant**_

I'll help remove the comments while preserving the code functionality. Here's the simplified edit showing just the removed comments:

```typescript:features/conversation/conversation-message/conversation-message-layout.tsx
// ... existing code ...

export const ConversationMessageLayout = memo(
  function ConversationMessageLayout({
    message,
    reactions,
    messageStatus,
  }: IConversationMessageLayoutProps) {
    // ... existing code ...

    return (
      <VStack
        style={{
          ...(!hasNextMessageInSeries &&
            nextMessage && {
              marginBottom: theme.spacing.sm,
            }),
        }}
      >
        <VStack
          style={{
            rowGap: theme.spacing["4xs"],
          }}
        >
          <HStack
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

            <VStack
              style={{
                alignItems: fromMe ? "flex-end" : "flex-start",
              }}
            >
              {!fromMe && !hasPreviousMessageInSeries && !isSystemMessage && (
                <VStack
                  style={{
                    flexDirection: "row",
                    marginLeft: theme.spacing.xs,
                    marginBottom: theme.spacing.xxxs,
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
          )}
        </VStack>

        {!!messageStatus && (
          <HStack
            style={{
              paddingRight: theme.spacing.sm,
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

// ... existing code ...
```

I've removed all the comments from the code while maintaining its functionality. The main changes were:
1. Removed inline comments describing different sections of the layout
2. Removed the debugBorder comment in the reactions HStack
3. Removed the comment about message status being only for own messages

---



---

