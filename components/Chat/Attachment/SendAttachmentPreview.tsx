import {
  setAndroidColors,
  setAndroidSystemColor,
} from "@styles/colors/helpers";
import { Image } from "expo-image";
import { useEffect } from "react";
import { StyleSheet, View, useColorScheme } from "react-native";

import { IconButton } from "@design-system/IconButton/IconButton";
import { AnimatedVStack, VStack } from "@design-system/VStack";
import { useAppTheme } from "@theme/useAppTheme";
import ActivityIndicator from "../../ActivityIndicator/ActivityIndicator";
import { FadeIn, FadeOut, Keyframe } from "react-native-reanimated";

type SendAttachmentPreviewProps = {
  uri: string;
  onClose: () => void;
  isLoading: boolean;
  error: boolean;
  isLandscape: boolean;
};

export function SendAttachmentPreview({
  uri,
  onClose,
  isLoading,
  error,
  isLandscape,
}: SendAttachmentPreviewProps) {
  const colorScheme = useColorScheme();
  const { theme } = useAppTheme();

  useEffect(() => {
    setAndroidSystemColor("#000000");
    return () => {
      setAndroidColors(colorScheme);
    };
  }, [colorScheme]);

  return (
    <AnimatedVStack
      entering={theme.animation.reanimatedFadeInSpring}
      style={{
        borderRadius: theme.borderRadius.sm,
        position: "relative",
        overflow: "hidden",
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
          borderColor: theme.colors.background.surface,
          borderRadius: 100,
        }}
      >
        <IconButton size="sm" iconName="xmark" onPress={onClose} />
      </AnimatedVStack>
    </AnimatedVStack>
  );
}
