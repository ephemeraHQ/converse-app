import {
  BottomSheetBackdrop as GorhomBottomSheetBackdrop,
  BottomSheetBackdropProps as GorhomBottomSheetBackdropProps,
  BottomSheetHandle as GorhomBottomSheetHandle,
  BottomSheetHandleProps as GorhomBottomSheetHandleProps,
  BottomSheetModal as GorhomBottomSheetModal,
  BottomSheetModalProps as GorhomBottomSheetModalProps,
  BottomSheetView as GorhomBottomSheetView,
} from "@gorhom/bottom-sheet";
import { BottomSheetViewProps } from "@gorhom/bottom-sheet/lib/typescript/components/bottomSheetView/types";
import { BottomSheetModalMethods as GorhomBottomSheetModalMethods } from "@gorhom/bottom-sheet/lib/typescript/types";
import { createRef, forwardRef, memo, useCallback, useRef } from "react";
import { Platform } from "react-native";
import { FullWindowOverlay } from "react-native-screens";

import { useAppTheme } from "../../theme/useAppTheme";
import { debugBorder } from "../../utils/debug";
import { HStack } from "../HStack";
import { IconButton } from "../IconButton";
import { Text } from "../Text";

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

export const BottomSheetHandleBar = memo(function BottomSheetHandleBar(
  props: GorhomBottomSheetHandleProps & {
    isAbsolute?: boolean;
  }
) {
  const { isAbsolute, animatedIndex, animatedPosition } = props;

  const { theme } = useAppTheme();

  return (
    <GorhomBottomSheetHandle
      animatedIndex={animatedIndex}
      animatedPosition={animatedPosition}
      style={{
        // ...debugBorder(),
        paddingTop: theme.spacing.xxxs,
        ...(isAbsolute && { position: "absolute", left: 0, right: 0 }),
      }}
      indicatorStyle={{
        backgroundColor: theme.colors.fill.tertiary,
        height: 5,
      }}
    />
  );
});

export const BottomSheetContentContainer = memo(
  function BottomSheetContentContainer(props: BottomSheetViewProps) {
    return <GorhomBottomSheetView {...props} />;
  }
);

export const BottomSheetHeader = memo(function BottomSheetHeader(props: {
  title: string;
  hasClose?: boolean;
}) {
  const { title, hasClose = true } = props;

  const { theme } = useAppTheme();

  return (
    <HStack
      {...debugBorder()}
      style={{
        justifyContent: "space-between",
        alignItems: "center",
        padding: theme.spacing.lg,
      }}
    >
      <Text preset="bigBold">{title}</Text>
      {hasClose && <IconButton iconName="xmark.circle.fill" />}
    </HStack>
  );
});

export type IBottomSheetModalRefType = GorhomBottomSheetModalMethods;

export type IBottomSheetModalRef = React.RefObject<IBottomSheetModalRefType>;

export const useBottomSheetModalRef = () => {
  return useRef<IBottomSheetModalRefType>(null);
};

export const createBottomSheetModalRef = () =>
  createRef<IBottomSheetModalRefType>();
