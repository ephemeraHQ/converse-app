import {
  actionSecondaryColor,
  chatInputBackgroundColor,
  itemSeparatorColor,
  textPrimaryColor,
  textSecondaryColor,
  backgroundColor,
} from "@styles/colors";
import * as ImagePicker from "expo-image-picker";
import React, {
  useCallback,
  useMemo,
  useRef,
  useState,
  useEffect,
} from "react";
import {
  Platform,
  StyleSheet,
  TextInput,
  useColorScheme,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  SharedValue,
  withSpring,
  useSharedValue,
} from "react-native-reanimated";

import ChatInputReplyPreview from "./InputReplyPreview";
import { SendButton } from "./SendButton";
import { MediaPreview } from "../../../data/store/chatStore";
import { useConversationContext } from "../../../utils/conversation";
import { isDesktop } from "../../../utils/device";
import { converseEventEmitter } from "../../../utils/events";
import { AttachmentSelectedStatus } from "../../../utils/media";
import { sendMessage } from "../../../utils/message";
import { TextInputWithValue } from "../../../utils/str";
import AddAttachmentButton from "../Attachment/AddAttachmentButton";
import SendAttachmentPreview from "../Attachment/SendAttachmentPreview";
import { MessageToDisplay } from "../Message/Message";

const DEFAULT_MEDIA_PREVIEW_HEIGHT = 120;
const MEDIA_PREVIEW_PADDING = Platform.OS === "android" ? 9 : 14;
const LINE_HEIGHT = 22;
const MAX_INPUT_HEIGHT = 500;
const REPLYING_TO_MESSAGE_HEIGHT = 60;

