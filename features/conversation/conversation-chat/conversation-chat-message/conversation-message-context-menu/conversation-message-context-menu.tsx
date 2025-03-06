import { memo, useCallback, useMemo } from "react"
import { Modal, Platform, StyleSheet } from "react-native"
import Animated from "react-native-reanimated"
import { useDropdownMenuCustomStyles } from "@/design-system/dropdown-menu/dropdown-menu-custom"
import { AnimatedVStack, VStack } from "@/design-system/VStack"
import { getSafeCurrentSender } from "@/features/authentication/multi-inbox.store"
import { ConversationMessage } from "@/features/conversation/conversation-chat/conversation-chat-message/conversation-message"
import { MessageContextMenuBackdrop } from "@/features/conversation/conversation-chat/conversation-chat-message/conversation-message-context-menu/conversation-message-context-menu-backdrop"
import { MessageContextMenuEmojiPicker } from "@/features/conversation/conversation-chat/conversation-chat-message/conversation-message-context-menu/conversation-message-context-menu-emoji-picker/conversation-message-context-menu-emoji-picker"
import { openMessageContextMenuEmojiPicker } from "@/features/conversation/conversation-chat/conversation-chat-message/conversation-message-context-menu/conversation-message-context-menu-emoji-picker/conversation-message-context-menu-emoji-picker-utils"
import { MessageContextMenuItems } from "@/features/conversation/conversation-chat/conversation-chat-message/conversation-message-context-menu/conversation-message-context-menu-items"
import { MessageContextMenuReactors } from "@/features/conversation/conversation-chat/conversation-chat-message/conversation-message-context-menu/conversation-message-context-menu-reactors"
import {
  IConversationMessageContextMenuStoreState,
  useConversationMessageContextMenuStore,
  useConversationMessageContextMenuStoreContext,
} from "@/features/conversation/conversation-chat/conversation-chat-message/conversation-message-context-menu/conversation-message-context-menu.store-context"
import { useConversationMessageContextMenuStyles } from "@/features/conversation/conversation-chat/conversation-chat-message/conversation-message-context-menu/conversation-message-context-menu.styles"
import { ConversationMessageContextStoreProvider } from "@/features/conversation/conversation-chat/conversation-chat-message/conversation-message.store-context"
import {
  getCurrentUserAlreadyReactedOnMessage,
  getMessageById,
  useConversationMessageReactions,
} from "@/features/conversation/conversation-chat/conversation-chat-message/conversation-message.utils"
import { getConversationMessagesQueryData } from "@/features/conversation/conversation-chat/conversation-messages.query"
import { useCurrentConversationTopicSafe } from "@/features/conversation/conversation-chat/conversation.store-context"
import { useReactOnMessage } from "@/features/conversation/hooks/use-react-on-message"
import { useRemoveReactionOnMessage } from "@/features/conversation/hooks/use-remove-reaction-on-message"
import { messageIsFromCurrentAccountInboxId } from "@/features/conversation/utils/message-is-from-current-user"
import { MessageContextMenuAboveMessageReactions } from "./conversation-message-context-menu-above-message-reactions"
import { MessageContextMenuContainer } from "./conversation-message-context-menu-container"
import { useMessageContextMenuItems } from "./conversation-message-context-menu.utils"

export const ConversationMessageContextMenu = memo(function ConversationMessageContextMenu() {
  const messageContextMenuData = useConversationMessageContextMenuStoreContext(
    (state) => state.messageContextMenuData,
  )

  if (!messageContextMenuData) {
    return null
  }

  return <Content messageContextMenuData={messageContextMenuData} />
})

