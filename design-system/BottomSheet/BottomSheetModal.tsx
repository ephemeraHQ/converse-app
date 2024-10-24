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
import { useAppTheme } from "../../theme/useAppTheme";

export type IBottomSheetModalProps = GorhomBottomSheetModalProps & {
  absoluteHandleBar?: boolean;
};

export const BottomSheetModal = memo(
  forwardRef<GorhomBottomSheetModalMethods, IBottomSheetModalProps>(
    function BottomSheetModal(props, ref) {
      const { absoluteHandleBar = true, backgroundStyle, ...rest } = props;

      const { theme } = useAppTheme();

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
          enableDynamicSizing={false} // By default we don't want enable dynamic sizing
          backdropComponent={BottomSheetBackdropOpacity}
          handleComponent={renderHandleComponent}
          backgroundStyle={[
            {
              backgroundColor: theme.colors.background.raised,
            },
            backgroundStyle,
          ]}
          {...rest}
        />
      );
    }
  )
);
