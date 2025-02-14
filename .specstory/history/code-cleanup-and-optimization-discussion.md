## SpecStory

## Code Cleanup and Optimization Discussion (12/9/2024, 11:23:16 AM)

_**User**_

make this cleaner

---

_**Assistant**_

I'll help clean up the code following your preferences. Here are the main improvements:

1. For the DmConversationScreen:
- Simplify props destructuring
- Clean up styling
- Add proper type for the screen props

2. For the ConversationContext:
- Improve type definitions
- Clean up the sendMessage function
- Remove commented code
- Simplify the context structure

Here are the cleaned-up versions:

```typescript:features/conversation/dm-conversation/dm-conversation.screen.tsx
type IScreenProps = NativeStackScreenProps<NavigationParamList, "DmConversation">

export const DmConversationScreen = memo(function DmConversationScreen(args: { route: IScreenProps["route"] }) {
  const { route } = args
  const { peerAddress, topic } = route.params
  
  const currentAccount = useCurrentAccount()!
  
  const { data: conversation, isLoading } = useConversationWithPeerQuery(currentAccount, peerAddress, {
    enabled: !!peerAddress,
  })

  if (!peerAddress) {
    return null
  }

  return (
    <Screen style={{ flex: 1 }}>
      {isLoading ? (
        <Center style={{ flex: 1 }}>
          <Loader />
        </Center>
      ) : !conversation ? (
        <NewDmConversationContent peerAddress={peerAddress} />
      ) : (
        <ExistingDmConversationContent topic={conversation.topic} />
      )}
    </Screen>
  )
})
```

```typescript:features/conversation/conversation-context.tsx
type IMessageContent = {
  text?: string
  remoteAttachment?: RemoteAttachmentContent
}

type ISendMessageParams = {
  content: IMessageContent
  referencedMessageId?: MessageId
} & (
  | { content: { text: string; remoteAttachment?: RemoteAttachmentContent } }
  | { content: { text?: string; remoteAttachment: RemoteAttachmentContent } }
)

type IReactionParams = {
  messageId: MessageId
  emoji: string
}

type IConversationContextType = {
  isAllowedConversation: boolean
  isBlockedConversation: boolean
  conversationNotFound: boolean
  conversationId: ConversationId | null
  sendMessage: (message: ISendMessageParams) => Promise<void>
  reactOnMessage: (args: IReactionParams) => Promise<void>
  removeReactionFromMessage: (args: IReactionParams) => Promise<void>
}

export const ConversationContextProvider = (args: { children: React.ReactNode }) => {
  const { children } = args
  const topic = useConversationCurrentTopic()!
  const currentAccount = useCurrentAccount()!
  
  const { data: conversation, isLoading: isLoadingConversation } = useConversationQuery(currentAccount, topic)

  useEffect(() => {
    if (!conversation || conversation.version !== ConversationVersion.GROUP) {
      return
    }

    if (!conversation.isGroupActive) {
      navigate("Chats")
    }
  }, [conversation])

  const reactOnMessage = useCallback(async (args: IReactionParams) => {
    if (!conversation) {
      return
    }

    try {
      await conversation.send({
        reaction: {
          reference: args.messageId,
          content: args.emoji,
          schema: "unicode",
          action: "added",
        },
      })
    } catch (error) {
      captureErrorWithToast(error)
    }
  }, [conversation])

  const removeReactionFromMessage = useCallback(async (args: IReactionParams) => {
    if (!conversation) {
      return
    }

    try {
      await conversation.send({
        reaction: {
          reference: args.messageId,
          content: args.emoji,
          schema: "unicode",
          action: "removed",
        },
      })
    } catch (error) {
      captureErrorWithToast(error)
    }
  }, [conversation])

  const sendMessage = useCallback(async (args: ISendMessageParams) => {
    if (!conversation) {
      return
    }

    const { referencedMessageId, content } = args

    if (referencedMessageId) {
      if (content.remoteAttachment) {
        await conversation.send({
          reply: {
            reference: referencedMessageId,
            content: { remoteAttachment: content.remoteAttachment },
          },
        })
      }
      
      if (content.text) {
        await conversation.send({
          reply: {
            reference: referencedMessageId,
            content: { text: content.text },
          },
        })
      }
      return
    }

    if (content.remoteAttachment) {
      await conversation.send({
        remoteAttachment: content.remoteAttachment,
      })
    }

    if (content.text) {
      await conversation.send({
        text: content.text,
      })
    }
  }, [conversation])

  const contextValue = {
    conversationId: conversation?.id || null,
    conversationNotFound: !conversation && !isLoadingConversation,
    isAllowedConversation: conversation?.state === "allowed",
    isBlockedConversation: conversation?.state === "denied",
    sendMessage,
    reactOnMessage,
    removeReactionFromMessage,
  }

  return (
    <ConversationContext.Provider value={contextValue}>
      {children}
    </ConversationContext.Provider>
  )
}
```

Key improvements made:
- Better type definitions with 'I' prefix
- Removed commented code
- Simplified props destructuring using args pattern
- Cleaner conditional checks
- More consistent error handling
- Simplified context value creation
- Better function organization
- Removed unnecessary nested conditions where possible
- Improved early returns
- Cleaner styling syntax

---



---

