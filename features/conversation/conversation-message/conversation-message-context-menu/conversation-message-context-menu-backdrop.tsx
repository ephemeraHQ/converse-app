import { BlurView } from "@/design-system/BlurView";
import { memo } from "react";
import { TouchableWithoutFeedback } from "react-native";

export const MessageContextMenuBackdrop = memo(
  function MessageContextMenuBackdrop({
    children,
    handlePressBackdrop,
  }: {
    children: React.ReactNode;
    handlePressBackdrop: () => void;
  }) {
    return (
      <BlurView isAbsolute>
        <TouchableWithoutFeedback onPress={handlePressBackdrop}>
          {children}
        </TouchableWithoutFeedback>
      </BlurView>
    );
  }
);
