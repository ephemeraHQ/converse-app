import { chatInputBackgroundColor, itemSeparatorColor } from "@styles/colors";
import { useAppTheme } from "@theme/useAppTheme";
import React, { memo, useCallback, useEffect, useRef } from "react";
import {
  Platform,
  TextInput as RNTextInput,
  StyleSheet,
  useColorScheme,
} from "react-native";

import { SendAttachmentPreview } from "@components/Chat/Attachment/SendAttachmentPreview";
import ChatInputReplyPreview from "@components/Chat/Input/InputReplyPreview";
import { HStack } from "@design-system/HStack";
import { IconButton } from "@design-system/IconButton/IconButton";
import { textSizeStyles } from "@design-system/Text/Text.styles";
import { AnimatedVStack, VStack } from "@design-system/VStack";
import { sentryTrackError } from "@utils/sentry";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useConversationContext } from "../../../features/conversation/conversation-context";
import { useCurrentConversationPersistedStoreState } from "../../../features/conversation/conversation-persisted-stores";
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
  useCurrentConversationInputValue,
  useReplyToMessageId,
  waitUntilMediaPreviewIsUploaded,
} from "../../../features/conversation/conversation-service";
import { converseEventEmitter } from "../../../utils/events";
import { AddAttachmentButton } from "../Attachment/AddAttachmentButton";

// const DEFAULT_MEDIA_PREVIEW_HEIGHT = { PORTRAIT: 120, LANDSCAPE: 90 };
// const MEDIA_PREVIEW_PADDING = Platform.OS === "android" ? 9 : 14;
const LINE_HEIGHT = 22;
// const MAX_INPUT_HEIGHT = 500;
// const REPLYING_TO_MESSAGE_HEIGHT = 60;

// const HEIGHT_SPRING_CONFIG = {
//   damping: 12,
//   mass: 0.3,
//   stiffness: 300,
//   overshootClamping: true,
//   restSpeedThreshold: 0.005,
//   restDisplacementThreshold: 0.005,
// };

// const PREVIEW_SPRING_CONFIG = {
//   damping: 15,
//   mass: 0.5,
//   stiffness: 200,
//   overshootClamping: false,
//   restSpeedThreshold: 0.01,
//   restDisplacementThreshold: 0.01,
// };

// const getSendButtonType = (input: string): "DEFAULT" | "HIGHER" => {
//   if (input.match(/\bhigher\b/gi)) {
//     return "HIGHER";
//   }
//   return "DEFAULT";
// };

