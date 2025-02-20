import { ActivityIndicator } from "@/design-system/activity-indicator";
import { useAppTheme } from "@/theme/use-app-theme";
import { memo } from "react";

export const AttachmentLoading = memo(function AttachmentLoading() {
  const { theme } = useAppTheme();
  return <ActivityIndicator color={theme.colors.text.inverted.primary} />;
});
