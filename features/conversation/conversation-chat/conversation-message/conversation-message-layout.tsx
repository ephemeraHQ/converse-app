import { memo, ReactNode } from "react"
import { HStack } from "@/design-system/HStack"
import { AnimatedVStack, VStack } from "@/design-system/VStack"
import { ConversationMessageSender } from "@/features/conversation/conversation-chat/conversation-message/conversation-message-sender"
import { ConversationSenderAvatar } from "@/features/conversation/conversation-chat/conversation-message/conversation-message-sender-avatar"
import { useConversationMessageContextStoreContext } from "@/features/conversation/conversation-chat/conversation-message/conversation-message.store-context"
import { useConversationMessageStyles } from "@/features/conversation/conversation-chat/conversation-message/conversation-message.styles"
import { isGroupUpdatedMessage } from "@/features/conversation/conversation-chat/conversation-message/utils/conversation-message-assertions"
import { useSelect } from "@/stores/stores.utils"
import { useAppTheme } from "@/theme/use-app-theme"
import { debugBorder } from "@/utils/debug-style"

type IConversationMessageLayoutProps = {
  reactions?: ReactNode
  message?: ReactNode
  messageStatus?: ReactNode
}

export const ConversationMessageLayout = memo(function ConversationMessageLayout({
  message,
  reactions,
  messageStatus,
}: IConversationMessageLayoutProps) {
  const { theme } = useAppTheme()

  const {
    messageContainerSidePadding,
    spaceBetweenSenderAvatarAndMessage,
    senderAvatarSize,
    spaceBetweenMessageFromDifferentUserOrType,
    spaceBetweenMessagesInSeries,
    spaceBetweenMessageAndSender,
    senderNameLeftMargin,
    spaceBetweenSeriesWithReactions,
  } = useConversationMessageStyles()

  const {
    senderInboxId,
    fromMe,
    hasNextMessageInSeries,
    hasPreviousMessageInSeries,
    isSystemMessage,
    nextMessage,
    message: messageData,
  } = useConversationMessageContextStoreContext(
    useSelect([
      "senderInboxId",
      "fromMe",
      "hasNextMessageInSeries",
      "hasPreviousMessageInSeries",
      "isSystemMessage",
      "nextMessage",
      "message",
    ]),
  )

  const isGroupUpdate = isGroupUpdatedMessage(messageData)

  function getMessageSpacing() {
    if (nextMessage && !hasNextMessageInSeries) {
      return spaceBetweenMessageFromDifferentUserOrType
    }

    if (!hasNextMessageInSeries) {
      return 0
    }

    if (reactions) {
      return spaceBetweenSeriesWithReactions
    }

    if (nextMessage && !hasNextMessageInSeries) {
      return spaceBetweenMessageFromDifferentUserOrType
    }

    return spaceBetweenMessagesInSeries
  }

  return (
    <AnimatedVStack
      // {...debugBorder()}
      layout={theme.animation.reanimatedLayoutSpringTransition}
      style={{
        marginBottom: getMessageSpacing(),
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
          // {...debugBorder("red")}
          style={{
            width: "100%",
            alignItems: fromMe ? "flex-end" : "flex-start",
            ...(Boolean(reactions) && {
              marginBottom: spaceBetweenMessagesInSeries,
            }),
            // REALLY not sure why... but otherwise the message bubble were cut off?
            // Maybe because of layout animation on the FlatList? Let's check again when we move to Legend List
            paddingVertical: 0.5,
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

      {Boolean(reactions) && (
        <HStack
          style={
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
                }
          }
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
    </AnimatedVStack>
  )
})
