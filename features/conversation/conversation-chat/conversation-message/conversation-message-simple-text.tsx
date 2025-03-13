import { Text } from "@design-system/Text"
import { textSizeStyles } from "@design-system/Text/Text.styles"
import { VStack } from "@design-system/VStack"
import { memo } from "react"
import {
  BubbleContainer,
  BubbleContentContainer,
} from "@/features/conversation/conversation-chat/conversation-message/conversation-message-bubble"
import { ConversationMessageGestures } from "@/features/conversation/conversation-chat/conversation-message/conversation-message-gestures"
import { MessageText } from "@/features/conversation/conversation-chat/conversation-message/conversation-message-text"
import { useConversationMessageContextStoreContext } from "@/features/conversation/conversation-chat/conversation-message/conversation-message.store-context"
import { shouldRenderBigEmoji } from "@/features/conversation/conversation-chat/conversation-message/conversation-message.utils"
import { useSelect } from "@/stores/stores.utils"
import { IConversationMessageText } from "./conversation-message.types"

export const MessageSimpleText = memo(function MessageSimpleText(props: {
  message: IConversationMessageText
}) {
  const { message } = props

  const textContent = message.content()

  const { hasNextMessageInSeries, fromMe } = useConversationMessageContextStoreContext(
    useSelect(["hasNextMessageInSeries", "fromMe"]),
  )

  if (shouldRenderBigEmoji(textContent)) {
    return (
      <VStack
        style={{
          alignItems: fromMe ? "flex-end" : "flex-start",
        }}
      >
        <Text style={textSizeStyles["5xl"]}>{textContent}</Text>
      </VStack>
    )
  }

  return (
    <BubbleContainer fromMe={fromMe}>
      <ConversationMessageGestures>
        <BubbleContentContainer fromMe={fromMe} hasNextMessageInSeries={hasNextMessageInSeries}>
          <MessageText inverted={fromMe}>{textContent}</MessageText>
        </BubbleContentContainer>
      </ConversationMessageGestures>
    </BubbleContainer>
  )
})
