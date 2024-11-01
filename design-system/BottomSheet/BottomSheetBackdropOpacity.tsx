import {
  BottomSheetBackdrop as GorhomBottomSheetBackdrop,
  BottomSheetBackdropProps as GorhomBottomSheetBackdropProps,
} from "@gorhom/bottom-sheet";
import { memo } from "react";

import { useAppTheme } from "../../theme/useAppTheme";

export const BottomSheetBackdropOpacity = memo(function BackdropOpacity(
  props: GorhomBottomSheetBackdropProps
) {
  const { style, animatedIndex, animatedPosition, ...rest } = props;

  const { theme } = useAppTheme();

  return (
    <GorhomBottomSheetBackdrop
      opacity={0.6}
      disappearsOnIndex={-1}
      appearsOnIndex={0}
      animatedIndex={animatedIndex}
      animatedPosition={animatedPosition}
      style={[
        {
          backgroundColor: theme.colors.background.scrim,
        },
        style,
      ]}
      {...rest}
    />
  );
});
