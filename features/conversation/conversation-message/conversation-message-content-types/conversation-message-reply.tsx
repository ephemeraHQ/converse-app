import { useSelect } from "@/data/store/storeHelpers";
import { AttachmentRemoteImage } from "@/features/conversation/conversation-attachment/conversation-attachment-remote-image";
import {
  BubbleContainer,
  BubbleContentContainer,
} from "@/features/conversation/conversation-message/conversation-message-bubble";
import { MessageText } from "@/features/conversation/conversation-message/conversation-message-text";
import { useMessageContextStoreContext } from "@/features/conversation/conversation-message/conversation-message.store-context";
import {
  isCoinbasePaymentMessage,
  isRemoteAttachmentMessage,
  isReplyMessage,
  isTextMessage,
  isTransactionReferenceMessage,
  useConversationMessageById,
} from "@/features/conversation/conversation-message/conversation-message.utils";
import {
  useConversationStore,
  useCurrentConversationTopic,
} from "@/features/conversation/conversation.store-context";
import { usePreferredInboxName } from "@/hooks/usePreferredInboxName";
import { captureError } from "@/utils/capture-error";
import { DecodedMessageWithCodecsType } from "@/utils/xmtpRN/client.types";
import { HStack } from "@design-system/HStack";
import { Icon } from "@design-system/Icon/Icon";
import { Text } from "@design-system/Text";
import { VStack } from "@design-system/VStack";
import { useAppTheme } from "@theme/useAppTheme";
import { DecodedMessage, MessageId, ReplyCodec } from "@xmtp/react-native-sdk";
import { memo } from "react";
import { Gesture, GestureDetector } from "react-native-gesture-handler";

export const MessageReply = memo(function MessageReply(props: {
  message: DecodedMessage<ReplyCodec>;
}) {
  const { message } = props;

  const { theme } = useAppTheme();

  const { fromMe, hasNextMessageInSeries } = useMessageContextStoreContext(
    useSelect(["fromMe", "hasNextMessageInSeries"])
  );

  const replyMessageContent = message.content();

  if (!replyMessageContent) {
    // TODO
    return null;
  }

  if (typeof replyMessageContent === "string") {
    // TODO. Render simple bubble message with the content?
    console.error("reply message is a string");
    return null;
  }

  const textContent = replyMessageContent.content.text;

  return (
    <BubbleContainer fromMe={fromMe}>
      <BubbleContentContainer
        fromMe={fromMe}
        hasNextMessageInSeries={hasNextMessageInSeries}
      >
        <VStack
          style={{
            rowGap: theme.spacing.xxs,
            marginTop: theme.spacing.xxxs, // Because for reply bubble we want the padding to be same for horizontal and vertial
          }}
        >
          <MessageReplyReference
            referenceMessageId={replyMessageContent.reference as MessageId}
          />

          {!!replyMessageContent.content.remoteAttachment && (
            <VStack
              style={{
                marginTop: theme.spacing.xxxs,
                marginBottom: theme.spacing.xxxs,
              }}
            >
              <AttachmentRemoteImage
                fitAspectRatio
                messageId={replyMessageContent.reference}
                remoteMessageContent={
                  replyMessageContent.content.remoteAttachment
                }
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

          {!!textContent && (
            <MessageText inverted={fromMe}>{textContent}</MessageText>
          )}
        </VStack>
      </BubbleContentContainer>
    </BubbleContainer>
  );
});

const MessageReplyReference = memo(function MessageReplyReference(props: {
  referenceMessageId: MessageId;
}) {
  const { referenceMessageId } = props;

  const { theme } = useAppTheme();

  const { fromMe } = useMessageContextStoreContext(useSelect(["fromMe"]));

  const conversationStore = useConversationStore();

  const topic = useCurrentConversationTopic();

  const { message: referencedMessage } = useConversationMessageById({
    messageId: referenceMessageId,
    topic,
  });

  const inboxName = usePreferredInboxName(referencedMessage?.senderInboxId);

  const tapGesture = Gesture.Tap()
    .onBegin(() => {
      conversationStore.setState({
        highlightedMessageId: referenceMessageId,
        scrollToMessageId: referenceMessageId,
      });
    })
    .runOnJS(true);

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
            size={theme.iconSize.xs}
            icon="arrowshape.turn.up.left.fill"
            color={
              fromMe
                ? theme.colors.text.inverted.secondary
                : theme.colors.text.secondary
            }
          />
          <Text preset="smaller" color="secondary" inverted={fromMe}>
            {inboxName}
          </Text>
        </HStack>
        {!!referencedMessage && (
          <MessageReplyReferenceContent replyMessage={referencedMessage} />
        )}
      </VStack>
    </GestureDetector>
  );
});

const MessageReplyReferenceContent = memo(
  function ReplyMessageReferenceMessageContent(props: {
    replyMessage: DecodedMessageWithCodecsType;
  }) {
    const { replyMessage } = props;
    const { theme } = useAppTheme();
    const fromMe = useMessageContextStoreContext((s) => s.fromMe);

    const attachmentStyle = {
      height: theme.avatarSize.md,
      width: theme.avatarSize.md,
      marginBottom: theme.spacing.xxxs,
      borderRadius:
        theme.borderRadius.message.attachment -
        theme.spacing.message.replyMessage.horizontalPadding,
    };

    function renderMessageContent(message: DecodedMessageWithCodecsType) {
      if (isRemoteAttachmentMessage(message)) {
        const content = message.content();
        return (
          <AttachmentRemoteImage
            messageId={message.id}
            remoteMessageContent={content}
            containerProps={{ style: attachmentStyle }}
          />
        );
      }

      if (isTextMessage(message)) {
        return (
          <Text numberOfLines={1} inverted={fromMe}>
            {message.content()}
          </Text>
        );
      }

      if (isTransactionReferenceMessage(message)) {
        return (
          <Text numberOfLines={1} inverted={fromMe}>
            Transaction
          </Text>
        );
      }

      if (isCoinbasePaymentMessage(message)) {
        return (
          <Text numberOfLines={1} inverted={fromMe}>
            Coinbase payment
          </Text>
        );
      }

      if (isReplyMessage(message)) {
        const content = message.content();

        // Handle remote attachment in the reply
        if (content.content.remoteAttachment) {
          return (
            <AttachmentRemoteImage
              messageId={message.id}
              remoteMessageContent={content.content.remoteAttachment}
              containerProps={{ style: attachmentStyle }}
            />
          );
        }

        // Handle text in the reply
        if (content.content.text) {
          return (
            <Text numberOfLines={1} inverted={fromMe}>
              {content.content.text}
            </Text>
          );
        }

        // Handle static attachment in the reply
        if (content.content.attachment) {
          return (
            <Text numberOfLines={1} inverted={fromMe}>
              {content.content.attachment.filename}
            </Text>
          );
        }

        // Handle group updates in the reply
        if (content.content.groupUpdated) {
          return (
            <Text numberOfLines={1} inverted={fromMe}>
              Group updated
            </Text>
          );
        }
      }

      captureError(
        new Error(
          `Reply message reference message content is not handled with message content type id ${message.contentTypeId}`
        )
      );
      return null;
    }

    return renderMessageContent(replyMessage);
  }
);
