import {
  BottomSheetBackdrop as GorhomBottomSheetBackdrop,
  BottomSheetBackdropProps as GorhomBottomSheetBackdropProps,
} from "@gorhom/bottom-sheet";
import { memo } from "react";

export const BottomSheetBackdropOpacity = memo(function BackdropOpacity(
  props: GorhomBottomSheetBackdropProps
) {
  return (
    <GorhomBottomSheetBackdrop
      {...props}
      opacity={0.6}
      disappearsOnIndex={-1}
      appearsOnIndex={0}
    />
  );
});
