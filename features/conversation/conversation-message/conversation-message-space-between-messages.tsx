import { VStack } from "@/design-system/VStack";
import { useAppTheme } from "@/theme/useAppTheme";
import { memo } from "react";

export const MessageSpaceBetweenMessages = memo(
  function MessageSpaceBetweenMessages() {
    const { theme } = useAppTheme();
    return <VStack style={{ height: theme.spacing["4xs"] }} />;
  }
);
