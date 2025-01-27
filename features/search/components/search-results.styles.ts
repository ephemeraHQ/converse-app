import { ViewStyle, TextStyle } from "react-native";
import { ThemedStyle } from "@/theme/useAppTheme";

export const searchResultsStyles = {
  $container: () => ({
    flex: 1,
  }),

  $sectionHeader: ({ colors, spacing }: any) => ({
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.background.subtle,
  }),

  $sectionTitle: ({ colors }: any) => ({
    color: colors.text.secondary,
  }),

  $groupContainer: ({ colors, spacing, borderWidth }: any) => ({
    borderBottomWidth: borderWidth.sm,
    borderBottomColor: colors.border.subtle,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    backgroundColor: colors.background.surface,
    gap: spacing.sm,
  }),

  $groupTextContainer: () => ({
    flex: 1,
    minWidth: 0,
    flexDirection: "column",
    alignItems: "flex-start",
    justifyContent: "flex-start",
  }),

  $avatar: () => ({
    width: 40,
    height: 40,
    borderRadius: 24,
    overflow: "hidden",
  }),

  $primaryText: () => ({
    lineHeight: 20,
  }),

  $secondaryText: ({ colors }: any) => ({
    lineHeight: 18,
    color: colors.text.secondary,
    fontSize: 14,
  }),
} as const;
