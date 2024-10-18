import { BottomSheetView as GorhomBottomSheetView } from "@gorhom/bottom-sheet";
import { BottomSheetViewProps } from "@gorhom/bottom-sheet/lib/typescript/components/bottomSheetView/types";
import { memo } from "react";

export const BottomSheetContentContainer = memo(
  function BottomSheetContentContainer(props: BottomSheetViewProps) {
    return <GorhomBottomSheetView {...props} />;
  }
);