const Content = memo(function Content(props: {
  messageContextMenuData: NonNullable<
    IConversationMessageContextMenuStoreState["messageContextMenuData"]
  >
}) {
  const { messageContextMenuData } = props

  const { messageId, itemRectX, itemRectY, itemRectHeight, itemRectWidth } = messageContextMenuData

  const topic = useCurrentConversationTopicSafe()
  const messageContextMenuStore = useConversationMessageContextMenuStore()

  const { bySender } = useConversationMessageReactions(messageId!)

  const { message, previousMessage, nextMessage } = useMemo(() => {
    const message = getMessageById({
      messageId,
      topic,
    })! // ! Because if we are inside this component it's because we selected a message and it exists for sure

    const messages = getConversationMessagesQueryData({
      account: getSafeCurrentSender().ethereumAddress,
      topic,
    })

    const messageIndex = messages?.ids.findIndex((m) => m === messageId)

    const nextMessageId = messageIndex ? messages?.ids[messageIndex + 1] : undefined
    const previousMessageId = messageIndex ? messages?.ids[messageIndex - 1] : undefined

    const nextMessage = nextMessageId
      ? (getMessageById({
          messageId: nextMessageId,
          topic,
        }) ?? undefined)
      : undefined

    const previousMessage = previousMessageId
      ? (getMessageById({
          messageId: previousMessageId,
          topic,
        }) ?? undefined)
      : undefined

    return {
      message,
      previousMessage,
      nextMessage,
    }
  }, [messageId, topic])

  const fromMe = messageIsFromCurrentAccountInboxId({ message })
  const menuItems = useMessageContextMenuItems({
    messageId: messageId,
    topic,
  })

  const { itemHeight } = useDropdownMenuCustomStyles()
  const menuHeight = itemHeight * menuItems.length

  const reactOnMessage = useReactOnMessage({
    topic,
  })
  const removeReactionOnMessage = useRemoveReactionOnMessage({
    topic,
  })

  const handlePressBackdrop = useCallback(() => {
    messageContextMenuStore.getState().setMessageContextMenuData(null)
  }, [messageContextMenuStore])

  const handleSelectReaction = useCallback(
    (emoji: string) => {
      const currentUserAlreadyReacted = getCurrentUserAlreadyReactedOnMessage({
        messageId,
        topic,
        emoji,
      })

      if (currentUserAlreadyReacted) {
        removeReactionOnMessage({
          messageId: messageId,
          emoji,
        })
      } else {
        reactOnMessage({ messageId: messageId, emoji })
      }
      messageContextMenuStore.getState().setMessageContextMenuData(null)
    },
    [reactOnMessage, messageId, removeReactionOnMessage, messageContextMenuStore, topic],
  )

  const handleChooseMoreEmojis = useCallback(() => {
    openMessageContextMenuEmojiPicker()
  }, [])

  const hasReactions = Boolean(bySender && Object.keys(bySender).length > 0)

  const { verticalSpaceBetweenSections } = useConversationMessageContextMenuStyles()

  return (
    <>
      <Modal
        visible={true}
        transparent={true}
        animationType="fade"
        statusBarTranslucent={Platform.OS === "android"}
      >
        <Animated.View style={StyleSheet.absoluteFill}>
          <MessageContextMenuBackdrop handlePressBackdrop={handlePressBackdrop}>
            <AnimatedVStack style={StyleSheet.absoluteFill}>
              {!!bySender && <MessageContextMenuReactors reactors={bySender} />}
              <MessageContextMenuContainer
                itemRectY={itemRectY}
                itemRectX={itemRectX}
                itemRectHeight={itemRectHeight}
                itemRectWidth={itemRectWidth}
                menuHeight={menuHeight}
                fromMe={fromMe}
                hasReactions={hasReactions}
              >
                <MessageContextMenuAboveMessageReactions
                  topic={topic}
                  reactors={bySender ?? {}}
                  messageId={messageId}
                  onChooseMoreEmojis={handleChooseMoreEmojis}
                  onSelectReaction={handleSelectReaction}
                  originX={fromMe ? itemRectX + itemRectWidth : itemRectX}
                  originY={itemRectHeight}
                />

                {/* Replace with rowGap when we refactored menu items and not using rn-paper TableView */}
                <VStack
                  style={{
                    height: verticalSpaceBetweenSections,
                  }}
                />

                <ConversationMessageContextStoreProvider
                  message={message}
                  nextMessage={nextMessage}
                  previousMessage={previousMessage}
                >
                  {/* TODO: maybe make ConversationMessage more dumb to not need any context? */}

                  <ConversationMessage message={message} />
                </ConversationMessageContextStoreProvider>

                <MessageContextMenuItems
                  originX={fromMe ? itemRectX + itemRectWidth : itemRectX}
                  originY={itemRectHeight}
                  menuItems={menuItems}
                />
              </MessageContextMenuContainer>
            </AnimatedVStack>
          </MessageContextMenuBackdrop>
        </Animated.View>
      </Modal>
      <MessageContextMenuEmojiPicker onSelectReaction={handleSelectReaction} />
    </>
  )
})
