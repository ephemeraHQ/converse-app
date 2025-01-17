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
  const { themed } = useAppTheme();

  return (
    <Pressable
      onPress={onPress}
      style={[themed($container), isSelected && themed($selectedContainer)]}
    >
      <Avatar uri={avatarUri} name={name} size={16} style={themed($avatar)} />
      <Text
        preset="formLabel"
        style={[
          themed($text) as TextStyle,
          isSelected && (themed($selectedText) as TextStyle),
        ]}
        numberOfLines={1}
      >
        {name}
      </Text>
    </Pressable>
  );
}

const $container: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "center",
  paddingVertical: 4,
  paddingLeft: 10,
  paddingRight: 8,
  gap: 4,
  minHeight: 36,
  borderRadius: 12,
  borderWidth: 1,
  borderColor: colors.border.subtle,
  backgroundColor: colors.background.surface,
});

const $selectedContainer: ThemedStyle<ViewStyle> = ({ colors }) => ({
  backgroundColor: colors.background.blurred,
  borderColor: colors.border.primary,
});

const $avatar: ThemedStyle<ViewStyle> = () => ({
  width: 16,
  height: 16,
});

const $text: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.text.primary,
  lineHeight: 18,
  fontSize: 14,
});

const $selectedText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.text.primary,
});
