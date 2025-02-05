import { SendAttachmentPreview } from "@/features/conversation/conversation-composer/conversation-composer-send-attachment-preview";
import { HStack } from "@design-system/HStack";
import { AnimatedVStack } from "@design-system/VStack";
import { SICK_DAMPING, SICK_STIFFNESS } from "@theme/animations";
import { useAppTheme } from "@theme/useAppTheme";
import React, { memo, useCallback } from "react";
import { useAnimatedStyle, withSpring } from "react-native-reanimated";
import {
  useConversationComposerStore,
  useConversationComposerStoreContext,
} from "./conversation-composer.store-context";

export const ConversationComposerAttachmentPreview = memo(
  function ConversationComposerAttachmentPreview() {
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
  }
);
