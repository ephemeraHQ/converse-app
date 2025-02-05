import { Avatar } from "@/components/Avatar";
import { Center } from "@/design-system/Center";
import { Text } from "@/design-system/Text";
import { useAppTheme } from "@/theme/useAppTheme";
import React from "react";
import { Pressable, StyleProp, ViewStyle } from "react-native";

type ChipProps = {
  name: string;
  avatarUri?: string;
  isSelected?: boolean;
  onPress?: () => void;
  size?: "sm" | "md";
};

export function Chip({
  name,
  avatarUri,
  isSelected,
  onPress,
  size = "sm",
}: ChipProps) {
  const { theme } = useAppTheme();

  const styles = useChipStyles();

  return (
    <Pressable
      onPress={onPress}
      style={[styles.$container, isSelected && styles.$selectedContainer]}
    >
      <Center
        // {...debugBorder()}
        style={styles.$content}
      >
        <Avatar uri={avatarUri} name={name} size={theme.avatarSize.xs} />
        <Text preset={size === "sm" ? "small" : "body"}>{name}</Text>
      </Center>
    </Pressable>
  );
}

export function useChipStyles() {
  const { theme } = useAppTheme();

  const $container = {
    borderRadius: theme.spacing.xs,
    borderWidth: theme.borderWidth.sm,
    borderColor: theme.colors.border.subtle,
    backgroundColor: theme.colors.background.surface,
    paddingVertical: theme.spacing.xxs - theme.borderWidth.sm * 2,
    paddingHorizontal: theme.spacing.xs,
  } satisfies StyleProp<ViewStyle>;

  const $content = {
    columnGap: theme.spacing.xxxs,
    height: theme.spacing.md,
  } satisfies StyleProp<ViewStyle>;

  return {
    // Constants calculated using the style values
    constants: {
      chipHeight: $container.paddingVertical * 2 + $content.height,
    },
    // Styles with $ prefix
    $container,
    $selectedContainer: {
      backgroundColor: theme.colors.fill.minimal,
      borderColor: theme.colors.fill.minimal,
    },
    $content,
  } as const;
}
