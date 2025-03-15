import { Text } from "@design-system/Text"
import { textSizeStyles } from "@design-system/Text/Text.styles"
import { VStack } from "@design-system/VStack"
import emojiRegex from "emoji-regex"
import { memo } from "react"
import {
  BubbleContainer,
  BubbleContentContainer,
} from "@/features/conversation/conversation-chat/conversation-message/conversation-message-bubble"
import { ConversationMessageGestures } from "@/features/conversation/conversation-chat/conversation-message/conversation-message-gestures"
import { MessageText } from "@/features/conversation/conversation-chat/conversation-message/conversation-message-text"
import { useConversationMessageContextStoreContext } from "@/features/conversation/conversation-chat/conversation-message/conversation-message.store-context"
import { useSelect } from "@/stores/stores.utils"
import { IConversationMessageText } from "./conversation-message.types"

export const MessageSimpleText = memo(function MessageSimpleText(props: {
  message: IConversationMessageText
}) {
  const { message } = props

  const { hasNextMessageInSeries, fromMe } = useConversationMessageContextStoreContext(
    useSelect(["hasNextMessageInSeries", "fromMe"]),
  )

  if (shouldRenderBigEmoji(message.content.text)) {
    return (
      <VStack
        style={{
          alignItems: fromMe ? "flex-end" : "flex-start",
        }}
      >
        <Text style={textSizeStyles["5xl"]}>{message.content.text}</Text>
      </VStack>
    )
  }

  return (
    <BubbleContainer fromMe={fromMe}>
      <ConversationMessageGestures>
        <BubbleContentContainer fromMe={fromMe} hasNextMessageInSeries={hasNextMessageInSeries}>
          <MessageText inverted={fromMe}>{message.content.text}</MessageText>
        </BubbleContentContainer>
      </ConversationMessageGestures>
    </BubbleContainer>
  )
})

// Compile emoji regex once
const compiledEmojiRegex = emojiRegex()

const shouldRenderBigEmoji = (text: string) => {
  const trimmedContent = text.trim()
  const emojis = trimmedContent.match(compiledEmojiRegex) || []

  const hasEmojis = emojis.length > 0
  const hasFewerThanFourEmojis = emojis.length < 4
  const containsOnlyEmojis = emojis.join("") === trimmedContent

  return hasEmojis && hasFewerThanFourEmojis && containsOnlyEmojis
}
