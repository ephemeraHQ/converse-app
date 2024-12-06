import { RemoteAttachmentImage } from "@/components/Chat/Attachment/remote-attachment-image";
import {
  BubbleContainer,
  BubbleContentContainer,
} from "@/components/Chat/Message/components/message-bubble";
import { MessageLayout } from "@/components/Chat/Message/components/message-layout";
import { MessageText } from "@/components/Chat/Message/components/message-text";
import { useMessageContextStoreContext } from "@/components/Chat/Message/stores/message-store";
import { useSelect } from "@/data/store/storeHelpers";
import { useCurrentAccount } from "@data/store/accountsStore";
import { HStack } from "@design-system/HStack";
import { Icon } from "@design-system/Icon/Icon";
import { Text } from "@design-system/Text";
import { VStack } from "@design-system/VStack";
import { getConversationMessageQueryOptions } from "@queries/useConversationMessage";
import { useQuery } from "@tanstack/react-query";
import { useAppTheme } from "@theme/useAppTheme";
import { sentryTrackError } from "@utils/sentry";
import { getReadableProfile } from "@utils/str";
import { DecodedMessage, MessageId, ReplyCodec } from "@xmtp/react-native-sdk";
import { memo } from "react";
import { getCurrentConversationMessages } from "../../../../features/conversation/conversation-service";

export const MessageReply = memo(function MessageReply(props: {
  message: DecodedMessage<[ReplyCodec]>;
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

  return (
    <MessageLayout>
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
                <RemoteAttachmentImage
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
                        theme.spacing.message.replyMessage.horizontalPadding /
                          2,
                    },
                  }}
                />
              </VStack>
            )}

            {!!replyMessageContent.content.text && (
              <MessageText inverted={fromMe}>
                {replyMessageContent.content.text}
              </MessageText>
            )}
          </VStack>
        </BubbleContentContainer>
      </BubbleContainer>
    </MessageLayout>
  );
});

const MessageReplyReference = memo(function MessageReplyReference(props: {
  referenceMessageId: MessageId;
}) {
  const { referenceMessageId } = props;

  const { theme } = useAppTheme();

  const fromMe = useMessageContextStoreContext((s) => s.fromMe);

  const currentAccount = useCurrentAccount()!;

  const replyMessageReference =
    useConversationMessageForReplyMessage(referenceMessageId);

  const readableProfile = replyMessageReference
    ? getReadableProfile(currentAccount, replyMessageReference.senderAddress)
    : null;

  return (
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
          {readableProfile}
        </Text>
      </HStack>
      {!!replyMessageReference && (
        <MessageReplyReferenceContent replyMessage={replyMessageReference} />
      )}
    </VStack>
  );
});

const MessageReplyReferenceContent = memo(
  function ReplyMessageReferenceMessageContent(props: {
    replyMessage: DecodedMessage<[ReplyCodec]>;
  }) {
    const { replyMessage } = props;

    const { theme } = useAppTheme();

    const fromMe = useMessageContextStoreContext((s) => s.fromMe);

    const content = replyMessage.content();

    if (typeof content === "string") {
      return (
        <Text numberOfLines={1} inverted={fromMe}>
          {content}
        </Text>
      );
    }

    if (content.content.remoteAttachment) {
      return (
        <RemoteAttachmentImage
          messageId={replyMessage.id}
          remoteMessageContent={content.content.remoteAttachment}
          containerProps={{
            style: {
              height: theme.avatarSize.md,
              width: theme.avatarSize.md,
              marginBottom: theme.spacing.xxxs, // Because with text our lineHeight is 20 so we don't need it but with attachment we need to put that missing 4px (16+4)
              borderRadius:
                theme.borderRadius.message.attachment -
                theme.spacing.message.replyMessage.horizontalPadding / 2 -
                theme.spacing.message.replyMessage.horizontalPadding / 2,
            },
          }}
        />
      );
    }

    const replyMessageSafeText = getReplyMessageSafeText(replyMessage);
    sentryTrackError(
      `Reply message reference message content is not handled with default text ${replyMessageSafeText}`
    );
    return (
      <Text numberOfLines={1} inverted={fromMe}>
        {replyMessageSafeText}
      </Text>
    );
  }
);

function getReplyMessageSafeText(replyMessage: DecodedMessage<[ReplyCodec]>) {
  try {
    const content = replyMessage.content();
    if (typeof content === "string") {
      return content;
    }
    return content.content.text;
  } catch (error) {
    sentryTrackError(error);
    return replyMessage.fallback;
  }
}

// Needed that in case we need to see the content of a message that is not in the chached list
function useConversationMessageForReplyMessage(
  messageId: MessageId
): DecodedMessage<[ReplyCodec]> | undefined {
  const currentAccount = useCurrentAccount()!;
  const messages = getCurrentConversationMessages();

  const cachedReplyMessage = messages?.byId[messageId] as
    | DecodedMessage<[ReplyCodec]>
    | undefined;

  // Only fetch the message if it's in the list of messages of the conversation
  const { data: replyMessage } = useQuery({
    ...getConversationMessageQueryOptions({
      account: currentAccount,
      messageId,
    }),
    enabled: !cachedReplyMessage,
  });

  return (
    (replyMessage as DecodedMessage<[ReplyCodec]> | undefined) ??
    cachedReplyMessage
  );
}
