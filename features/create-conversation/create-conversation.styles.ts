/**
 * Styles for the Create Conversation feature components
 * Organized by component for better maintainability
 */

import { ViewStyle, TextStyle } from "react-native";
import { ThemedStyle } from "@/theme/useAppTheme";
import { textSizeStyles } from "@/design-system/Text/Text.styles";
// import { debugBorder } from "@/utils/debug-style";

// Screen container styles
const $screenContainer: ThemedStyle<ViewStyle> = ({ colors }) => ({
  flex: 1,
  backgroundColor: colors.background.surface,
  // ...debugBorder("red"),
});

// Search section styles
const $searchSection: ThemedStyle<ViewStyle> = ({ colors }) => ({
  backgroundColor: colors.background.surface,
  // ...debugBorder("orange"),
});

// Pending members section styles
const $pendingMembersSection: ThemedStyle<ViewStyle> = ({
  colors,
  spacing,
}) => ({
  minHeight: 50,
  padding: spacing.xs,
  gap: spacing.xs,
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "flex-start",
  borderBottomWidth: 0.5,
  backgroundColor: colors.background.surface,
  flexWrap: "wrap",
  // ...debugBorder("green"),
});

// Message section styles
const $messageSection: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flex: 1,
  marginTop: spacing.lg,
  paddingHorizontal: spacing.md,
});

const $messageText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.text.secondary,
  ...textSizeStyles.sm,
  textAlign: "center",
});

const $inviteThemStyle: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.text.secondary,
  ...textSizeStyles.sm,
  textAlign: "center",
  height: 18,
  textDecorationLine: "underline",
  textDecorationStyle: "dotted",
});

const $errorText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.text.primary,
});

const $composerSection: ThemedStyle<ViewStyle> = () => ({
  marginTop: "auto",
});

export const createConversationStyles = {
  $screenContainer,
  $searchSection,
  $pendingMembersSection,
  $messageSection,
  $messageText,
  $errorText,
  $composerSection,
  $inviteThemStyle,
} as const;
