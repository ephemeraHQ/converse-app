import type { ConversationTopic, DecodedMessage } from "@xmtp/react-native-sdk"
import React, { memo } from "react"
import { FlatList } from "react-native"
import { ActivityIndicator } from "@/design-system/activity-indicator"
import { Center } from "@/design-system/Center"
import { EmptyState } from "@/design-system/empty-state"
import { Text } from "@/design-system/Text"
import { VStack } from "@/design-system/VStack"
import { useCurrentSenderEthAddress } from "@/features/authentication/multi-inbox.store"
import { ConversationMessage } from "@/features/conversation/conversation-chat/conversation-message/conversation-message"
import { ConversationMessageContextMenuStoreProvider } from "@/features/conversation/conversation-chat/conversation-message/conversation-message-context-menu/conversation-message-context-menu.store-context"
import { ConversationMessageLayout } from "@/features/conversation/conversation-chat/conversation-message/conversation-message-layout"
import { ConversationMessageReactions } from "@/features/conversation/conversation-chat/conversation-message/conversation-message-reactions/conversation-message-reactions"
import { ConversationMessageTimestamp } from "@/features/conversation/conversation-chat/conversation-message/conversation-message-timestamp"
import { ConversationMessageContextStoreProvider } from "@/features/conversation/conversation-chat/conversation-message/conversation-message.store-context"
import { useMessageHasReactions } from "@/features/conversation/conversation-chat/conversation-message/conversation-message.utils"
import { conversationListDefaultProps } from "@/features/conversation/conversation-chat/conversation-messages-list.component"
import { useConversationMessagesQuery } from "@/features/conversation/conversation-chat/conversation-messages.query"
import { ConversationStoreProvider } from "@/features/conversation/conversation-chat/conversation.store-context"
import { useConversationQuery } from "@/features/conversation/queries/conversation.query"
import { $globalStyles } from "@/theme/styles"

type ConversationPreviewProps = {
  topic: ConversationTopic
}

export const ConversationPreview = ({ topic }: ConversationPreviewProps) => {
  const currentAccount = useCurrentSenderEthAddress()!

  const { data: messages, isLoading: isLoadingMessages } = useConversationMessagesQuery({
    account: currentAccount,
    topic,
    caller: "Conversation Preview",
  })

  const { data: conversation, isLoading: isLoadingConversation } = useConversationQuery({
    account: currentAccount,
    topic,
    caller: "Conversation Preview",
  })

  const isLoading = isLoadingMessages || isLoadingConversation

  return (
    <VStack style={$globalStyles.flex1}>
      {isLoading ? (
        <Center style={$globalStyles.flex1}>
          <ActivityIndicator />
        </Center>
      ) : !conversation ? (
        <Center style={$globalStyles.flex1}>
          <Text>Conversation not found</Text>
        </Center>
      ) : messages?.ids.length === 0 ? (
        <Center style={$globalStyles.flex1}>
          <EmptyState title="Empty conversation" description="This conversation has no messages" />
        </Center>
      ) : (
        // Shouldn't need this provider here but for now we need it because we use ConversationMessageGestures inside ConversationMessage
        <ConversationMessageContextMenuStoreProvider>
          <ConversationStoreProvider topic={topic}>
            {/* Using basic Flatlist instead of the Animated one to try to fix the context menu crashes https://github.com/dominicstop/react-native-ios-context-menu/issues/70 */}
            <FlatList
              {...conversationListDefaultProps}
              // 15 is enough
              data={Object.values(messages?.byId ?? {}).slice(0, 15)}
              renderItem={({ item, index }) => {
                const message = item
                const previousMessage = messages?.byId[messages?.ids[index + 1]]
                const nextMessage = messages?.byId[messages?.ids[index - 1]]

                return (
                  <MessageWrapper
                    message={message}
                    previousMessage={previousMessage}
                    nextMessage={nextMessage}
                  />
                )
              }}
            />
          </ConversationStoreProvider>
        </ConversationMessageContextMenuStoreProvider>
      )}
    </VStack>
  )
}

const MessageWrapper = memo(function MessageWrapper({
  message,
  previousMessage,
  nextMessage,
}: {
  message: DecodedMessage
  previousMessage: DecodedMessage | undefined
  nextMessage: DecodedMessage | undefined
}) {
  const hasReactions = useMessageHasReactions({
    messageId: message.id,
  })

  return (
    <ConversationMessageContextStoreProvider
      message={message}
      previousMessage={previousMessage}
      nextMessage={nextMessage}
    >
      <VStack>
        <ConversationMessageTimestamp />
        <ConversationMessageLayout
          message={<ConversationMessage message={message} />}
          reactions={hasReactions && <ConversationMessageReactions />}
        />
      </VStack>
    </ConversationMessageContextStoreProvider>
  )
})