const SPRING_CONFIG = {
  damping: 15,
  mass: 0.35,
  stiffness: 250,
  overshootClamping: true,
  restSpeedThreshold: 0.001,
  restDisplacementThreshold: 0.001,
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
  const {
    conversation,
    inputRef,
    transactionMode,
    messageToPrefill,
    mediaPreviewRef,
    mediaPreviewToPrefill,
  } = useConversationContext([
    "conversation",
    "inputRef",
    "messageToPrefill",
    "mediaPreviewRef",
    "mediaPreviewToPrefill",
    "transactionMode",
  ]);

  const colorScheme = useColorScheme();
  const styles = useStyles();

  const [inputValue, setInputValue] = useState(messageToPrefill);
  const [replyingToMessage, setReplyingToMessage] =
    useState<MessageToDisplay | null>(null);
  const [mediaPreview, setMediaPreview] = useState(mediaPreviewToPrefill);

  const numberOfLinesRef = useRef(1);

  const assetRef = useRef<ImagePicker.ImagePickerAsset | undefined>(undefined);

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
    if (transactionMode) {
      setInputValue("");
    }
  }, [transactionMode]);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.currentValue = inputValue;
    }
  }, [inputRef, inputValue]);

  useEffect(() => {
    mediaPreviewRef.current = mediaPreview;
  }, [mediaPreviewRef, mediaPreview]);

  useEffect(() => {
    converseEventEmitter.on(
      "triggerReplyToMessage",
      (message: MessageToDisplay) => {
        if (inputRef.current) {
          inputRef.current?.focus();
        }
        setReplyingToMessage(message);
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
    const mediaPreviewHeight =
      mediaPreviewRef.current && mediaPreviewRef.current.status === "picked"
        ? DEFAULT_MEDIA_PREVIEW_HEIGHT + MEDIA_PREVIEW_PADDING
        : 0;
    const replyingToMessageHeight = replyingToMessage
      ? REPLYING_TO_MESSAGE_HEIGHT
      : 0;
    return Math.min(
      textContentHeight + mediaPreviewHeight + replyingToMessageHeight,
      MAX_INPUT_HEIGHT
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [numberOfLinesRef, replyingToMessage]);

  const updateInputHeightWithAnimation = useCallback(
    (newHeight: number) => {
      inputHeight.value = withSpring(newHeight, SPRING_CONFIG);
    },
    [inputHeight]
  );

  useEffect(() => {
    updateInputHeightWithAnimation(calculateInputHeight());
  }, [calculateInputHeight, updateInputHeightWithAnimation]);

  const mediaPreviewAnimation = useSharedValue(mediaPreviewToPrefill ? 1 : 0);

  const inputContainerRef = useRef<View>(null);

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

  const animateAttachmentClosed = useCallback(() => {
    requestAnimationFrame(() => {
      updateInputHeightWithAnimation(calculateInputHeight());
    });
  }, [calculateInputHeight, updateInputHeightWithAnimation]);

  const handleAttachmentClosed = useCallback(() => {
    mediaPreviewRef.current = null;
    assetRef.current = undefined;
    updateInputHeightWithAnimation(calculateInputHeight());
    setTimeout(() => {
      mediaPreviewAnimation.value = withSpring(0, SPRING_CONFIG);
    }, 250);
    setTimeout(() => {
      setMediaPreview(null);
    }, 300);
  }, [
    mediaPreviewRef,
    calculateInputHeight,
    updateInputHeightWithAnimation,
    mediaPreviewAnimation,
  ]);

  const handleAttachmentSelected = useCallback(
    async (uri: string | null, status: AttachmentSelectedStatus) => {
      if (uri) {
        setMediaPreview({ mediaURI: uri, status });
        assetRef.current = { uri } as ImagePicker.ImagePickerAsset;
        mediaPreviewRef.current = { mediaURI: uri, status };
        updateInputHeightWithAnimation(calculateInputHeight());
        setTimeout(() => {
          mediaPreviewAnimation.value = withSpring(1, SPRING_CONFIG);
        }, 250);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      mediaPreviewAnimation,
      calculateInputHeight,
      updateInputHeightWithAnimation,
    ]
  );

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
        mediaPreviewRef.current = {
          ...mediaPreviewRef.current,
          status: "sending",
        };

        setMediaPreview((prev) =>
          prev ? { ...prev, status: "sending" } : null
        );
        numberOfLinesRef.current = 1;
        setReplyingToMessage(null);
        setInputValue("");
        animateAttachmentClosed();
        await waitForUploadToComplete();
        handleAttachmentClosed();
      }
      if (inputValue.length > 0) {
        if (replyingToMessage) {
          sendMessage({
            conversation,
            content: inputValue,
            referencedMessageId: replyingToMessage.id,
            contentType: "xmtp.org/text:1.0",
          });
          setReplyingToMessage(null);
          setInputValue("");
          numberOfLinesRef.current = 1;
        } else {
          sendMessage({
            conversation,
            content: inputValue,
            contentType: "xmtp.org/text:1.0",
          });
        }
        setInputValue("");
        numberOfLinesRef.current = 1;
      }
      converseEventEmitter.emit("scrollChatToMessage", {
        index: 0,
      });
    }
  }, [
    conversation,
    inputValue,
    replyingToMessage,
    animateAttachmentClosed,
    handleAttachmentClosed,
    mediaPreviewRef,
  ]);

  const inputIsFocused = useRef(false);

  return (
    <View ref={inputContainerRef} style={styles.chatInputWrapper}>
      {replyingToMessage && (
        <View style={styles.replyToMessagePreview}>
          <ChatInputReplyPreview
            replyingToMessage={replyingToMessage}
            onDismiss={() => setReplyingToMessage(null)}
          />
        </View>
      )}
      <View style={styles.chatInputContainer}>
        <AddAttachmentButton onAttachmentSelected={handleAttachmentSelected} />
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
                />
              </Animated.View>
            )}
          </Animated.View>
          <TextInput
            autoCorrect={isDesktop ? false : undefined}
            autoComplete={isDesktop ? "off" : undefined}
            style={styles.chatInputField}
            value={inputValue}
            // On desktop, we modified React Native RCTUITextView.m
            // to handle key Shift + Enter to add new line
            // This disables the flickering on Desktop when hitting Enter
            blurOnSubmit={isDesktop}
            // Mainly used on Desktop so that Enter sends the message
            onSubmitEditing={() => {
              onValidate();
              // But we still want to refocus on Desktop when we
              // hit Enter so let's force it
              if (isDesktop) {
                setTimeout(() => {
                  inputRef.current?.focus();
                }, 100);
              }
            }}
            onChangeText={(t: string) => {
              inputIsFocused.current = true;
              setInputValue(t);
            }}
            onKeyPress={
              Platform.OS === "web"
                ? (event: any) => {
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
                  }
                : undefined
            }
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
  return StyleSheet.create({
    chatInputWrapper: {
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 0,
    },
    replyToMessagePreview: {
      paddingHorizontal: 10,
      paddingVertical: 8,
      borderTopWidth: 0.5,
      borderTopColor: itemSeparatorColor(colorScheme),
      backgroundColor: backgroundColor(colorScheme),
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
