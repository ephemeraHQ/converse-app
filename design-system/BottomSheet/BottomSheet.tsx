import BottomSheetBase, { BottomSheetProps } from "@gorhom/bottom-sheet";
import { BottomSheetMethods } from "@gorhom/bottom-sheet/lib/typescript/types";
import React, { forwardRef, memo, useMemo } from "react";
import { useAppTheme } from "@theme/useAppTheme";
import { BottomSheetBackdropOpacity } from "./BottomSheetBackdropOpacity";

export type IBottomSheetProps = BottomSheetProps & {
  children: React.ReactNode;
};

export const BottomSheet = memo(
  forwardRef<BottomSheetMethods, IBottomSheetProps>(
    function BottomSheet(props, ref) {
      const {
        children,
        backdropComponent = BottomSheetBackdropOpacity,
        handleIndicatorStyle,
        handleStyle,
        backgroundStyle,
        ...rest
      } = props;

      const { theme } = useAppTheme();

      const combinedHandleIndicatorStyle = useMemo(
        () => [
          {
            backgroundColor: theme.colors.background.raised,
          },
          handleIndicatorStyle,
        ],
        [theme.colors.background.raised, handleIndicatorStyle]
      );

      const combinedHandleStyle = useMemo(
        () => [
          {
            backgroundColor: theme.colors.background.raised,
            borderTopLeftRadius: theme.borderRadius.sm,
            borderTopRightRadius: theme.borderRadius.sm,
          },
          handleStyle,
        ],
        [theme.colors.background.raised, theme.borderRadius.sm, handleStyle]
      );

      const combinedBackgroundStyle = useMemo(
        () => [
          {
            backgroundColor: theme.colors.background.raised,
          },
          backgroundStyle,
        ],
        [theme.colors.background.raised, backgroundStyle]
      );

      return (
        <BottomSheetBase
          ref={ref}
          enableDynamicSizing={false}
          backdropComponent={backdropComponent}
          handleIndicatorStyle={combinedHandleIndicatorStyle}
          handleStyle={combinedHandleStyle}
          backgroundStyle={combinedBackgroundStyle}
          {...rest}
        >
          {children}
        </BottomSheetBase>
      );
    }
  )
);
