import { RemoteAttachmentImage } from "@/components/Chat/Attachment/remote-attachment-image";
import {
  isCoinbasePaymentMessage,
  isGroupUpdatedMessage,
  isReactionMessage,
  isReadReceiptMessage,
  isRemoteAttachmentMessage,
  isReplyMessage,
  isStaticAttachmentMessage,
  isTransactionReferenceMessage,
  useCurrentAccountInboxId,
} from "@/components/Chat/Message/message-utils";
import { SendAttachmentPreview } from "@/features/conversation/composer/send-attachment-preview";
import { HStack } from "@design-system/HStack";
import { Icon } from "@design-system/Icon/Icon";
import { IconButton } from "@design-system/IconButton/IconButton";
import { Text } from "@design-system/Text";
import { textSizeStyles } from "@design-system/Text/Text.styles";
import { AnimatedVStack, VStack } from "@design-system/VStack";
import { getConversationMessages } from "@queries/useConversationMessages";
import { SICK_DAMPING, SICK_STIFFNESS } from "@theme/animations";
import { useAppTheme } from "@theme/useAppTheme";
import { Haptics } from "@utils/haptics";
import { sentryTrackError } from "@utils/sentry";
import { DecodedMessageWithCodecsType } from "@utils/xmtpRN/client";
import {
  DecodedMessage,
  MessageId,
  RemoteAttachmentCodec,
  RemoteAttachmentContent,
  ReplyCodec,
  StaticAttachmentCodec,
} from "@xmtp/react-native-sdk";
import React, { memo, useCallback, useEffect, useRef } from "react";
import { Platform, TextInput as RNTextInput } from "react-native";
import {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useCurrentAccount } from "../../../data/store/accountsStore";
import { getReadableProfile } from "../../../utils/str";
import { useMessageText } from "../../conversation-list/hooks/useMessageText";
import { useCurrentConversationPersistedStoreState } from "../conversation-persisted-stores";
import {
  getComposerMediaPreview,
  getCurrentConversationInputValue,
  getCurrentConversationReplyToMessageId,
  getUploadedRemoteAttachment,
  listenToComposerInputValueChange,
  resetComposerMediaPreview,
  resetUploadedRemoteAttachment,
  saveAttachmentLocally,
  setComposerMediaPreview,
  setComposerMediaPreviewStatus,
  setCurrentConversationInputValue,
  setCurrentConversationReplyToMessageId,
  useConversationComposerMediaPreview,
  useConversationCurrentTopic,
  useCurrentConversationInputValue,
  useReplyToMessageId,
  waitUntilMediaPreviewIsUploaded,
} from "../conversation-service";
import { AddAttachmentButton } from "./add-attachment-button";

export type IComposerSendArgs = {
  text?: string;
  remoteAttachment?: RemoteAttachmentContent;
  referencedMessageId?: MessageId;
};

type IComposerProps = {
  onSend: (args: IComposerSendArgs) => Promise<void>;
};

