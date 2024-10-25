import {
  BottomSheetHandleProps as GorhomBottomSheetHandleProps,
  BottomSheetModal as GorhomBottomSheetModal,
  BottomSheetModalProps as GorhomBottomSheetModalProps,
} from "@gorhom/bottom-sheet";
import { BottomSheetModalMethods as GorhomBottomSheetModalMethods } from "@gorhom/bottom-sheet/lib/typescript/types";
import { forwardRef, memo, useCallback } from "react";
import { Platform } from "react-native";
import { FullWindowOverlay } from "react-native-screens";

import { BottomSheetBackdropOpacity } from "./BottomSheetBackdropOpacity";
import { BottomSheetHandleBar } from "./BottomSheetHandleBar";

export type IBottomSheetModalProps = GorhomBottomSheetModalProps & {
  absoluteHandleBar?: boolean;
};

export const BottomSheetModal = memo(
  forwardRef<GorhomBottomSheetModalMethods, IBottomSheetModalProps>(
    function BottomSheetModal(props, ref) {
      const { absoluteHandleBar = true, ...rest } = props;

      // https://github.com/gorhom/react-native-bottom-sheet/issues/1644#issuecomment-1949019839
      const renderContainerComponent = useCallback((props: any) => {
        return <FullWindowOverlay {...props} />;
      }, []);

      const renderHandleComponent = useCallback(
        (props: GorhomBottomSheetHandleProps) => {
          return (
            <BottomSheetHandleBar isAbsolute={absoluteHandleBar} {...props} />
          );
        },
        [absoluteHandleBar]
      );

      return (
        <GorhomBottomSheetModal
          ref={ref}
          containerComponent={
            Platform.OS === "ios" ? renderContainerComponent : undefined
          }
          backdropComponent={BottomSheetBackdropOpacity}
          handleComponent={renderHandleComponent}
          {...rest}
        />
      );
    }
  )
);
