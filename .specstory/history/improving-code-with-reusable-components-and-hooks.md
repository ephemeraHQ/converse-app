## SpecStory

## Improving Code with Reusable Components and Hooks (11/18/2024, 1:15:02 PM)

_**User**_

can you make this better? MAybe some reuable hooks for example. Reuable components. Try to isolate things and use stuff from the useConversationContext in each comopnent

---

_**Assistant**_

Certainly! To improve the code, we can refactor it by creating reusable hooks and components. This will help in isolating logic and making the code more modular. Here's a refactored version focusing on creating hooks for conversation context and reusable components for the chat input and media preview.

### Refactored Code

#### 1. Create Reusable Hooks

Let's create hooks to encapsulate the logic for managing conversation context and media preview.

```typescript:hooks/useConversation.ts
import { useConversationContext } from "../../../utils/conversation";

export function useConversationRefs() {
  const inputRef = useConversationContext("inputRef");
  const topic = useConversationContext("topic");
  const messageToPrefill = useConversationContext("messageToPrefill");
  const mediaPreviewRef = useConversationContext("mediaPreviewRef");
  const mediaPreviewToPrefill = useConversationContext("mediaPreviewToPrefill");

  return {
    inputRef,
    topic,
    messageToPrefill,
    mediaPreviewRef,
    mediaPreviewToPrefill,
  };
}
```

#### 2. Create Reusable Components

Let's create a component for the media preview and the chat input field.

```typescript:components/Chat/Input/MediaPreview.tsx
import React from "react";
import { View } from "react-native";
import Animated, { useAnimatedStyle, withSpring } from "react-native-reanimated";
import SendAttachmentPreview from "../Attachment/SendAttachmentPreview";
import { MediaPreview } from "../../../data/store/chatStore";

type MediaPreviewProps = {
  mediaPreview: MediaPreview | null;
  onClose: () => void;
  mediaPreviewAnimation: Animated.SharedValue<number>;
};

export function MediaPreviewComponent({
  mediaPreview,
  onClose,
  mediaPreviewAnimation,
}: MediaPreviewProps) {
  const mediaPreviewAnimatedStyle = useAnimatedStyle(() => {
    const scale = mediaPreviewAnimation.value;
    return {
      transform: [{ scale }],
      opacity: scale,
    };
  });

  if (!mediaPreview?.mediaURI) return null;

  return (
    <Animated.View style={mediaPreviewAnimatedStyle}>
      <SendAttachmentPreview
        currentAttachmentMediaURI={mediaPreview.mediaURI}
        onClose={onClose}
        error={mediaPreview.status === "error"}
        isLoading={mediaPreview.status === "uploading"}
        scale={mediaPreviewAnimation}
        isLandscape={
          !!(
            mediaPreview.dimensions?.height &&
            mediaPreview.dimensions?.width &&
            mediaPreview.dimensions.width > mediaPreview.dimensions.height
          )
        }
      />
    </Animated.View>
  );
}
```

#### 3. Refactor the Main Component

Now, let's refactor the main component to use these hooks and components.