export function Composer(props: IComposerProps) {
  const { onSend } = props;

  const { theme } = useAppTheme();

  const send = useCallback(async () => {
    const mediaPreview = getComposerMediaPreview();

    const replyingToMessageId = getCurrentConversationReplyToMessageId();

    if (mediaPreview) {
      if (mediaPreview?.status === "uploading") {
        await waitUntilMediaPreviewIsUploaded();
      }

      setComposerMediaPreviewStatus("sending");

      try {
        await saveAttachmentLocally();
      } catch (error) {
        sentryTrackError(error);
      }

      const uploadedRemoteAttachment = getUploadedRemoteAttachment()!;

      await onSend({
        remoteAttachment: uploadedRemoteAttachment,
        ...(replyingToMessageId && {
          referencedMessageId: replyingToMessageId,
        }),
      });

      resetUploadedRemoteAttachment();
      resetComposerMediaPreview();
    }

    const inputValue = getCurrentConversationInputValue();

    if (inputValue.length > 0) {
      await onSend({
        text: inputValue,
        ...(replyingToMessageId && {
          referencedMessageId: replyingToMessageId,
        }),
      });
    }

    // Reset stuff
    setCurrentConversationInputValue("");
    setCurrentConversationReplyToMessageId(null);

    // TODO: Fix with function in context
    // converseEventEmitter.emit("scrollChatToMessage", {
    //   index: 0,
    // });
  }, [onSend]);

  const insets = useSafeAreaInsets();

  return (
    <VStack
      style={{
        paddingBottom: insets.bottom,
        justifyContent: "flex-end",
        overflow: "hidden",
      }}
    >
      <ReplyPreview />
      <VStack
        style={{
          // ...debugBorder("yellow"),
          margin: 6, // 6 in the Figma
        }}
      >
        <HStack
          style={{
            // ...debugBorder("red"),
            alignItems: "flex-end",
          }}
        >
          <AddAttachmentButton />
          <VStack
            style={{
              flex: 1,
              margin: theme.spacing.xxxs - theme.borderWidth.sm, // -theme.borderWidth.sm because of the borderWidth is count in react-native and we want exact pixels
              borderWidth: theme.borderWidth.sm,
              borderColor: theme.colors.border.subtle,
              borderRadius: theme.borderRadius.md,
              overflow: "hidden",
              justifyContent: "flex-end",
            }}
          >
            <AttachmentsPreview />
            <HStack
              style={{
                // ...debugBorder("blue"),
                alignItems: "center",
              }}
            >
              <ComposerTextInput onSubmitEditing={send} />
              <SendButton onPress={send} />
            </HStack>
          </VStack>
        </HStack>
      </VStack>
    </VStack>
  );
}

const SendButton = memo(function SendButton(props: { onPress: () => void }) {
  const { onPress } = props;

  const { theme } = useAppTheme();

  const mediaPreview = useConversationComposerMediaPreview();

  const composerInputValue = useCurrentConversationInputValue();

  const canSend =
    composerInputValue.length > 0 || mediaPreview?.status === "uploaded";

  return (
    <VStack
      style={{
        marginHorizontal: 6, // Value from Figma
        marginVertical:
          6 -
          // Because we input container to be exactly 36 pixels and borderWidth add with total height in react-native
          theme.borderWidth.sm,
        alignSelf: "flex-end",
      }}
    >
      <IconButton
        hitSlop={theme.spacing.xs}
        size="sm"
        onPress={onPress}
        disabled={!canSend}
        iconName="arrow.up"
      />
    </VStack>
  );
});

const ReplyPreview = memo(function ReplyPreview() {
  const { theme } = useAppTheme();

  const replyingToMessageId = useReplyToMessageId();
  const currentAccount = useCurrentAccount()!;
  const { data: currentAccountInboxId } = useCurrentAccountInboxId();
  const topic = useConversationCurrentTopic();

  const replyMessage = replyingToMessageId
    ? getConversationMessages(currentAccount, topic!)?.byId[replyingToMessageId]
    : undefined;

  const readableProfile = replyMessage
    ? getReadableProfile(currentAccount, replyMessage?.senderAddress)
    : null;

  const replyingTo = replyMessage
    ? replyMessage.senderAddress === currentAccountInboxId
      ? `Replying to you`
      : readableProfile
        ? `Replying to ${readableProfile}`
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
    setCurrentConversationReplyToMessageId(null);
  }, []);

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

