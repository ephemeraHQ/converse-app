import { HStack } from "@design-system/HStack"
import { Icon } from "@design-system/Icon/Icon"
import { Text } from "@design-system/Text"
import { VStack } from "@design-system/VStack"
import { memo } from "react"
import { Gesture, GestureDetector } from "react-native-gesture-handler"
import { AttachmentRemoteImage } from "@/features/conversation/conversation-chat/conversation-attachment/conversation-attachment-remote-image"
import {
  BubbleContainer,
  BubbleContentContainer,
} from "@/features/conversation/conversation-chat/conversation-message/conversation-message-bubble"
import { ConversationMessageGestures } from "@/features/conversation/conversation-chat/conversation-message/conversation-message-gestures"
import { MessageText } from "@/features/conversation/conversation-chat/conversation-message/conversation-message-text"
import { useConversationMessageContextStoreContext } from "@/features/conversation/conversation-chat/conversation-message/conversation-message.store-context"
import {
  isReadReceiptMessage,
  isRemoteAttachmentMessage,
  isReplyMessage,
  isTextMessage,
  messageContentIsGroupUpdated,
  messageContentIsRemoteAttachment,
  messageContentIsStaticAttachment,
  messageContentIsText,
} from "@/features/conversation/conversation-chat/conversation-message/conversation-message.utils"
import {
  useConversationStore,
  useCurrentConversationTopicSafe,
} from "@/features/conversation/conversation-chat/conversation.store-context"
import { usePreferredDisplayInfo } from "@/features/preferred-display-info/use-preferred-display-info"
import { useSelect } from "@/stores/stores.utils"
import { useAppTheme } from "@/theme/use-app-theme"
import { captureError } from "@/utils/capture-error"
import {
  IConversationMessage,
  IConversationMessageId,
  IConversationMessageReply,
} from "./conversation-message.types"
import { useConversationMessageById } from "./use-conversation-message-by-id"

export const MessageReply = memo(function MessageReply(props: {
  message: IConversationMessageReply
}) {
  const { message } = props

  const { theme } = useAppTheme()

  const { fromMe, hasNextMessageInSeries } = useConversationMessageContextStoreContext(
    useSelect(["fromMe", "hasNextMessageInSeries"]),
  )

  const replyMessageContent = message.content

  if (!replyMessageContent) {
    // TODO
    return null
  }

  if (typeof replyMessageContent === "string") {
    // TODO. Render simple bubble message with the content?
    console.error("reply message is a string")
    return null
  }

  return (
    <BubbleContainer fromMe={fromMe}>
      <ConversationMessageGestures>
        <BubbleContentContainer fromMe={fromMe} hasNextMessageInSeries={hasNextMessageInSeries}>
          <VStack
            style={{
              rowGap: theme.spacing.xxs,
              marginTop: theme.spacing.xxxs, // Because for reply bubble we want the padding to be same for horizontal and vertial
            }}
          >
            <MessageReplyReference referenceMessageId={replyMessageContent.reference} />

            {messageContentIsRemoteAttachment(replyMessageContent.content) && (
              <VStack
                style={{
                  marginTop: theme.spacing.xxxs,
                  marginBottom: theme.spacing.xxxs,
                }}
              >
                <AttachmentRemoteImage
                  fitAspectRatio
                  messageId={replyMessageContent.reference}
                  remoteMessageContent={replyMessageContent.content}
                  containerProps={{
                    style: {
                      width: "100%",
                      borderRadius:
                        theme.borderRadius.message.attachment -
                        theme.spacing.message.replyMessage.horizontalPadding / 2,
                    },
                  }}
                />
              </VStack>
            )}

            {messageContentIsText(replyMessageContent.content) && (
              <MessageText inverted={fromMe}>{replyMessageContent.content.text}</MessageText>
            )}
          </VStack>
        </BubbleContentContainer>
      </ConversationMessageGestures>
    </BubbleContainer>
  )
})

