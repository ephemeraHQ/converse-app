import { AttachmentRemoteImage } from "@/features/conversation/conversation-attachment/conversation-attachment-remote-image";
import {
  isCoinbasePaymentMessage,
  isGroupUpdatedMessage,
  isReactionMessage,
  isReadReceiptMessage,
  isRemoteAttachmentMessage,
  isReplyMessage,
  isStaticAttachmentMessage,
  isTransactionReferenceMessage,
  useConversationMessageById,
} from "@/features/conversation/conversation-message/conversation-message.utils";
import { useCurrentAccountInboxId } from "@/hooks/use-current-account-inbox-id";
import { usePreferredInboxName } from "@/hooks/usePreferredInboxName";
import { HStack } from "@design-system/HStack";
import { Icon } from "@design-system/Icon/Icon";
import { IconButton } from "@design-system/IconButton/IconButton";
import { Text } from "@design-system/Text";
import { AnimatedVStack, VStack } from "@design-system/VStack";
import { useMessageText } from "@features/conversation-list/hooks/useMessageText";
import { SICK_DAMPING, SICK_STIFFNESS } from "@theme/animations";
import { useAppTheme } from "@theme/useAppTheme";
import { Haptics } from "@utils/haptics";
import { DecodedMessageWithCodecsType } from "@utils/xmtpRN/client";
import {
  DecodedMessage,
  InboxId,
  RemoteAttachmentCodec,
  ReplyCodec,
  StaticAttachmentCodec,
} from "@xmtp/react-native-sdk";
import { memo, useCallback, useEffect } from "react";
import {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { useCurrentConversationTopic } from "../conversation.store-context";
import {
  useConversationComposerStore,
  useConversationComposerStoreContext,
} from "./conversation-composer.store-context";

export const ReplyPreview = memo(function ReplyPreview() {
  const replyingToMessageId = useConversationComposerStoreContext(
    (state) => state.replyingToMessageId
  );

  const { theme } = useAppTheme();

  const composerStore = useConversationComposerStore();

  const { data: currentAccountInboxId } = useCurrentAccountInboxId();
  const topic = useCurrentConversationTopic();

  const { message: replyMessage } = useConversationMessageById({
    messageId: replyingToMessageId!, // ! because we have enabled in the query
    topic,
  });

  const inboxName = usePreferredInboxName(
    replyMessage?.senderAddress as InboxId
  );

  const replyingTo = replyMessage
    ? replyMessage.senderAddress === currentAccountInboxId
      ? `Replying to you`
      : inboxName
        ? `Replying to ${inboxName}`
        : "Replying"
    : "";

  const contentHeightAV = useSharedValue(0);

  const containerAS = useAnimatedStyle(() => {
    return {
      height: withSpring(
        replyingToMessageId && contentHeightAV.value !== 0
          ? contentHeightAV.value
          : 0,
        { damping: SICK_DAMPING, stiffness: SICK_STIFFNESS }
      ),
    };
  }, [replyingToMessageId]);

  useEffect(() => {
    if (replyingToMessageId) {
      Haptics.softImpactAsync();
    }
  }, [replyingToMessageId]);

  const handleDismiss = useCallback(() => {
    composerStore.getState().setReplyToMessageId(null);
  }, [composerStore]);

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
            contentHeightAV.value = event.nativeEvent.layout.height;
          }}
          style={{
            borderTopWidth: theme.borderWidth.xs,
            borderTopColor: theme.colors.border.subtle,
            paddingLeft: theme.spacing.sm,
            paddingRight: theme.spacing.sm,
            paddingTop: theme.spacing.sm,
            paddingBottom: theme.spacing.xxxs,
            backgroundColor: theme.colors.background.surface,
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
                  size={theme.iconSize.xs}
                  icon="arrowshape.turn.up.left.fill"
                  color={theme.colors.text.secondary}
                />
                <Text preset="smaller" color="secondary">
                  {replyingTo}
                </Text>
              </HStack>
              {!!replyMessage && (
                <ReplyPreviewMessageContent replyMessage={replyMessage} />
              )}
            </VStack>
            <ReplyPreviewEndContent replyMessage={replyMessage} />
            <IconButton
              iconName="xmark"
              onPress={handleDismiss}
              hitSlop={8}
              size="sm"
            />
          </HStack>
        </AnimatedVStack>
      )}
    </AnimatedVStack>
  );
});

