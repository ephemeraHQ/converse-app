import BottomSheet, {
  BottomSheetView,
  BottomSheetProps,
} from "@gorhom/bottom-sheet";
import { BottomSheetMethods } from "@gorhom/bottom-sheet/lib/typescript/types";
import React, { forwardRef, memo } from "react";
import { useAppTheme } from "@theme/useAppTheme";
import { BottomSheetBackdropOpacity } from "./BottomSheetBackdropOpacity";

export type IBottomSheetProps = BottomSheetProps & {
  children: React.ReactNode;
};

export const CustomBottomSheet = memo(
  forwardRef<BottomSheetMethods, IBottomSheetProps>(
    function CustomBottomSheet(props, ref) {
      const {
        children,
        backdropComponent = BottomSheetBackdropOpacity,
        ...rest
      } = props;

      const { theme } = useAppTheme();

      return (
        <BottomSheet
          ref={ref}
          backdropComponent={backdropComponent}
          handleIndicatorStyle={{
            backgroundColor: theme.colors.background.raised,
          }}
          handleStyle={{
            backgroundColor: theme.colors.background.raised,
            borderTopLeftRadius: theme.borderRadius.sm,
            borderTopRightRadius: theme.borderRadius.sm,
          }}
          backgroundStyle={{
            backgroundColor: theme.colors.background.raised,
          }}
          {...rest}
        >
          <BottomSheetView style={{ flex: 1 }}>{children}</BottomSheetView>
        </BottomSheet>
      );
    }
  )
);
