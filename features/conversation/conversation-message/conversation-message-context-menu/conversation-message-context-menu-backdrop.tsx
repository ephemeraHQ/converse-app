import { BlurView } from "@/design-system/BlurView";
import { memo } from "react";
import { TouchableWithoutFeedback } from "react-native";
import { useAppTheme } from "@theme/useAppTheme";

export const MessageContextMenuBackdrop = memo(
  function MessageContextMenuBackdrop({
    children,
    handlePressBackdrop,
  }: {
    children: React.ReactNode;
    handlePressBackdrop: () => void;
  }) {
    const { theme } = useAppTheme();

    return (
      <BlurView isAbsolute tint={theme.isDark ? "dark" : "light"}>
        <TouchableWithoutFeedback onPress={handlePressBackdrop}>
          {children}
        </TouchableWithoutFeedback>
      </BlurView>
    );
  }
);
