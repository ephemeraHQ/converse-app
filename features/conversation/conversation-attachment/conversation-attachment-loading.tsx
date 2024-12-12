import { Loader } from "@/design-system/loader";
import { useAppTheme } from "@theme/useAppTheme";
import { memo } from "react";

export const AttachmentLoading = memo(function AttachmentLoading() {
  const { theme } = useAppTheme();
  return <Loader color={theme.colors.text.inverted.primary} />;
});
