import {
  actionSecondaryColor,
  chatInputBackgroundColor,
  itemSeparatorColor,
  textPrimaryColor,
  textSecondaryColor,
} from "@styles/colors";
import { useAppTheme } from "@theme/useAppTheme";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Platform,
  StyleSheet,
  TextInput,
  useColorScheme,
  View,
} from "react-native";
import Animated, {
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

import ChatInputReplyPreview from "./InputReplyPreview";
import { SendButton } from "./SendButton";
import { MediaPreview } from "../../../data/store/chatStore";
import { useConversationContext } from "../../../utils/conversation";
import { converseEventEmitter } from "../../../utils/events";
import { AttachmentSelectedStatus } from "../../../utils/media";
import { sendMessage, SendMessageInput } from "../../../utils/message";
import { TextInputWithValue } from "../../../utils/str";
import { serializeRemoteAttachmentMessageContent } from "../../../utils/xmtpRN/attachments";
import AddAttachmentButton, {
  SelectedAttachment,
} from "../Attachment/AddAttachmentButton";
import SendAttachmentPreview from "../Attachment/SendAttachmentPreview";
import { MessageToDisplay } from "../Message/Message";

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

interface ChatInputProps {
  inputHeight: SharedValue<number>;
}

export default function ChatInput({ inputHeight }: ChatInputProps) {
  const conversation = useConversationContext("conversation");
  const inputRef = useConversationContext("inputRef");
  const messageToPrefill = useConversationContext("messageToPrefill");
  const mediaPreviewRef = useConversationContext("mediaPreviewRef");
  const mediaPreviewToPrefill = useConversationContext("mediaPreviewToPrefill");

  const colorScheme = useColorScheme();
  const styles = useStyles();

  const [inputValue, setInputValue] = useState(messageToPrefill);
  const [replyingToMessage, setReplyingToMessage] =
    useState<MessageToDisplay | null>(null);
  const replyingToMessageRef = useRef<MessageToDisplay | null>(null);
  const [mediaPreview, setMediaPreview] = useState(mediaPreviewToPrefill);
  const preparedAttachmentMessageRef = useRef<SendMessageInput | null>(null);
  const isAnimatingHeightRef = useRef(false);

  const numberOfLinesRef = useRef(1);

  const sendButtonType = useMemo(
    () => getSendButtonType(inputValue),
    [inputValue]
  );
  const canSend = inputValue.length > 0 || !!mediaPreview?.mediaURI;

  useEffect(() => {
    if (!mediaPreviewRef.current) {
      mediaPreviewRef.current = mediaPreviewToPrefill;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mediaPreviewToPrefill]);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.currentValue = inputValue;
    }
  }, [inputRef, inputValue]);

  useEffect(() => {
    mediaPreviewRef.current = mediaPreview;
  }, [mediaPreviewRef, mediaPreview]);

  useEffect(() => {
    replyingToMessageRef.current = replyingToMessage;
  }, [replyingToMessage]);

  useEffect(() => {
    converseEventEmitter.on(
      "triggerReplyToMessage",
      (message: MessageToDisplay) => {
        if (inputRef.current) {
          inputRef.current?.focus();
        }
        setReplyingToMessage(message);
        replyingToMessageRef.current = message;
      }
    );
    return () => {
      converseEventEmitter.off("triggerReplyToMessage");
    };
  }, [inputRef]);

  useEffect(() => {
    converseEventEmitter.on("setCurrentConversationInputValue", setInputValue);
    return () => {
      converseEventEmitter.off(
        "setCurrentConversationInputValue",
        setInputValue
      );
    };
  }, []);

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
      if (isAnimatingHeightRef.current || inputHeight.value === newHeight) {
        return;
      }
      isAnimatingHeightRef.current = true;
      requestAnimationFrame(() => {
        inputHeight.value = withSpring(newHeight, HEIGHT_SPRING_CONFIG);
        isAnimatingHeightRef.current = false;
      });
    },
    [inputHeight]
  );

  useEffect(() => {
    updateInputHeightWithAnimation(calculateInputHeight());
  }, [calculateInputHeight, updateInputHeightWithAnimation]);

  const mediaPreviewAnimation = useSharedValue(mediaPreviewToPrefill ? 1 : 0);

  const inputHeightAnimatedStyle = useAnimatedStyle(() => {
    return {
      maxHeight: inputHeight.value,
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
        inputHeight.value = calculateInputHeight();
      }
    },
    [calculateInputHeight, inputHeight]
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
    } else if (
      status === "uploaded" &&
      conversation &&
      attachment.uploadedAttachment
    ) {
      preparedAttachmentMessageRef.current = {
        conversation,
        content: serializeRemoteAttachmentMessageContent(
          attachment.uploadedAttachment
        ),
        contentType: "xmtp.org/remoteStaticAttachment:1.0",
      };
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
    if (conversation) {
      if (mediaPreviewRef.current) {
        if (mediaPreviewRef.current?.status === "uploading") {
          await waitForUploadToComplete();
        }
        setReplyingToMessage(null);
        replyingToMessageRef.current = null;
        setInputValue("");
        numberOfLinesRef.current = 1;
        handleAttachmentClosed();
        mediaPreviewRef.current = {
          ...mediaPreviewRef.current,
          status: "sending",
        };

        setMediaPreview((prev) =>
          prev ? { ...prev, status: "sending" } : null
        );

        if (preparedAttachmentMessageRef.current) {
          await sendMessage(preparedAttachmentMessageRef.current);
          preparedAttachmentMessageRef.current = null;
        }
      }

      if (inputValue.length > 0) {
        const messageToSend = {
          conversation,
          content: inputValue,
          contentType: "xmtp.org/text:1.0",
          referencedMessageId: replyingToMessage
            ? replyingToMessage.id
            : undefined,
        };
        setInputValue("");
        setReplyingToMessage(null);
        numberOfLinesRef.current = 1;
        await new Promise((r) => setTimeout(r, 5));
        sendMessage(messageToSend);
      }

      converseEventEmitter.emit("scrollChatToMessage", {
        index: 0,
      });
    }
  }, [
    conversation,
    inputValue,
    replyingToMessage,
    handleAttachmentClosed,
    mediaPreviewRef,
  ]);

  const inputIsFocused = useRef(false);

  return (
    <View style={styles.chatInputWrapper}>
      {replyingToMessage && (
        <View style={styles.replyToMessagePreview}>
          <ChatInputReplyPreview
            replyingToMessage={replyingToMessage}
            onDismiss={() => {
              setReplyingToMessage(null);
              replyingToMessageRef.current = null;
            }}
          />
        </View>
      )}
      <View style={styles.chatInputContainer}>
        <AddAttachmentButton
          onSelectionStatusChange={handleAttachmentSelection}
        />
        <View style={styles.chatInput}>
          <Animated.View style={inputHeightAnimatedStyle}>
            {mediaPreview?.mediaURI && (
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
          </Animated.View>
          <TextInput
            style={styles.chatInputField}
            value={inputValue}
            onSubmitEditing={() => {
              onValidate();
            }}
            onChangeText={(t: string) => {
              inputIsFocused.current = true;
              setInputValue(t);
            }}
            onKeyPress={(event: any) => {
              if (
                event.nativeEvent.key === "Enter" &&
                !event.altKey &&
                !event.metaKey &&
                !event.shiftKey
              ) {
                event.preventDefault();
                onValidate();
                setTimeout(() => {
                  inputRef.current?.focus();
                }, 100);
              }
            }}
            onFocus={() => {
              inputIsFocused.current = true;
            }}
            onBlur={() => {
              inputIsFocused.current = false;
            }}
            onContentSizeChange={handleTextContentSizeChange}
            multiline
            ref={(r) => {
              if (r && !inputRef.current) {
                inputRef.current = r as TextInputWithValue;
                inputRef.current.currentValue = messageToPrefill;
              }
            }}
            placeholder="Message"
            placeholderTextColor={
              Platform.OS === "android"
                ? textSecondaryColor(colorScheme)
                : actionSecondaryColor(colorScheme)
            }
          />
        </View>
        <SendButton
          canSend={canSend}
          onPress={onValidate}
          sendButtonType={sendButtonType}
        />
      </View>
    </View>
  );
}

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