```typescript:components/Chat/Input/InputDumb.tsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Platform, StyleSheet, TextInput, View, useColorScheme } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import { useConversationRefs } from "../../../hooks/useConversation";
import { MediaPreviewComponent } from "./MediaPreview";
import AddAttachmentButton from "../Attachment/AddAttachmentButton";
import { SendButton } from "./SendButton";
import ChatInputReplyPreview from "@components/Chat/Input/InputReplyPreview";
import { converseEventEmitter } from "../../../utils/events";
import { AttachmentSelectedStatus } from "../../../utils/media";
import { TextInputWithValue } from "../../../utils/str";
import { RemoteAttachmentContent } from "@xmtp/react-native-sdk";

const LINE_HEIGHT = 22;
const MAX_INPUT_HEIGHT = 500;
const REPLYING_TO_MESSAGE_HEIGHT = 60;
const HEIGHT_SPRING_CONFIG = { damping: 12, mass: 0.3, stiffness: 300, overshootClamping: true, restSpeedThreshold: 0.005, restDisplacementThreshold: 0.005 };
const PREVIEW_SPRING_CONFIG = { damping: 15, mass: 0.5, stiffness: 200, overshootClamping: false, restSpeedThreshold: 0.01, restDisplacementThreshold: 0.01 };

type ChatInputProps = {
  inputHeight: Animated.SharedValue<number>;
  onSend: (payload: { text?: string; referencedMessageId?: string; attachment?: RemoteAttachmentContent }) => Promise<void>;
};

export function ChatInputDumb({ inputHeight, onSend }: ChatInputProps) {
  const { inputRef, messageToPrefill, mediaPreviewRef, mediaPreviewToPrefill } = useConversationRefs();
  const colorScheme = useColorScheme();
  const styles = useStyles();

  const [inputValue, setInputValue] = useState(messageToPrefill);
  const [replyingToMessageId, setReplyingToMessageId] = useState<string | null>(null);
  const replyingToMessageRef = useRef<string | null>(null);
  const [mediaPreview, setMediaPreview] = useState(mediaPreviewToPrefill);
  const preparedAttachmentMessageRef = useRef<RemoteAttachmentContent | null>(null);
  const isAnimatingHeightRef = useRef(false);
  const numberOfLinesRef = useRef(1);

  const sendButtonType = useMemo(() => (inputValue.match(/\bhigher\b/gi) ? "HIGHER" : "DEFAULT"), [inputValue]);
  const canSend = inputValue.length > 0 || !!mediaPreview?.mediaURI;

  useEffect(() => {
    if (!mediaPreviewRef.current) {
      mediaPreviewRef.current = mediaPreviewToPrefill;
    }
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
    replyingToMessageRef.current = replyingToMessageId;
  }, [replyingToMessageId]);

  useEffect(() => {
    converseEventEmitter.on("triggerReplyToMessage", (messageId: string) => {
      if (inputRef.current) {
        inputRef.current?.focus();
      }
      setReplyingToMessageId(messageId);
      replyingToMessageRef.current = messageId;
    });
    return () => {
      converseEventEmitter.off("triggerReplyToMessage");
    };
  }, [inputRef]);

  useEffect(() => {
    converseEventEmitter.on("setCurrentConversationInputValue", setInputValue);
    return () => {
      converseEventEmitter.off("setCurrentConversationInputValue", setInputValue);
    };
  }, []);

  useEffect(() => {
    const handleMediaPreviewChange = (newMediaPreview: MediaPreview) => {
      setMediaPreview(newMediaPreview);
    };
    converseEventEmitter.on("setCurrentConversationMediaPreviewValue", handleMediaPreviewChange);
    return () => {
      converseEventEmitter.off("setCurrentConversationMediaPreviewValue", handleMediaPreviewChange);
    };
  }, []);

  const calculateInputHeight = useCallback(() => {
    const textContentHeight = (numberOfLinesRef.current - 1) * LINE_HEIGHT;
    const isLandscape = mediaPreviewRef.current?.dimensions?.height && mediaPreviewRef.current?.dimensions?.width && mediaPreviewRef.current.dimensions.width > mediaPreviewRef.current.dimensions.height;
    const mediaPreviewHeight = mediaPreviewRef.current && (mediaPreviewRef.current.status === "picked" || mediaPreviewRef.current.status === "uploading" || mediaPreviewRef.current.status === "uploaded") ? (isLandscape ? 90 : 120 + (Platform.OS === "android" ? 9 : 14)) : 0;
    const replyingToMessageHeight = replyingToMessageRef.current ? REPLYING_TO_MESSAGE_HEIGHT : 0;
    return Math.min(textContentHeight + mediaPreviewHeight + replyingToMessageHeight, MAX_INPUT_HEIGHT);
  }, [numberOfLinesRef.current, replyingToMessageRef.current, mediaPreviewRef.current?.mediaURI]);

  const updateInputHeightWithAnimation = useCallback((newHeight: number) => {
    if (isAnimatingHeightRef.current || inputHeight.value === newHeight) {
      return;
    }
    isAnimatingHeightRef.current = true;
    requestAnimationFrame(() => {
      inputHeight.value = withSpring(newHeight, HEIGHT_SPRING_CONFIG);
      isAnimatingHeightRef.current = false;
    });
  }, [inputHeight]);

  useEffect(() => {
    updateInputHeightWithAnimation(calculateInputHeight());
  }, [calculateInputHeight, updateInputHeightWithAnimation]);

  const mediaPreviewAnimation = useSharedValue(mediaPreviewToPrefill ? 1 : 0);

  const inputHeightAnimatedStyle = useAnimatedStyle(() => {
    return {
      maxHeight: inputHeight.value,
    };
  });

  const handleTextContentSizeChange = useCallback((event: { nativeEvent: { contentSize: { height: number } } }) => {
    const textContentHeight = event.nativeEvent.contentSize.height;
    const newNumberOfLines = Math.ceil(textContentHeight / LINE_HEIGHT);

    if (newNumberOfLines !== numberOfLinesRef.current) {
      numberOfLinesRef.current = newNumberOfLines;
      inputHeight.value = calculateInputHeight();
    }
  }, [calculateInputHeight, inputHeight]);

  const handleAttachmentClosed = useCallback(() => {
    mediaPreviewRef.current = null;
    mediaPreviewAnimation.value = withSpring(0, PREVIEW_SPRING_CONFIG);

    updateInputHeightWithAnimation(calculateInputHeight());
    setTimeout(() => {
      setMediaPreview(null);
      preparedAttachmentMessageRef.current = null;
    }, 300);
  }, [mediaPreviewRef, calculateInputHeight, updateInputHeightWithAnimation, mediaPreviewAnimation]);

  const handleAttachmentSelection = (status: AttachmentSelectedStatus, attachment: SelectedAttachment) => {
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
        await onSend({
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
      await onSend({
        text: messageToSend.content,
        ...(messageToSend.referencedMessageId && {
          referencedMessageId: messageToSend.referencedMessageId,
        }),
      });
    }

    converseEventEmitter.emit("scrollChatToMessage", {
      index: 0,
    });
  }, [mediaPreviewRef, inputValue, handleAttachmentClosed, onSend, replyingToMessageId]);

  const inputIsFocused = useRef(false);

  return (
    <View style={styles.chatInputWrapper}>
      {replyingToMessageId && (
        <View style={styles.replyToMessagePreview}>
          <ChatInputReplyPreview
            replyingToMessageId={replyingToMessageId}
            onDismiss={() => {
              setReplyingToMessageId(null);
              replyingToMessageRef.current = null;
            }}
          />
        </View>
      )}
      <View style={styles.chatInputContainer}>
        <AddAttachmentButton onSelectionStatusChange={handleAttachmentSelection} />
        <View style={styles.chatInput}>
          <Animated.View style={inputHeightAnimatedStyle}>
            <MediaPreviewComponent mediaPreview={mediaPreview} onClose={handleAttachmentClosed} mediaPreviewAnimation={mediaPreviewAnimation} />
          </Animated.View>
          <TextInput
            style={styles.chatInputField}
            value={inputValue}
            onSubmitEditing={onValidate}
            onChangeText={(t: string) => {
              inputIsFocused.current = true;
              setInputValue(t);
            }}
            onKeyPress={(event: any) => {
              if (event.nativeEvent.key === "Enter" && !event.altKey && !event.metaKey && !event.shiftKey) {
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
            placeholderTextColor={Platform.OS === "android" ? textSecondaryColor(colorScheme) : actionSecondaryColor(colorScheme)}
          />
        </View>
        <SendButton canSend={canSend} onPress={onValidate} sendButtonType={sendButtonType} />
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
    chatInputField: {
      width: "100%",
      color: textPrimaryColor(colorScheme),
      fontSize: Platform.OS === "android" ? 16 : 17,
      paddingHorizontal: 12,
      lineHeight: LINE_HEIGHT,
      paddingVertical: Platform.OS === "android" ? 4 : 7,
      zIndex: 1,
    },
  });
}
```

### Explanation

1. **Reusable Hooks**: The `useConversationRefs` hook encapsulates the logic for accessing conversation context, making it easier to manage and reuse.

2. **Reusable Components**: The `MediaPreviewComponent` is a separate component that handles the rendering of the media preview, making the main component cleaner and more focused.

3. **Code Organization**: The refactored code is more modular, with clear separation of concerns, making it easier to maintain and extend.

This refactoring should make the codebase more maintainable and easier to understand.

---



---

