import { HStack } from "@design-system/HStack"
import { IconButton } from "@design-system/IconButton/IconButton"
import { AnimatedVStack, VStack } from "@design-system/VStack"
import { SICK_DAMPING, SICK_STIFFNESS } from "@theme/animations"
import React, { memo, useCallback } from "react"
import { StyleSheet } from "react-native"
import { useAnimatedStyle, withSpring } from "react-native-reanimated"
import { ActivityIndicator } from "@/design-system/activity-indicator"
import { Image } from "@/design-system/image"
import { useAppTheme } from "@/theme/use-app-theme"
import {
  useConversationComposerStore,
  useConversationComposerStoreContext,
} from "./conversation-composer.store-context"

export const ConversationComposerAttachmentPreview = memo(
  function ConversationComposerAttachmentPreview() {
    const { theme } = useAppTheme()

    const mediaPreviews = useConversationComposerStoreContext(
      (state) => state.composerMediaPreviews,
    )

    const store = useConversationComposerStore()

    const handleAttachmentClosed = useCallback(
      (mediaURI: string) => {
        store.getState().removeComposerMediaPreview(mediaURI)
      },
      [store],
    )

    const maxHeight = 120

    const containerAS = useAnimatedStyle(() => {
      return {
        height: withSpring(mediaPreviews.length > 0 ? maxHeight : 0, {
          damping: SICK_DAMPING,
          stiffness: SICK_STIFFNESS,
        }),
      }
    }, [mediaPreviews.length, maxHeight])

    return (
      <AnimatedVStack style={containerAS}>
        {mediaPreviews.length > 0 && (
          <HStack
            style={{
              flex: 1,
              paddingHorizontal: 6, // Value from Figma
              paddingTop: 6, // Value from Figma
              columnGap: theme.spacing.xxs,
            }}
          >
            {mediaPreviews.map((mediaPreview) => {
              if (!mediaPreview) return null

              const isLandscape = !!(
                mediaPreview.dimensions?.height &&
                mediaPreview.dimensions?.width &&
                mediaPreview.dimensions.width > mediaPreview.dimensions.height
              )

              return (
                <AttachmentPreview
                  key={mediaPreview.mediaURI}
                  uri={mediaPreview.mediaURI}
                  onClose={() => handleAttachmentClosed(mediaPreview.mediaURI)}
                  error={mediaPreview.status === "error"}
                  isLoading={mediaPreview.status === "uploading"}
                  isLandscape={isLandscape}
                />
              )
            })}
          </HStack>
        )}
      </AnimatedVStack>
    )
  },
)

type SendAttachmentPreviewProps = {
  uri: string
  onClose: () => void
  isLoading: boolean
  error: boolean
  isLandscape: boolean
}

function AttachmentPreview({
  uri,
  onClose,
  isLoading,
  error,
  isLandscape,
}: SendAttachmentPreviewProps) {
  const { theme } = useAppTheme()

  return (
    <AnimatedVStack
      entering={theme.animation.reanimatedFadeInSpring}
      style={{
        borderRadius: theme.borderRadius.sm,
        position: "relative",
        overflow: "hidden",
        borderWidth: theme.borderWidth.sm,
        borderColor: theme.colors.border.edge,
        ...(isLandscape
          ? {
              aspectRatio: 1.33,
            }
          : {
              aspectRatio: 0.75,
            }),
      }}
    >
      <VStack
        style={{
          position: "relative",
        }}
      >
        <Image
          source={{ uri: uri }}
          style={{
            width: "100%",
            height: "100%",
          }}
          contentFit="cover"
        />
        {isLoading && (
          <VStack
            style={{
              ...StyleSheet.absoluteFillObject,
              backgroundColor: "rgba(0, 0, 0, 0.5)",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <ActivityIndicator
              size="small"
              color="#ffffff"
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: [{ translateX: -12 }, { translateY: -12 }],
              }}
            />
          </VStack>
        )}
      </VStack>
      <AnimatedVStack
        style={{
          zIndex: 1,
          position: "absolute",
          right: theme.spacing.xxs,
          top: theme.spacing.xxs,
          borderWidth: theme.borderWidth.sm,
          borderColor: theme.colors.background.surfaceless,
          borderRadius: 100,
        }}
      >
        <IconButton size="sm" iconName="xmark" onPress={onClose} />
      </AnimatedVStack>
    </AnimatedVStack>
  )
}
