/**
 * A chip component that displays an avatar and text
 * Used for showing selected users in search/selection contexts
 *
 * @param {object} props Component props
 * @param {string} props.name Display name for the chip
 * @param {string} props.avatarUri Optional avatar image URI
 * @param {boolean} props.isSelected Whether the chip is in selected state
 * @param {() => void} props.onPress Called when chip is pressed
 */

import React from "react";
import { Pressable, ViewStyle, TextStyle } from "react-native";
import { ThemedStyle, useAppTheme } from "@/theme/useAppTheme";
import { Text } from "@/design-system/Text";
import { Avatar } from "@/components/Avatar";

type ChipProps = {
  name: string;
  avatarUri?: string;
  isSelected?: boolean;
  onPress?: () => void;
};

export function Chip({ name, avatarUri, isSelected, onPress }: ChipProps) {
  const { themed, theme } = useAppTheme();

  return (
    <Pressable
      onPress={onPress}
      style={[themed($container), isSelected && themed($selectedContainer)]}
    >
      <Avatar uri={avatarUri} name={name} size={theme.avatarSize.xs} />
      <Text preset="small">{name}</Text>
    </Pressable>
  );
}

const $container: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "center",
  paddingVertical: spacing.xxxs,
  paddingLeft: spacing.xs,
  paddingRight: spacing.xxs,
  gap: spacing.xxxs,
  minHeight: spacing.container.large,
  borderRadius: spacing.xs,
  borderWidth: 1,
  borderColor: colors.border.subtle,
  backgroundColor: colors.background.surface,
});

const $selectedContainer: ThemedStyle<ViewStyle> = ({ colors }) => ({
  backgroundColor: colors.background.blurred,
  borderColor: colors.border.primary,
});

const $text: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.text.primary,
  lineHeight: 18,
  fontSize: 14,
});
