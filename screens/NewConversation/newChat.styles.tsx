import { Platform, ViewStyle, TextStyle } from "react-native";

import { ThemedStyle } from "@/theme/useAppTheme";
import { textSizeStyles } from "@/design-system/Text/Text.styles";

const $modal: ThemedStyle<ViewStyle> = ({ colors }) => ({
  flex: 1,
  backgroundColor: colors.background.surface,
});

const $messageContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  ...Platform.select({
    default: {
      marginTop: spacing.lg,
      paddingHorizontal: spacing.md,
    },
    android: {
      marginRight: spacing.md,
      marginLeft: spacing.md,
      marginTop: spacing.md,
    },
  }),
});

const $message: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.text.secondary,
  ...textSizeStyles.sm,
  ...Platform.select({
    default: {
      textAlign: "center",
    },
  }),
});

const $error: ThemedStyle<TextStyle> = ({ colors }) => ({
  color:
    Platform.OS === "android" ? colors.text.secondary : colors.text.primary,
});

const $pendingChatMembers: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  minHeight: 50,
  paddingBottom: Platform.OS === "ios" ? spacing.xs : 0,
  flexDirection: "row",
  alignItems: "center",
  paddingLeft: Platform.OS === "ios" ? spacing.md : 0,
  justifyContent: "flex-start",
  borderBottomWidth: Platform.OS === "android" ? 1 : 0.5,
  borderBottomColor: colors.border.subtle,
  backgroundColor: colors.background.surface,
  flexWrap: "wrap",
});

const $groupMemberButton: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  padding: 0,
  marginHorizontal: 0,
  marginRight: spacing.xs,
  marginTop: spacing.xs,
});

const $searchContainer: ThemedStyle<ViewStyle> = ({ colors }) => ({
  flex: 1,
  backgroundColor: colors.background.surface,
});

const $newGroupButton: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginLeft: spacing["6xs"],
  paddingTop: Platform.OS === "ios" ? spacing.sm : spacing.xs,
  paddingBottom: Platform.OS === "ios" ? 0 : spacing.xs,
});

export const stylesNewChat = {
  $modal,
  $messageContainer,
  $message,
  $error,
  $pendingChatMembers,
  $groupMemberButton,
  $searchContainer,
  $newGroupButton,
} as const;
