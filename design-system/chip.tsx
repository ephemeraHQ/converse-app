/**
 * A Chip component that displays an avatar and text in a pill-shaped
 * container. Used for user selection and filtering.
 *
 * @see https://www.figma.com/design/p6mt4tEDltI4mypD3TIgUk/Converse-App?node-id=5026-27031
 *
 * @example
 * // Basic usage with avatar
 * <Chip
 *   text="Naomi"
 *   avatarUrl="avatar.png"
 *   onPress={() => {}}
 * />
 *
 * @example
 * // Active state without avatar
 * <Chip
 *   text="All 5"
 *   isActive={true}
 *   onPress={() => {}}
 * />
 */

import { ViewStyle, TextStyle, ImageStyle } from "react-native";
import { TouchableOpacity } from "./TouchableOpacity";
import { HStack } from "./HStack";
import { Text } from "./Text";
import { ThemedStyle, useAppTheme } from "@/theme/useAppTheme";
import { Avatar } from "@/components/Avatar";
import { debugBorder } from "@/utils/debug-style";

export type IChipProps = {
  text: string;
  avatarUrl?: string;
  isActive?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
};

export function Chip({
  text,
  avatarUrl,
  isActive,
  onPress,
  style,
}: IChipProps) {
  const { themed, theme } = useAppTheme();

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[themed($chip), isActive && themed($chipActive), style]}
    >
      <HStack style={themed($chipContainer)}>
        {avatarUrl && (
          <Avatar size={theme.avatarSize.xs} uri={avatarUrl} name={text} />
        )}
        <Text style={themed(isActive ? $chipTextActive : $chipText)}>
          {text}
        </Text>
      </HStack>
    </TouchableOpacity>
  );
}

const $chip: ThemedStyle<ViewStyle> = ({
  spacing,
  borderRadius,
  borderWidth,
  colors,
}) => ({
  borderRadius: borderRadius.sm,
  borderWidth: borderWidth.sm,
  borderColor: colors.border.subtle,
  paddingVertical: spacing.xxs,
  paddingHorizontal: spacing.xs,
  minHeight: 36,
  //   ...debugBorder("orange"),
});

const $chipActive: ThemedStyle<ViewStyle> = ({ colors }) => ({
  backgroundColor: colors.border.subtle,
});

const $chipContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  alignItems: "center",
  gap: spacing.xxs,
});

const $avatar: ThemedStyle<ImageStyle> = ({ borderRadius }) => ({
  width: 16,
  height: 16,
  borderRadius: borderRadius.message.bubble,
});

const $chipText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.text.secondary,
});

const $chipTextActive: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.text.primary,
});
