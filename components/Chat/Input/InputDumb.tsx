import {
  chatInputBackgroundColor,
  itemSeparatorColor,
  textPrimaryColor,
} from "@styles/colors";
import { useAppTheme } from "@theme/useAppTheme";
import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Platform,
  TextInput as RNTextInput,
  StyleSheet,
  View,
  useColorScheme,
} from "react-native";
import Animated, {
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

import ChatInputReplyPreview from "@components/Chat/Input/InputReplyPreview";
import { RemoteAttachmentContent } from "@xmtp/react-native-sdk";
import { MediaPreview } from "../../../data/store/chatStore";
import { converseEventEmitter } from "../../../utils/events";
import { AttachmentSelectedStatus } from "../../../utils/media";
import  {
  AddAttachmentButton,
  SelectedAttachment,
} from "../Attachment/AddAttachmentButton";
import SendAttachmentPreview from "../Attachment/SendAttachmentPreview";
import { SendButton } from "./SendButton";
import { useConversationContext } from "../../../features/conversation/conversation-context";
import { HStack } from "@design-system/HStack";
import { AnimatedVStack, VStack } from "@design-system/VStack";

const DEFAULT_MEDIA_PREVIEW_HEIGHT = { PORTRAIT: 120, LANDSCAPE: 90 };
const MEDIA_PREVIEW_PADDING = Platform.OS === "android" ? 9 : 14;
const LINE_HEIGHT = 22;
const MAX_INPUT_HEIGHT = 500;
const REPLYING_TO_MESSAGE_HEIGHT = 60;

const HEIGHT_SPRING_CONFIG = {
  damping: 12,
  mass: 0.3,
  stiffness: 300,
  overshootClamping: true,
  restSpeedThreshold: 0.005,
  restDisplacementThreshold: 0.005,
};

const PREVIEW_SPRING_CONFIG = {
  damping: 15,
  mass: 0.5,
  stiffness: 200,
  overshootClamping: false,
  restSpeedThreshold: 0.01,
  restDisplacementThreshold: 0.01,
};

const getSendButtonType = (input: string): "DEFAULT" | "HIGHER" => {
  if (input.match(/\bhigher\b/gi)) {
    return "HIGHER";
  }
  return "DEFAULT";
};

type ChatInputProps = {
  
};

export function ChatInputDumb() {
  const styles = useStyles();

  const sendMessage = useConversationContext("sendMessage");

  const composerHeightAV = useConversationContext("composerHeightAV");

  const messageToPrefill = useConversationContext("messageToPrefill");
  const mediaPreviewRef = useConversationContext("mediaPreviewRef");
  const mediaPreviewToPrefill = useConversationContext("mediaPreviewToPrefill");

  const inputValueRef = useRef(messageToPrefill);

  // In case the messageToPrefill changes
  useEffect(() => {
    inputValueRef.current = messageToPrefill;
  }, [messageToPrefill]);

  const [replyingToMessageId, setReplyingToMessageId] = useState<string | null>(
    null
  );
  const replyingToMessageRef = useRef<string | null>(null);
  const [mediaPreview, setMediaPreview] = useState(mediaPreviewToPrefill);
  const preparedAttachmentMessageRef = useRef<RemoteAttachmentContent | null>(
    null
  );
  const isAnimatingHeightRef = useRef(false);

  const numberOfLinesRef = useRef(1);

  const textInputHeightAV = useSharedValue(0);

  // useEffect(() => {
  //   replyingToMessageRef.current = replyingToMessageId;
  // }, [replyingToMessageId]);

  // useEffect(() => {
  //   converseEventEmitter.on("triggerReplyToMessage", (messageId: string) => {
  //     if (inputRef.current) {
  //       inputRef.current?.focus();
  //     }
  //     setReplyingToMessageId(messageId);
  //     replyingToMessageRef.current = messageId;
  //   });
  //   return () => {
  //     converseEventEmitter.off("triggerReplyToMessage");
  //   };
  // }, [inputRef]);

  // useEffect(() => {
  //   converseEventEmitter.on("setCurrentConversationInputValue", setInputValue);
  //   return () => {
  //     converseEventEmitter.off(
  //       "setCurrentConversationInputValue",
  //       setInputValue
  //     );
  //   };
  // }, []);

  useEffect(() => {
    const handleMediaPreviewChange = (newMediaPreview: MediaPreview) => {
      setMediaPreview(newMediaPreview);
    };
    converseEventEmitter.on(
      "setCurrentConversationMediaPreviewValue",
      handleMediaPreviewChange
    );
    return () => {
      converseEventEmitter.off(
        "setCurrentConversationMediaPreviewValue",
        handleMediaPreviewChange
      );
    };
  }, []);

  const calculateInputHeight = useCallback(() => {
    const textContentHeight = (numberOfLinesRef.current - 1) * LINE_HEIGHT;
    const isLandscape =
      mediaPreviewRef.current?.dimensions?.height &&
      mediaPreviewRef.current?.dimensions?.width &&
      mediaPreviewRef.current.dimensions.width >
        mediaPreviewRef.current.dimensions.height;
    const mediaPreviewHeight =
      mediaPreviewRef.current &&
      (mediaPreviewRef.current.status === "picked" ||
        mediaPreviewRef.current.status === "uploading" ||
        mediaPreviewRef.current.status === "uploaded")
        ? isLandscape
          ? DEFAULT_MEDIA_PREVIEW_HEIGHT.LANDSCAPE
          : DEFAULT_MEDIA_PREVIEW_HEIGHT.PORTRAIT + MEDIA_PREVIEW_PADDING
        : 0;
    const replyingToMessageHeight = replyingToMessageRef.current
      ? REPLYING_TO_MESSAGE_HEIGHT
      : 0;
    return Math.min(
      textContentHeight + mediaPreviewHeight + replyingToMessageHeight,
      MAX_INPUT_HEIGHT
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    numberOfLinesRef.current,
    replyingToMessageRef.current,
    mediaPreviewRef.current?.mediaURI,
  ]);

  const updateInputHeightWithAnimation = useCallback(
    (newHeight: number) => {
      if (isAnimatingHeightRef.current || composerHeightAV.value === newHeight) {
        return;
      }
      isAnimatingHeightRef.current = true;
      requestAnimationFrame(() => {
        composerHeightAV.value = withSpring(newHeight, HEIGHT_SPRING_CONFIG);
        isAnimatingHeightRef.current = false;
      });
    },
    [composerHeightAV]
  );

  useEffect(() => {
    updateInputHeightWithAnimation(calculateInputHeight());
  }, [calculateInputHeight, updateInputHeightWithAnimation]);

  const mediaPreviewAnimation = useSharedValue(mediaPreviewToPrefill ? 1 : 0);

  const inputHeightAnimatedStyle = useAnimatedStyle(() => {
    return {
      maxHeight: composerHeightAV.value,
    };
  });

  const mediaPreviewAnimatedStyle = useAnimatedStyle(() => {
    const scale = mediaPreviewAnimation.value;
    return {
      transform: [{ scale }],
      opacity: scale,
    };
  });

  const handleTextContentSizeChange = useCallback(
    (event: { nativeEvent: { contentSize: { height: number } } }) => {
      const textContentHeight = event.nativeEvent.contentSize.height;
      const newNumberOfLines = Math.ceil(textContentHeight / LINE_HEIGHT);

      if (newNumberOfLines !== numberOfLinesRef.current) {
        numberOfLinesRef.current = newNumberOfLines;
        composerHeightAV.value = calculateInputHeight();
      }
    },
    [calculateInputHeight, composerHeightAV]
  );

  const handleAttachmentClosed = useCallback(() => {
    mediaPreviewRef.current = null;
    mediaPreviewAnimation.value = withSpring(0, PREVIEW_SPRING_CONFIG);

    updateInputHeightWithAnimation(calculateInputHeight());
    setTimeout(() => {
      setMediaPreview(null);
      preparedAttachmentMessageRef.current = null;
    }, 300);
  }, [
    mediaPreviewRef,
    calculateInputHeight,
    updateInputHeightWithAnimation,
    mediaPreviewAnimation,
  ]);

  const handleAttachmentSelection = (
    status: AttachmentSelectedStatus,
    attachment: SelectedAttachment
  ) => {
    if (status === "picked" && attachment.uri) {
      setMediaPreview({
        mediaURI: attachment.uri,
        status,
        dimensions: attachment.attachmentToSave?.dimensions,
      });
      mediaPreviewRef.current = {
        mediaURI: attachment.uri,
        status,
        dimensions: attachment.attachmentToSave?.dimensions,
      };
      mediaPreviewAnimation.value = withSpring(1, PREVIEW_SPRING_CONFIG);
    } else if (status === "uploaded" && attachment.uploadedAttachment) {
      preparedAttachmentMessageRef.current = attachment.uploadedAttachment;
    }
  };

  const onValidate = useCallback(async () => {
    const waitForUploadToComplete = () => {
      return new Promise<void>((resolve) => {
        const interval = setInterval(() => {
          if (mediaPreviewRef.current?.status === "uploaded") {
            clearInterval(interval);
            resolve();
          }
        }, 200);
      });
    };
    if (mediaPreviewRef.current) {
      if (mediaPreviewRef.current?.status === "uploading") {
        await waitForUploadToComplete();
      }
      setReplyingToMessageId(null);
      replyingToMessageRef.current = null;
      setInputValue("");
      numberOfLinesRef.current = 1;
      handleAttachmentClosed();
      mediaPreviewRef.current = {
        ...mediaPreviewRef.current,
        status: "sending",
      };

      setMediaPreview((prev) => (prev ? { ...prev, status: "sending" } : null));

      if (preparedAttachmentMessageRef.current) {
        // const messageId = uuidv4();
        // await saveAttachmentForPendingMessage(
        //   messageId,
        //   preparedAttachmentMessageRef.current.attachmentToSave.filePath,
        //   preparedAttachmentMessageRef.current.attachmentToSave.fileName,
        //   preparedAttachmentMessageRef.current.attachmentToSave.mimeType
        // );
        await sendMessage({
          attachment: preparedAttachmentMessageRef.current,
        });
        preparedAttachmentMessageRef.current = null;
      }
    }

    if (inputValue.length > 0) {
      const messageToSend = {
        content: inputValue,
        contentType: "xmtp.org/text:1.0",
        referencedMessageId: replyingToMessageId,
      };
      setInputValue("");
      setReplyingToMessageId(null);
      numberOfLinesRef.current = 1;
      await new Promise((r) => setTimeout(r, 5));
      await sendMessage({
        text: messageToSend.content,
        ...(messageToSend.referencedMessageId && {
          referencedMessageId: messageToSend.referencedMessageId,
        }),
      });
    }

    converseEventEmitter.emit("scrollChatToMessage", {
      index: 0,
    });
  }, [
    mediaPreviewRef,
    inputValueRef,
    handleAttachmentClosed,
    sendMessage,
    replyingToMessageId,
  ]);

  return (
    <VStack style={styles.chatInputWrapper}>
      <ReplyPreview />
      <HStack style={styles.chatInputContainer}>
        <AddAttachmentButton
          onSelectionStatusChange={handleAttachmentSelection}
        />
        <VStack style={styles.chatInput}>
          <AnimatedVStack style={inputHeightAnimatedStyle}>
            <AttachmentsPreview/>
            
          </AnimatedVStack>
          <TextInput />
        </VStack>
        <SendButton onPress={onValidate} />
      </HStack>
    </VStack>
  );
}

 const ReplyPreview = memo(function ReplyPreview() {
  return <View style={styles.replyToMessagePreview}>
  <ChatInputReplyPreview
    replyingToMessageId={replyingToMessageId}
    onDismiss={() => {
      setReplyingToMessageId(null);
      replyingToMessageRef.current = null;
    }}
  />
</View>
})

 const AttachmentsPreview = memo(function AttachmentsPreview() {
  return {mediaPreview?.mediaURI && (
    <Animated.View
      style={[
        styles.attachmentPreviewWrapper,
        mediaPreviewAnimatedStyle,
      ]}
    >
      <SendAttachmentPreview
        currentAttachmentMediaURI={mediaPreview.mediaURI}
        onClose={handleAttachmentClosed}
        error={mediaPreview.status === "error"}
        isLoading={mediaPreview.status === "uploading"}
        scale={mediaPreviewAnimation}
        isLandscape={
          !!(
            mediaPreview.dimensions?.height &&
            mediaPreview.dimensions?.width &&
            mediaPreview.dimensions.width >
              mediaPreview.dimensions.height
          )
        }
      />
    </Animated.View>
  )}
});

const TextInput = memo(function TextInput() {
  const styles = useStyles();

  const { theme } = useAppTheme();

  const messageToPrefill = useConversationContext("messageToPrefill");

  const handleChangeText = useCallback((t: string) => {
    inputIsFocused.current = true;
    setInputValue(t);
  }, []);

  const handleSubmitEditing = useCallback(() => {
    onValidate();
  }, [onValidate]);

  const handleTextContentSizeChange = useCallback(
    (event: { nativeEvent: { contentSize: { height: number } } }) => {
      const textContentHeight = event.nativeEvent.contentSize.height;
      const newNumberOfLines = Math.ceil(textContentHeight / LINE_HEIGHT);
    },
    []
  );

  return (
    <RNTextInput
      style={styles.chatInputField}
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
    replyToMessagePreview: {
      paddingHorizontal: 10,
      paddingVertical: 8,
      borderTopWidth: 0.5,
      borderTopColor: itemSeparatorColor(colorScheme),
      backgroundColor: theme.colors.background.surface,
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
    attachmentPreviewWrapper: {
      marginTop: Platform.OS === "android" ? 7 : 12,
      marginBottom: 2,
      alignItems: "center",
      justifyContent: "center",
      width: 120,
    },
    chatInputField: {
      width: "100%",
      color: textPrimaryColor(colorScheme),
      fontSize: Platform.OS === "android" ? 16 : 17,
      paddingHorizontal: 12,
      lineHeight: LINE_HEIGHT,
      paddingVertical: Platform.OS === "android" ? 4 : 7,
      zIndex: 1,
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
