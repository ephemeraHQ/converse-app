import {
  actionSecondaryColor,
  chatInputBackgroundColor,
  itemSeparatorColor,
  textPrimaryColor,
  textSecondaryColor,
} from "@styles/colors";
import * as ImagePicker from "expo-image-picker";
import React, {
  useCallback,
  useMemo,
  useRef,
  useState,
  useEffect,
  useLayoutEffect,
} from "react";
import {
  Platform,
  StyleSheet,
  TextInput,
  TouchableOpacity,
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
import SendButtonDefaultDark from "../../../assets/send-button-dark.svg";
import SendButtonHigher from "../../../assets/send-button-higher.svg";
import SendButtonDefaultLight from "../../../assets/send-button-light.svg";
import { useAccountsStore } from "../../../data/store/accountsStore";
import { useConversationContext } from "../../../utils/conversation";
import { isDesktop } from "../../../utils/device";
import { converseEventEmitter } from "../../../utils/events";
import { AttachmentSelectedStatus } from "../../../utils/media";
import { sendMessage } from "../../../utils/message";
import { TextInputWithValue } from "../../../utils/str";
import AddAttachmentButton from "../Attachment/AddAttachmentButton";
import SendAttachmentPreview from "../Attachment/SendAttachmentPreview";
import { MessageToDisplay } from "../Message/Message";

const getSendButtonType = (input: string): "DEFAULT" | "HIGHER" => {
  if (input.match(/\bhigher\b/gi)) {
    return "HIGHER";
  }
  return "DEFAULT";
};

interface ChatInputProps {
  inputHeight: SharedValue<number>;
}

const INITIAL_INPUT_HEIGHT = 36;
const DEFAULT_MEDIA_PREVIEW_HEIGHT = 120;
const MEDIA_PREVIEW_PADDING = Platform.OS === "android" ? 9 : 14;
const LINE_HEIGHT = 22;
const MAX_INPUT_HEIGHT = 500;

const SPRING_CONFIG = {
  damping: 15,
  mass: 0.35,
  stiffness: 250,
  overshootClamping: true,
  restSpeedThreshold: 0.001,
  restDisplacementThreshold: 0.001,
};

export default function ChatInput({
  inputHeight: inputHeightAnimation,
}: ChatInputProps) {
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
  const currentAccount = useAccountsStore((s) => s.currentAccount);
  const [inputValue, setInputValue] = useState(messageToPrefill);
  const [replyingToMessage, setReplyingToMessage] =
    useState<MessageToDisplay | null>(null);
  const [mediaPreview, setMediaPreview] = useState(mediaPreviewToPrefill);
  useState<MessageToDisplay | null>(null);
  const [isSending, setIsSending] = useState(false);

  const assetRef = useRef<ImagePicker.ImagePickerAsset | undefined>(undefined);

  const sendButtonType = useMemo(
    () => getSendButtonType(inputValue),
    [inputValue]
  );
  const canSend = inputValue.length > 0 || !!mediaPreview?.mediaURI;

  useEffect(() => {
    if (!mediaPreviewRef.current) {
      mediaPreviewRef.current = { currentValue: mediaPreviewToPrefill };
    }
  }, [mediaPreviewRef, mediaPreviewToPrefill]);

  useLayoutEffect(() => {
    const messageToPrefillHeight =
      messageToPrefill.split("\n").length * LINE_HEIGHT;
    inputHeightAnimation.value =
      messageToPrefillHeight +
      (mediaPreviewToPrefill
        ? DEFAULT_MEDIA_PREVIEW_HEIGHT + MEDIA_PREVIEW_PADDING
        : 0);
  }, [messageToPrefill, mediaPreviewToPrefill, inputHeightAnimation]);

  const mediaPreviewAnimation = useSharedValue(mediaPreviewToPrefill ? 1 : 0);

  const inputContainerRef = useRef<View>(null);

  const inputHeightAnimatedStyle = useAnimatedStyle(() => {
    return {
      maxHeight: inputHeightAnimation.value,
    };
  });

  const mediaPreviewAnimatedStyle = useAnimatedStyle(() => {
    const scale = mediaPreviewAnimation.value;
    return {
      transform: [{ scale }],
      opacity: scale,
    };
  });

  const updateInputHeight = useCallback(
    (newHeight: number, animate: boolean = true) => {
      const targetHeight = Math.min(newHeight, MAX_INPUT_HEIGHT);
      if (animate) {
        setTimeout(() => {
          inputHeightAnimation.value = withSpring(targetHeight, SPRING_CONFIG);
        }, 100);
      } else {
        inputHeightAnimation.value = targetHeight;
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [inputHeightAnimation]
  );

  const [previousNumberOfLines, setPreviousNumberOfLines] = useState(1);

  const handleTextContentSizeChange = useCallback(
    (event: { nativeEvent: { contentSize: { height: number } } }) => {
      const textContentHeight = event.nativeEvent.contentSize.height;
      const numberOfLines = Math.ceil(textContentHeight / LINE_HEIGHT);
      const newTextHeight = (numberOfLines - 1) * LINE_HEIGHT;
      const currentMediaPreviewHeight = mediaPreview
        ? MEDIA_PREVIEW_PADDING + DEFAULT_MEDIA_PREVIEW_HEIGHT
        : 0;
      const newHeight =
        currentMediaPreviewHeight +
        (numberOfLines !== previousNumberOfLines ? newTextHeight : 0);
      inputHeightAnimation.value = newHeight;
      setPreviousNumberOfLines(numberOfLines);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [updateInputHeight, mediaPreview, inputHeightAnimation]
  );

  const animateAttachmentClosed = useCallback(() => {
    const newTextHeight = (previousNumberOfLines - 1) * LINE_HEIGHT;
    const currentMediaPreviewHeight = 0;
    const newHeight = newTextHeight + currentMediaPreviewHeight;

    requestAnimationFrame(() => {
      updateInputHeight(newHeight, true);
      mediaPreviewAnimation.value = withSpring(0, SPRING_CONFIG);
    });
  }, [mediaPreviewAnimation, previousNumberOfLines, updateInputHeight]);

  const handleAttachmentClosed = useCallback(() => {
    animateAttachmentClosed();

    setTimeout(() => {
      setMediaPreview(null);
    }, 300);

    if (mediaPreviewRef.current) {
      mediaPreviewRef.current.currentValue = null;
    }
    assetRef.current = undefined;
  }, [mediaPreviewRef, animateAttachmentClosed]);

  const handleAttachmentSelected = useCallback(
    async (uri: string | null, status: AttachmentSelectedStatus) => {
      if (uri) {
        setMediaPreview({ mediaURI: uri, status });
        if (mediaPreviewRef.current) {
          mediaPreviewRef.current.currentValue = { mediaURI: uri, status };
        }

        assetRef.current = { uri } as ImagePicker.ImagePickerAsset;
        const currentContentHeight = inputHeightAnimation.value;
        const newHeight =
          currentContentHeight +
          DEFAULT_MEDIA_PREVIEW_HEIGHT +
          MEDIA_PREVIEW_PADDING;
        requestAnimationFrame(() => {
          updateInputHeight(newHeight, true);
        });

        setTimeout(() => {
          mediaPreviewAnimation.value = withSpring(1, SPRING_CONFIG);
        }, 250);
      }
    },
    [
      mediaPreviewRef,
      mediaPreviewAnimation,
      inputHeightAnimation,
      updateInputHeight,
    ]
  );

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
    if (mediaPreviewRef.current) {
      mediaPreviewRef.current.currentValue = mediaPreview;
    }
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

  // We use an event emitter to receive actions to fill the input value
  // from outside. This enable us to keep a very small re-rendering
  // by creating the inputValue in the lowest component, this one
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
    converseEventEmitter.on(
      "setCurrentConversationMediaPreviewValue",
      setMediaPreview
    );
    return () => {
      converseEventEmitter.off(
        "setCurrentConversationMediaPreviewValue",
        setMediaPreview
      );
    };
  }, []);

  const onValidate = useCallback(async () => {
    const waitForUploadToComplete = () => {
      return new Promise<void>((resolve) => {
        const interval = setInterval(() => {
          if (mediaPreviewRef.current?.currentValue?.status === "uploaded") {
            clearInterval(interval);
            resolve();
          }
        }, 100);
      });
    };
    if (conversation) {
      if (mediaPreviewRef.current?.currentValue) {
        mediaPreviewRef.current.currentValue = {
          ...mediaPreviewRef.current.currentValue,
          status: "sending",
        };
        setMediaPreview((prev) =>
          prev ? { ...prev, status: "sending" } : null
        );

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
        } else {
          sendMessage({
            conversation,
            content: inputValue,
            contentType: "xmtp.org/text:1.0",
          });
        }
        setInputValue("");
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
            blurOnSubmit={isDesktop}
            onSubmitEditing={handleSubmit}
            onChangeText={handleInputChange}
            onKeyPress={handleKeyPress}
            onFocus={() => {
              inputIsFocused.current = true;
            }}
            onBlur={() => {
              inputIsFocused.current = false;
            }}
            onContentSizeChange={handleTextContentSizeChange}
            multiline
            ref={handleInputRef}
            placeholder="Message"
            placeholderTextColor={
              Platform.OS === "android"
                ? textSecondaryColor(colorScheme)
                : actionSecondaryColor(colorScheme)
            }
          />
        </View>
        <TouchableOpacity
          onPress={onValidate}
          activeOpacity={canSend ? 0.4 : 0.6}
          style={[styles.sendButtonContainer, { opacity: canSend ? 1 : 0.6 }]}
        >
          {renderSendButton()}
        </TouchableOpacity>
      </View>
    </View>
  );

  function handleSubmit() {
    onValidate();
    // But we still want to refocus on Dekstop when we
    // hit Enter so let's force it
    if (isDesktop) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }

  function handleInputChange(text: string) {
    inputIsFocused.current = true;
    setInputValue(text);
  }

  function handleKeyPress(event: any) {
    if (
      Platform.OS === "web" &&
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

  function handleInputRef(r: any) {
    if (r && !inputRef.current) {
      inputRef.current = r as TextInputWithValue;
      inputRef.current.currentValue = messageToPrefill;
    }
  }

  function renderSendButton() {
    if (colorScheme === "dark") {
      return sendButtonType === "DEFAULT" ? (
        <SendButtonDefaultDark
          width={36}
          height={36}
          style={styles.sendButton}
        />
      ) : (
        <SendButtonHigher width={36} height={36} style={styles.sendButton} />
      );
    } else {
      return sendButtonType === "DEFAULT" ? (
        <SendButtonDefaultLight
          width={36}
          height={36}
          style={styles.sendButton}
        />
      ) : (
        <SendButtonHigher width={36} height={36} style={styles.sendButton} />
      );
    }
  }
}

const useStyles = () => {
  const colorScheme = useColorScheme();
  return StyleSheet.create({
    chatInputWrapper: {
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "transparent",
    },
    replyToMessagePreview: {
      paddingHorizontal: 10,
      paddingVertical: 8,
      borderTopWidth: 0.5,
      borderTopColor: itemSeparatorColor(colorScheme),
      backgroundColor: chatInputBackgroundColor(colorScheme),
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
      lineHeight: 22,
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
