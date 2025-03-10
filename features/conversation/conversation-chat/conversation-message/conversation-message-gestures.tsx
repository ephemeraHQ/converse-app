import React, { memo, useCallback } from "react"
import { useConversationMessageContextMenuStore } from "@/features/conversation/conversation-chat/conversation-message/conversation-message-context-menu/conversation-message-context-menu.store-context"
import {
  ConversationMessageGesturesDumb,
  IMessageGesturesOnLongPressArgs,
} from "@/features/conversation/conversation-chat/conversation-message/conversation-message-gestures.dumb"
import { useConversationMessageContextStore } from "@/features/conversation/conversation-chat/conversation-message/conversation-message.store-context"
import { getCurrentUserAlreadyReactedOnMessage } from "@/features/conversation/conversation-chat/conversation-message/conversation-message.utils"
import { useReactOnMessage } from "@/features/conversation/hooks/use-react-on-message"
import { useRemoveReactionOnMessage } from "@/features/conversation/hooks/use-remove-reaction-on-message"
import { useCurrentConversationTopic } from "../conversation.store-context"

export const ConversationMessageGestures = memo(function ConversationMessageGestures(props: {
  children: React.ReactNode
}) {
  const messageContextMenuStore = useConversationMessageContextMenuStore()
  const messageStore = useConversationMessageContextStore()
  const topic = useCurrentConversationTopic()!

  const reactOnMessage = useReactOnMessage({
    topic,
  })
  const { removeReactionFromMessage } = useRemoveReactionOnMessage({
    topic,
  })

  const handleLongPress = useCallback(
    (e: IMessageGesturesOnLongPressArgs) => {
      const messageId = messageStore.getState().messageId
      messageContextMenuStore.getState().setMessageContextMenuData({
        messageId,
        itemRectX: e.pageX,
        itemRectY: e.pageY,
        itemRectHeight: e.height,
        itemRectWidth: e.width,
      })
    },
    [messageContextMenuStore, messageStore],
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
      removeReactionFromMessage({
        messageId,
        emoji: "❤️",
      })
    } else {
      reactOnMessage({
        messageId,
        emoji: "❤️",
      })
    }
  }, [reactOnMessage, removeReactionFromMessage, messageStore, topic])

  return (
    <ConversationMessageGesturesDumb
      onLongPress={handleLongPress}
      onTap={handleTap}
      onDoubleTap={handleDoubleTap}
    >
      {props.children}
    </ConversationMessageGesturesDumb>
  )
})