const ReplyPreviewEndContent = memo(function ReplyPreviewEndContent(props: {
  replyMessage: DecodedMessageWithCodecsType;
}) {
  const { replyMessage } = props;

  const { theme } = useAppTheme();

  if (isReplyMessage(replyMessage)) {
    const replyTyped = replyMessage as DecodedMessage<ReplyCodec>;

    const content = replyTyped.content();

    if (typeof content === "string") {
      return null;
    }

    if (content.content.remoteAttachment) {
      return (
        <AttachmentRemoteImage
          messageId={content.reference}
          remoteMessageContent={content.content.remoteAttachment}
          containerProps={{
            style: {
              height: theme.avatarSize.md,
              width: theme.avatarSize.md,
              borderRadius: theme.borderRadius.xs,
            },
          }}
        />
      );
    }
  }

  if (isRemoteAttachmentMessage(replyMessage)) {
    const messageTyped = replyMessage as DecodedMessage<RemoteAttachmentCodec>;

    const content = messageTyped.content();

    if (typeof content === "string") {
      return null;
    }

    return (
      <AttachmentRemoteImage
        messageId={messageTyped.id}
        remoteMessageContent={content}
        containerProps={{
          style: {
            height: theme.avatarSize.md,
            width: theme.avatarSize.md,
            borderRadius: theme.borderRadius.xs,
          },
        }}
      />
    );
  }

  return null;
});

const ReplyPreviewMessageContent = memo(
  function ReplyPreviewMessageContent(props: {
    replyMessage: DecodedMessageWithCodecsType;
  }) {
    const { replyMessage } = props;

    const { theme } = useAppTheme();

    const messageText = useMessageText(replyMessage);
    const clearedMessage = messageText?.replace(/(\n)/gm, " ");

    if (isStaticAttachmentMessage(replyMessage)) {
      const messageTyped =
        replyMessage as DecodedMessage<StaticAttachmentCodec>;

      const content = messageTyped.content();

      if (typeof content === "string") {
        return <Text>{content}</Text>;
      }

      // TODO
      return <Text>Static attachment</Text>;
    }

    if (isTransactionReferenceMessage(replyMessage)) {
      return <Text>Transaction</Text>;
    }

    if (isReactionMessage(replyMessage)) {
      return <Text>Reaction</Text>;
    }

    if (isReadReceiptMessage(replyMessage)) {
      return <Text>Read Receipt</Text>;
    }

    if (isGroupUpdatedMessage(replyMessage)) {
      return <Text>Group updates</Text>;
    }

    if (isRemoteAttachmentMessage(replyMessage)) {
      return <Text>Remote Attachment</Text>;
    }

    if (isCoinbasePaymentMessage(replyMessage)) {
      return <Text>Coinbase Payment</Text>;
    }

    if (isReplyMessage(replyMessage)) {
      const messageTyped = replyMessage as DecodedMessage<ReplyCodec>;
      const content = messageTyped.content();

      if (typeof content === "string") {
        return <Text>{content}</Text>;
      }

      if (content.content.attachment) {
        return <Text>Reply with attachment</Text>;
      }

      if (content.content.text) {
        return <Text>{content.content.text}</Text>;
      }

      if (content.content.remoteAttachment) {
        return <Text>Image</Text>;
      }

      return <Text>Reply</Text>;
    }

    return <Text numberOfLines={1}>{clearedMessage}</Text>;
  }
);
