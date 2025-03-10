import { HStack } from "@design-system/HStack"
import { Icon } from "@design-system/Icon/Icon"
import { IconButton } from "@design-system/IconButton/IconButton"
import { Text } from "@design-system/Text"
import { AnimatedVStack, VStack } from "@design-system/VStack"
import { SICK_DAMPING, SICK_STIFFNESS } from "@theme/animations"
import { Haptics } from "@utils/haptics"
import {
  ConversationTopic,
  DecodedMessage,
  MessageId,
  RemoteAttachmentCodec,
  ReplyCodec,
  StaticAttachmentCodec,
} from "@xmtp/react-native-sdk"
import { memo, useCallback, useEffect } from "react"
import { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated"
import { AttachmentRemoteImage } from "@/features/conversation/conversation-attachment/conversation-attachment-remote-image"
import {
  isGroupUpdatedMessage,
  isReactionMessage,
  isReadReceiptMessage,
  isRemoteAttachmentMessage,
  isReplyMessage,
  isStaticAttachmentMessage,
} from "@/features/conversation/conversation-chat/conversation-message/conversation-message.utils"
import { useMessagePlainText } from "@/features/conversation/conversation-list/hooks/use-message-plain-text"
import { messageIsFromCurrentAccountInboxId } from "@/features/conversation/utils/message-is-from-current-user"
import { usePreferredDisplayInfo } from "@/features/preferred-display-info/use-preferred-display-info"
import { IXmtpDecodedMessage } from "@/features/xmtp/xmtp.types"
import { useAppTheme } from "@/theme/use-app-theme"
import { useConversationMessageById } from "../conversation-message/use-conversation-message"
import { useCurrentConversationTopic } from "../conversation.store-context"
import {
  useConversationComposerStore,
  useConversationComposerStoreContext,
} from "./conversation-composer.store-context"

export const ReplyPreview = memo(function ReplyPreview() {
  const topic = useCurrentConversationTopic()

  if (!topic) return null

  return <Content conversationTopic={topic} />
})

const Content = memo(function Content(props: { conversationTopic: ConversationTopic }) {
  const { conversationTopic } = props

  const replyingToMessageId = useConversationComposerStoreContext(
    (state) => state.replyingToMessageId,
  )

  const { theme } = useAppTheme()

  const composerStore = useConversationComposerStore()

  const { message: replyMessage } = useConversationMessageById({
    messageId: replyingToMessageId!, // ! because we have enabled in the query
    conversationTopic,
  })

  const { displayName } = usePreferredDisplayInfo({
    inboxId: replyMessage?.senderInboxId,
  })

  const replyingTo = replyMessage
    ? messageIsFromCurrentAccountInboxId({ message: replyMessage })
      ? `Replying to you`
      : displayName
        ? `Replying to ${displayName}`
        : "Replying"
    : ""

  const contentHeightAV = useSharedValue(0)

  const containerAS = useAnimatedStyle(() => {
    return {
      height: withSpring(
        replyingToMessageId && contentHeightAV.value !== 0 ? contentHeightAV.value : 0,
        { damping: SICK_DAMPING, stiffness: SICK_STIFFNESS },
      ),
    }
  }, [replyingToMessageId])

  useEffect(() => {
    if (replyingToMessageId) {
      Haptics.softImpactAsync()
    }
  }, [replyingToMessageId])

  const handleDismiss = useCallback(() => {
    composerStore.getState().setReplyToMessageId(null)
  }, [composerStore])

  return (
    <AnimatedVStack
      style={[
        {
          // ...debugBorder("red"),
          overflow: "hidden",
        },
        containerAS,
      ]}
    >
      {!!replyMessage && (
        <AnimatedVStack
          entering={theme.animation.reanimatedFadeInSpring}
          exiting={theme.animation.reanimatedFadeOutSpring}
          onLayout={(event) => {
            contentHeightAV.value = event.nativeEvent.layout.height
          }}
          style={{
            borderTopWidth: theme.borderWidth.xs,
            borderTopColor: theme.colors.border.subtle,
            paddingLeft: theme.spacing.sm,
            paddingRight: theme.spacing.sm,
            paddingTop: theme.spacing.sm,
            paddingBottom: theme.spacing.xxxs,
            backgroundColor: theme.colors.background.surfaceless,
            minHeight: replyMessage
              ? 56 // Value from Figma. Not the best but we need minHeight for this to work. If the content end up being bigger it will adjust automatically
              : 0,
          }}
        >
          <HStack
            style={{
              // ...debugBorder("blue"),
              alignItems: "center",
              columnGap: theme.spacing.xs,
            }}
          >
            <VStack
              style={{
                rowGap: theme.spacing.xxxs,
                flex: 1,
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
                  color={theme.colors.text.secondary}
                />
                <Text preset="smaller" color="secondary">
                  {replyingTo}
                </Text>
              </HStack>
              {!!replyMessage && <ReplyPreviewMessageContent replyMessage={replyMessage} />}
            </VStack>
            <ReplyPreviewEndContent replyMessage={replyMessage} />
            <IconButton iconName="xmark" onPress={handleDismiss} hitSlop={8} size="sm" />
          </HStack>
        </AnimatedVStack>
      )}
    </AnimatedVStack>
  )
})

const ReplyPreviewEndContent = memo(function ReplyPreviewEndContent(props: {
  replyMessage: IXmtpDecodedMessage
}) {
  const { replyMessage } = props

  const { theme } = useAppTheme()

  if (isReplyMessage(replyMessage)) {
    const replyTyped = replyMessage as DecodedMessage<ReplyCodec>

    const content = replyTyped.content()

    if (typeof content === "string") {
      return null
    }

    if (content.content.remoteAttachment) {
      return (
        <AttachmentRemoteImage
          messageId={content.reference as MessageId}
          remoteMessageContent={content.content.remoteAttachment}
          containerProps={{
            style: {
              height: theme.avatarSize.md,
              width: theme.avatarSize.md,
              borderRadius: theme.borderRadius.xxs,
            },
          }}
        />
      )
    }
  }

  if (isRemoteAttachmentMessage(replyMessage)) {
    const messageTyped = replyMessage as DecodedMessage<RemoteAttachmentCodec>

    const content = messageTyped.content()

    if (typeof content === "string") {
      return null
    }

    return (
      <AttachmentRemoteImage
        messageId={messageTyped.id}
        remoteMessageContent={content}
        containerProps={{
          style: {
            height: theme.avatarSize.md,
            width: theme.avatarSize.md,
            borderRadius: theme.borderRadius.xxs,
          },
        }}
      />
    )
  }

  return null
})

const ReplyPreviewMessageContent = memo(function ReplyPreviewMessageContent(props: {
  replyMessage: IXmtpDecodedMessage
}) {
  const { replyMessage } = props

  const { theme } = useAppTheme()

  const messageText = useMessagePlainText(replyMessage)
  const clearedMessage = messageText?.replace(/(\n)/gm, " ")

  if (isStaticAttachmentMessage(replyMessage)) {
    const messageTyped = replyMessage as DecodedMessage<StaticAttachmentCodec>

    const content = messageTyped.content()

    if (typeof content === "string") {
      return <Text>{content}</Text>
    }

    // TODO
    return <Text>Static attachment</Text>
  }

  if (isReactionMessage(replyMessage)) {
    return <Text>Reaction</Text>
  }

  if (isReadReceiptMessage(replyMessage)) {
    return <Text>Read Receipt</Text>
  }

  if (isGroupUpdatedMessage(replyMessage)) {
    return <Text>Group updates</Text>
  }

  if (isRemoteAttachmentMessage(replyMessage)) {
    return <Text>Remote Attachment</Text>
  }

  if (isReplyMessage(replyMessage)) {
    const messageTyped = replyMessage as DecodedMessage<ReplyCodec>
    const content = messageTyped.content()

    if (typeof content === "string") {
      return <Text>{content}</Text>
    }

    if (content.content.attachment) {
      return <Text>Reply with attachment</Text>
    }

    if (content.content.text) {
      return <Text>{content.content.text}</Text>
    }

    if (content.content.remoteAttachment) {
      return <Text>Image</Text>
    }

    return <Text>Reply</Text>
  }

  return <Text numberOfLines={1}>{clearedMessage}</Text>
})