export const ReplyPreviewEndContent = memo(
  function ReplyPreviewEndContent(props: {
    replyMessage: DecodedMessageWithCodecsType;
  }) {
    const { replyMessage } = props;

    const { theme } = useAppTheme();

    if (isReplyMessage(replyMessage)) {
      const replyTyped = replyMessage as DecodedMessage<[ReplyCodec]>;

      const content = replyTyped.content();

      if (typeof content === "string") {
        return null;
      }

      if (content.content.remoteAttachment) {
        return (
          <RemoteAttachmentImage
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
      const messageTyped = replyMessage as DecodedMessage<
        [RemoteAttachmentCodec]
      >;

      const content = messageTyped.content();

      if (typeof content === "string") {
        return null;
      }

      return (
        <RemoteAttachmentImage
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
  }
);

const ReplyPreviewMessageContent = memo(
  function ReplyPreviewMessageContent(props: {
    replyMessage: DecodedMessageWithCodecsType;
  }) {
    const { replyMessage } = props;

    const { theme } = useAppTheme();

    const messageText = useMessageText(replyMessage);
    const clearedMessage = messageText?.replace(/(\n)/gm, " ");

    if (isStaticAttachmentMessage(replyMessage)) {
      const messageTyped = replyMessage as DecodedMessage<
        [StaticAttachmentCodec]
      >;

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
      const messageTyped = replyMessage as DecodedMessage<[ReplyCodec]>;
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

const AttachmentsPreview = memo(function AttachmentsPreview() {
  const { theme } = useAppTheme();

  const mediaPreview = useCurrentConversationPersistedStoreState(
    (state) => state.composerMediaPreview
  );

  const handleAttachmentClosed = useCallback(() => {
    setComposerMediaPreview(null);
  }, []);

  const isLandscape = !!(
    mediaPreview?.dimensions?.height &&
    mediaPreview?.dimensions?.width &&
    mediaPreview.dimensions.width > mediaPreview.dimensions.height
  );

  const maxHeight = isLandscape ? 90 : 120;

  const containerAS = useAnimatedStyle(() => {
    return {
      height: withSpring(mediaPreview?.mediaURI ? maxHeight : 0, {
        damping: SICK_DAMPING,
        stiffness: SICK_STIFFNESS,
      }),
    };
  }, [mediaPreview?.mediaURI, maxHeight]);

  return (
    <AnimatedVStack style={containerAS}>
      {!!mediaPreview && (
        <HStack
          style={{
            flex: 1,
            paddingHorizontal: 6, // Value from Figma
            paddingTop: 6, // Value from Figma
            columnGap: theme.spacing.xxs,
          }}
        >
          <SendAttachmentPreview
            uri={mediaPreview.mediaURI}
            onClose={handleAttachmentClosed}
            error={mediaPreview.status === "error"}
            isLoading={mediaPreview.status === "uploading"}
            isLandscape={
              !!(
                mediaPreview.dimensions?.height &&
                mediaPreview.dimensions?.width &&
                mediaPreview.dimensions.width > mediaPreview.dimensions.height
              )
            }
          />
        </HStack>
      )}
    </AnimatedVStack>
  );
});

const ComposerTextInput = memo(function ComposerTextInput(props: {
  onSubmitEditing: () => Promise<void>;
}) {
  const { onSubmitEditing } = props;

  const inputRef = useRef<RNTextInput>(null);

  const { theme } = useAppTheme();

  const inputDefaultValue = getCurrentConversationInputValue();

  const handleChangeText = useCallback((text: string) => {
    setCurrentConversationInputValue(text);
  }, []);

  // If we clear the input (i.e after sending a message)
  // we need to clear the input value in the text input
  // Doing this since we are using a uncontrolled component
  useEffect(() => {
    listenToComposerInputValueChange((value, previousValue) => {
      if (previousValue && !value) {
        inputRef.current?.clear();
      }
    });
  }, []);

  const handleSubmitEditing = useCallback(() => {
    onSubmitEditing();
  }, [onSubmitEditing]);

  return (
    <RNTextInput
      style={{
        // ...debugBorder("red"),
        ...textSizeStyles.sm,
        color: theme.colors.text.primary,
        flex: 1,
        paddingHorizontal: theme.spacing.xs,
        paddingVertical:
          theme.spacing.xxs -
          // Because we input container to be exactly 36 pixels and borderWidth add with total height in react-native
          theme.borderWidth.sm,
      }}
      onKeyPress={(event: any) => {
        // Maybe want a better check here, but web/tablet is not the focus right now
        if (Platform.OS !== "web") {
          return;
        }

        if (
          event.nativeEvent.key === "Enter" &&
          !event.altKey &&
          !event.metaKey &&
          !event.shiftKey
        ) {
          event.preventDefault();
          onSubmitEditing();
        }
      }}
      ref={inputRef}
      onSubmitEditing={handleSubmitEditing}
      onChangeText={handleChangeText}
      multiline
      defaultValue={inputDefaultValue}
      placeholder="Message"
      placeholderTextColor={theme.colors.text.tertiary}
    />
  );
});
