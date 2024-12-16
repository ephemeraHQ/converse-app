import { SendAttachmentPreview } from "@/features/conversation/conversation-composer/conversation-composer-send-attachment-preview";
import { ISendMessageParams } from "@/features/conversation/hooks/use-send-message";
import { saveAttachmentLocally } from "@/utils/attachment/attachment.utils";
import { HStack } from "@design-system/HStack";
import { IconButton } from "@design-system/IconButton/IconButton";
import { textSizeStyles } from "@design-system/Text/Text.styles";
import { AnimatedVStack, VStack } from "@design-system/VStack";
import { SICK_DAMPING, SICK_STIFFNESS } from "@theme/animations";
import { useAppTheme } from "@theme/useAppTheme";
import { sentryTrackError } from "@utils/sentry";
import React, { memo, useCallback, useEffect, useRef } from "react";
import { Platform, TextInput as RNTextInput } from "react-native";
import { useAnimatedStyle, withSpring } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AddAttachmentButton } from "./conversation-composer-add-attachment-button";
import { ReplyPreview } from "./conversation-composer-reply-preview";
import {
  useConversationComposerStore,
  useConversationComposerStoreContext,
} from "./conversation-composer.store-context";

type IComposerProps = {
  onSend: (args: ISendMessageParams) => Promise<void>;
};

export const Composer = memo(function Composer(props: IComposerProps) {
  const { onSend } = props;

  const { theme } = useAppTheme();
  const store = useConversationComposerStore();

  const send = useCallback(async () => {
    const mediaPreview = store.getState().composerMediaPreview;
    const replyingToMessageId = store.getState().replyingToMessageId;

    function waitUntilMediaPreviewIsUploaded() {
      return new Promise((resolve, reject) => {
        const startTime = Date.now();
        const checkStatus = () => {
          if (!mediaPreview?.status) {
            resolve(true);
            return;
          }
          if (mediaPreview.status === "uploaded") {
            resolve(true);
            return;
          }
          if (Date.now() - startTime > 10000) {
            reject(new Error("Media upload timeout after 10 seconds"));
            return;
          }
          setTimeout(checkStatus, 200);
        };
        checkStatus();
      });
    }

    if (mediaPreview) {
      if (mediaPreview?.status === "uploading") {
        await waitUntilMediaPreviewIsUploaded();
      }

      store.getState().updateMediaPreviewStatus("sending");

      try {
        const mediaPreview = store.getState().composerMediaPreview;
        if (mediaPreview) {
          await saveAttachmentLocally(mediaPreview);
        }
      } catch (error) {
        sentryTrackError(error);
      }

      const uploadedRemoteAttachment =
        store.getState().composerUploadedAttachment;

      if (!uploadedRemoteAttachment) {
        throw new Error("Something went wrong while uploading attachment");
      }

      store.getState().setComposerMediaPreview(null);
      store.getState().setComposerUploadedAttachment(null);

      await onSend({
        content: {
          remoteAttachment: uploadedRemoteAttachment,
        },
        ...(replyingToMessageId && {
          referencedMessageId: replyingToMessageId,
        }),
      });
    }

    const inputValue = store.getState().inputValue;

    store.getState().reset();

    if (inputValue.length > 0) {
      await onSend({
        content: {
          text: inputValue,
        },
        ...(replyingToMessageId && {
          referencedMessageId: replyingToMessageId,
        }),
      });
    }

    // TODO: Fix with function in context
    // converseEventEmitter.emit("scrollChatToMessage", {
    //   index: 0,
    // });
  }, [onSend, store]);

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
});

const SendButton = memo(function SendButton(props: { onPress: () => void }) {
  const { onPress } = props;

  const { theme } = useAppTheme();

  const mediaPreview = useConversationComposerStoreContext(
    (state) => state.composerMediaPreview
  );
  const composerInputValue = useConversationComposerStoreContext(
    (state) => state.inputValue
  );

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

const AttachmentsPreview = memo(function AttachmentsPreview() {
  const { theme } = useAppTheme();

  const mediaPreview = useConversationComposerStoreContext(
    (state) => state.composerMediaPreview
  );

  const store = useConversationComposerStore();

  const handleAttachmentClosed = useCallback(() => {
    store.getState().setComposerMediaPreview(null);
  }, [store]);

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

  const store = useConversationComposerStore();
  const inputDefaultValue = store.getState().inputValue;

  const handleChangeText = useCallback(
    (text: string) => {
      store.setState((state) => ({
        ...state,
        inputValue: text,
      }));
    },
    [store]
  );

  // If we clear the input (i.e after sending a message)
  // we need to clear the input value in the text input
  // Doing this since we are using a uncontrolled component
  useEffect(() => {
    const unsubscribe = store.subscribe((state, prevState) => {
      if (prevState.inputValue && !state.inputValue) {
        inputRef.current?.clear();
      }
    });

    return () => unsubscribe();
  }, [store]);

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