const MessageReplyReference = memo(function MessageReplyReference(props: {
  referenceMessageId: IConversationMessageId
}) {
  const { referenceMessageId } = props

  const { theme } = useAppTheme()

  const { fromMe } = useConversationMessageContextStoreContext(useSelect(["fromMe"]))

  const conversationStore = useConversationStore()

  const topic = useCurrentConversationTopicSafe()

  const { message: referencedMessage } = useConversationMessageById({
    messageId: referenceMessageId,
    conversationTopic: topic,
  })

  const { displayName } = usePreferredDisplayInfo({
    inboxId: referencedMessage?.senderInboxId,
  })

  const tapGesture = Gesture.Tap()
    .onBegin(() => {
      conversationStore.setState({
        highlightedMessageId: referenceMessageId,
        scrollToMessageId: referenceMessageId,
      })
    })
    .runOnJS(true)

  return (
    <GestureDetector gesture={tapGesture}>
      <VStack
        style={{
          rowGap: theme.spacing.xxxs,
          flex: 1,
          backgroundColor: fromMe
            ? theme.colors.bubbles.nestedReplyFromMe
            : theme.colors.bubbles.nestedReply,
          borderRadius:
            theme.borderRadius.message.bubble -
            theme.spacing.message.replyMessage.horizontalPadding / 2, // / 2 so the border fits the border radius of BubbleContentContainer
          paddingHorizontal: theme.spacing.xs,
          paddingVertical: theme.spacing.xxs,
        }}
      >
        <HStack
          style={{
            alignItems: "center",
            columnGap: theme.spacing.xxxs,
          }}
        >
          <Icon
            size={theme.iconSize.xxs}
            icon="arrowshape.turn.up.left.fill"
            color={fromMe ? theme.colors.text.inverted.secondary : theme.colors.text.secondary}
          />
          <Text preset="smaller" color="secondary" inverted={fromMe}>
            {displayName}
          </Text>
        </HStack>
        {!!referencedMessage && <MessageReplyReferenceContent replyMessage={referencedMessage} />}
      </VStack>
    </GestureDetector>
  )
})

const MessageReplyReferenceContent = memo(function ReplyMessageReferenceMessageContent(props: {
  replyMessage: IConversationMessage
}) {
  const { replyMessage } = props
  const { theme } = useAppTheme()
  const fromMe = useConversationMessageContextStoreContext((s) => s.fromMe)

  const attachmentStyle = {
    height: theme.avatarSize.md,
    width: theme.avatarSize.md,
    marginBottom: theme.spacing.xxxs,
    borderRadius:
      theme.borderRadius.message.attachment - theme.spacing.message.replyMessage.horizontalPadding,
  }

  function renderMessageContent(message: IConversationMessage) {
    if (isReadReceiptMessage(message)) {
      return null
    }

    if (isRemoteAttachmentMessage(message)) {
      const content = message.content
      return (
        <AttachmentRemoteImage
          messageId={message.id}
          remoteMessageContent={content}
          containerProps={{ style: attachmentStyle }}
        />
      )
    }

    if (isTextMessage(message)) {
      return (
        <Text numberOfLines={1} inverted={fromMe}>
          {message.content.text}
        </Text>
      )
    }

    if (isReplyMessage(message)) {
      const content = message.content

      // Handle remote attachment in the reply
      if (messageContentIsRemoteAttachment(content)) {
        return (
          <AttachmentRemoteImage
            messageId={message.id}
            remoteMessageContent={content}
            containerProps={{ style: attachmentStyle }}
          />
        )
      }

      // Handle text in the reply
      if (messageContentIsText(content)) {
        return (
          <Text numberOfLines={1} inverted={fromMe}>
            {content.text}
          </Text>
        )
      }

      // Handle static attachment in the reply
      if (messageContentIsStaticAttachment(content)) {
        return (
          <Text numberOfLines={1} inverted={fromMe}>
            {content.filename}
          </Text>
        )
      }

      // Handle group updates in the reply
      if (messageContentIsGroupUpdated(content)) {
        return (
          <Text numberOfLines={1} inverted={fromMe}>
            Group updated
          </Text>
        )
      }
    }

    captureError(
      new Error(
        `Reply message reference message content is not handled with message type ${message.type}`,
      ),
    )
    return null
  }

  return renderMessageContent(replyMessage)
})