export function ChatInputDumb() {
  const { theme } = useAppTheme();
  const colorScheme = useColorScheme();

  const sendMessage = useConversationContext("sendMessage");

  const composerHeightAV = useConversationContext("composerHeightAV");

  const numberOfLinesRef = useRef(1);

  // const isAnimatingHeightRef = useRef(false);
  // const textInputHeightAV = useSharedValue(0);

  // const calculateInputHeight = useCallback(() => {
  //   const textContentHeight = (numberOfLinesRef.current - 1) * LINE_HEIGHT;
  //   const isLandscape =
  //     mediaPreviewRef.current?.dimensions?.height &&
  //     mediaPreviewRef.current?.dimensions?.width &&
  //     mediaPreviewRef.current.dimensions.width >
  //       mediaPreviewRef.current.dimensions.height;
  //   const mediaPreviewHeight =
  //     mediaPreviewRef.current &&
  //     (mediaPreviewRef.current.status === "picked" ||
  //       mediaPreviewRef.current.status === "uploading" ||
  //       mediaPreviewRef.current.status === "uploaded")
  //       ? isLandscape
  //         ? DEFAULT_MEDIA_PREVIEW_HEIGHT.LANDSCAPE
  //         : DEFAULT_MEDIA_PREVIEW_HEIGHT.PORTRAIT + MEDIA_PREVIEW_PADDING
  //       : 0;
  //   const replyingToMessageHeight = replyingToMessageRef.current
  //     ? REPLYING_TO_MESSAGE_HEIGHT
  //     : 0;
  //   return Math.min(
  //     textContentHeight + mediaPreviewHeight + replyingToMessageHeight,
  //     MAX_INPUT_HEIGHT
  //   );
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [
  //   numberOfLinesRef.current,
  //   replyingToMessageRef.current,
  //   mediaPreviewRef.current?.mediaURI,
  // ]);

  // const updateInputHeightWithAnimation = useCallback(
  //   (newHeight: number) => {
  //     if (
  //       isAnimatingHeightRef.current ||
  //       composerHeightAV.value === newHeight
  //     ) {
  //       return;
  //     }
  //     isAnimatingHeightRef.current = true;
  //     requestAnimationFrame(() => {
  //       composerHeightAV.value = withSpring(newHeight, HEIGHT_SPRING_CONFIG);
  //       isAnimatingHeightRef.current = false;
  //     });
  //   },
  //   [composerHeightAV]
  // );

  // useEffect(() => {
  //   updateInputHeightWithAnimation(calculateInputHeight());
  // }, [calculateInputHeight, updateInputHeightWithAnimation]);

  // const inputHeightAnimatedStyle = useAnimatedStyle(() => {
  //   return {
  //     maxHeight: composerHeightAV.value,
  //   };
  // });

  // const handleTextContentSizeChange = useCallback(
  //   (event: { nativeEvent: { contentSize: { height: number } } }) => {
  //     const textContentHeight = event.nativeEvent.contentSize.height;
  //     const newNumberOfLines = Math.ceil(textContentHeight / LINE_HEIGHT);

  //     if (newNumberOfLines !== numberOfLinesRef.current) {
  //       numberOfLinesRef.current = newNumberOfLines;
  //       composerHeightAV.value = calculateInputHeight();
  //     }
  //   },
  //   [calculateInputHeight, composerHeightAV]
  // );

  const send = useCallback(async () => {
    const mediaPreview = getComposerMediaPreview();

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

      await sendMessage({
        attachment: uploadedRemoteAttachment,
      });

      resetUploadedRemoteAttachment();
      resetComposerMediaPreview();
    }

    const inputValue = getCurrentConversationInputValue();

    if (inputValue.length > 0) {
      const replyingToMessageId = getCurrentConversationReplyToMessageId();

      await sendMessage({
        text: inputValue,
        // contentType: "xmtp.org/text:1.0",
        ...(replyingToMessageId && {
          referencedMessageId: replyingToMessageId,
        }),
      });

      // Reset stuff
      setCurrentConversationInputValue("");
      setCurrentConversationReplyToMessageId(null);
    }

    converseEventEmitter.emit("scrollChatToMessage", {
      index: 0,
    });
  }, [sendMessage]);

  const insets = useSafeAreaInsets();

  return (
    <VStack
      style={{
        // ...debugBorder("yellow"),
        margin: 6, // 6 in the Figma
        paddingBottom: insets.bottom,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <ReplyPreview />
      <HStack
        style={{
          alignItems: "center",
          // ...debugBorder("red"),
        }}
      >
        <AddAttachmentButton />
        <AnimatedVStack
          layout={theme.animation.springLayoutTransition}
          style={{
            flex: 1,
            margin: theme.spacing.xxxs,
            borderWidth: theme.borderWidth.sm,
            borderColor: theme.colors.border.subtle,
            borderRadius: theme.borderRadius.md,
          }}
        >
          <AttachmentsPreview />
          <HStack
            style={{
              alignItems: "center",
            }}
          >
            <ComposerTextInput onSubmitEditing={send} />
            <SendButton onPress={send} />
          </HStack>
        </AnimatedVStack>
      </HStack>
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
        margin: 6, // Value from Figma
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

  const handleDismiss = useCallback(() => {
    setCurrentConversationReplyToMessageId(null);
  }, []);

  if (!replyingToMessageId) {
    return null;
  }

  return (
    <VStack
      style={{
        paddingHorizontal: 10,
        paddingVertical: 8,
        borderTopWidth: 0.5,
        borderTopColor: theme.colors.border.edge,
        backgroundColor: theme.colors.background.surface,
      }}
    >
      <ChatInputReplyPreview
        replyingToMessageId={replyingToMessageId}
        onDismiss={handleDismiss}
      />
    </VStack>
  );
});

const AttachmentsPreview = memo(function AttachmentsPreview() {
  const { theme } = useAppTheme();

  const mediaPreview = useCurrentConversationPersistedStoreState(
    (state) => state.composerMediaPreview
  );

  const handleAttachmentClosed = useCallback(() => {
    setComposerMediaPreview(null);
  }, []);

  if (!mediaPreview?.mediaURI) {
    return null;
  }

  return (
    <VStack
      style={{
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
    </VStack>
  );
});

const ComposerTextInput = memo(function ComposerTextInput(props: {
  onSubmitEditing: () => Promise<void>;
}) {
  const { onSubmitEditing } = props;

  const inputRef = useRef<RNTextInput>(null);

  const { theme } = useAppTheme();

  const messageToPrefill = useConversationContext("messageToPrefill");

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

  const handleTextContentSizeChange = useCallback(
    (event: { nativeEvent: { contentSize: { height: number } } }) => {
      const textContentHeight = event.nativeEvent.contentSize.height;
      const newNumberOfLines = Math.ceil(textContentHeight / LINE_HEIGHT);
      console.log("newNumberOfLines:", newNumberOfLines);
    },
    []
  );

  return (
    <RNTextInput
      style={{
        // ...debugBorder("red"),
        ...textSizeStyles.sm,
        color: theme.colors.text.primary,
        flex: 1,
        paddingHorizontal: theme.spacing.xs,
        paddingVertical: theme.spacing.xxs,
      }}
      ref={inputRef}
      onSubmitEditing={handleSubmitEditing}
      onChangeText={handleChangeText}
      onContentSizeChange={handleTextContentSizeChange}
      multiline
      defaultValue={messageToPrefill}
      placeholder="Message"
      placeholderTextColor={theme.colors.text.tertiary}
    />
  );
});

const useStyles = () => {
  const colorScheme = useColorScheme();
  const { theme } = useAppTheme();

  return StyleSheet.create({
    chatInputWrapper: {
      backgroundColor: theme.colors.background.surface,
      width: "100%",
      bottom: 0,
    },
    chatInputContainer: {
      flexDirection: "row",
      alignItems: "flex-end",
      paddingBottom: 8,
    },
    chatInput: {
      flex: 1,
      marginLeft: 12,
      backgroundColor: chatInputBackgroundColor(colorScheme),
      borderRadius: 18,
      borderWidth: Platform.OS === "android" ? 0 : 0.5,
      borderColor: itemSeparatorColor(colorScheme),
      overflow: "hidden",
      marginBottom: 6,
    },
    sendButtonContainer: {
      width: 60,
      alignItems: "center",
      marginBottom: 6,
    },
    sendButton: {
      marginTop: "auto",
    },
  });
};
