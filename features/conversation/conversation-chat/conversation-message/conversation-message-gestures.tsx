import React, { memo, useCallback } from "react"
import { useConversationMessageContextMenuStore } from "@/features/conversation/conversation-chat/conversation-message/conversation-message-context-menu/conversation-message-context-menu.store-context"
import {
  ConversationMessageGesturesDumb,
  IMessageGesturesOnLongPressArgs,
} from "@/features/conversation/conversation-chat/conversation-message/conversation-message-gestures.dumb"
import { useConversationMessageContextStore } from "@/features/conversation/conversation-chat/conversation-message/conversation-message.store-context"
import {
  getCurrentUserAlreadyReactedOnMessage,
  getMessageById,
  isMultiRemoteAttachmentMessage,
} from "@/features/conversation/conversation-chat/conversation-message/conversation-message.utils"
import { useReactOnMessage } from "@/features/conversation/conversation-chat/use-react-on-message.mutation"
import { useRemoveReactionOnMessage } from "@/features/conversation/conversation-chat/use-remove-reaction-on-message.mutation"
import { useCurrentConversationTopic } from "../conversation.store-context"

export const ConversationMessageGestures = memo(function ConversationMessageGestures(props: {
  children: React.ReactNode
  contextMenuExtra?: Record<string, any> // Not best but okay for now
}) {
  const { contextMenuExtra, children } = props
  const messageContextMenuStore = useConversationMessageContextMenuStore()
  const messageStore = useConversationMessageContextStore()
  const topic = useCurrentConversationTopic()!

  const { reactOnMessage } = useReactOnMessage({
    topic,
  })
  const { removeReactionOnMessage } = useRemoveReactionOnMessage({
    topic,
  })

  const handleLongPress = useCallback(
    (e: IMessageGesturesOnLongPressArgs) => {
      const messageId = messageStore.getState().messageId
      const message = getMessageById({ messageId, topic })!
      messageContextMenuStore.getState().setMessageContextMenuData({
        messageId,
        itemRectX: e.pageX,
        itemRectY: e.pageY,
        itemRectHeight: e.height,
        itemRectWidth: e.width,
        ...(isMultiRemoteAttachmentMessage(message) && {
          extra: {
            attachmentUrl: contextMenuExtra?.attachmentUrl,
          },
        }),
      })
    },
    [messageContextMenuStore, messageStore, contextMenuExtra, topic],
  )

  const handleTap = useCallback(() => {
    const isShowingTime = !messageStore.getState().isShowingTime
    messageStore.setState({
      isShowingTime,
    })
  }, [messageStore])

  const handleDoubleTap = useCallback(() => {
    const messageId = messageStore.getState().messageId
    const alreadyReacted = getCurrentUserAlreadyReactedOnMessage({
      messageId,
      topic,
      emoji: "❤️",
    })
    if (alreadyReacted) {
      removeReactionOnMessage({
        messageId,
        emoji: "❤️",
      })
    } else {
      reactOnMessage({
        messageId,
        emoji: "❤️",
      })
    }
  }, [reactOnMessage, removeReactionOnMessage, messageStore, topic])

  return (
    <ConversationMessageGesturesDumb
      onLongPress={handleLongPress}
      onTap={handleTap}
      onDoubleTap={handleDoubleTap}
    >
      {children}
    </ConversationMessageGesturesDumb>
  )
})
