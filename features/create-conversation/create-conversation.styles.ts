/**
 * Styles for the Create Conversation feature components
 * Organized by component for better maintainability
 */

import { ViewStyle, TextStyle } from "react-native";
import { ThemedStyle } from "@/theme/useAppTheme";
import { textSizeStyles } from "@/design-system/Text/Text.styles";

// Screen container styles
const $screenContainer: ThemedStyle<ViewStyle> = ({ colors }) => ({
  flex: 1,
  backgroundColor: colors.background.surface,
});

// Search section styles
const $searchSection: ThemedStyle<ViewStyle> = ({ colors }) => ({
  backgroundColor: colors.background.surface,
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

const $errorText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.text.primary,
});

// Composer section styles
const $composerSection: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginTop: "auto",
  paddingBottom: spacing.md,
});

export const createConversationStyles = {
  $screenContainer,
  $searchSection,
  $pendingMembersSection,
  $messageSection,
  $messageText,
  $errorText,
  $composerSection,
} as const;
