import { ViewStyle, TextStyle } from "react-native";

import { ThemedStyle } from "@/theme/useAppTheme";
import { textSizeStyles } from "@/design-system/Text/Text.styles";

const $modal: ThemedStyle<ViewStyle> = ({ colors }) => ({
  flex: 1,
  backgroundColor: colors.background.surface,
});

const $messageContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flex: 1,
  marginTop: spacing.lg,
  paddingHorizontal: spacing.md,
});

const $message: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.text.secondary,
  ...textSizeStyles.sm,
  textAlign: "center",
});

const $error: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.text.primary,
});

const $pendingChatMembers: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  minHeight: 50,
  padding: spacing.xs,
  gap: spacing.xs,
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "flex-start",
  borderBottomWidth: 0.5,
  backgroundColor: colors.background.surface,
  flexWrap: "wrap",
});

const $searchContainer: ThemedStyle<ViewStyle> = ({ colors }) => ({
  flex: 1,
  backgroundColor: colors.background.surface,
});

const $newGroupButton: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginLeft: spacing["6xs"],
  paddingTop: spacing.sm,
  paddingBottom: 0,
});

export const stylesNewChat = {
  $modal,
  $messageContainer,
  $message,
  $error,
  $pendingChatMembers,
  $searchContainer,
  $newGroupButton,
} as const;
