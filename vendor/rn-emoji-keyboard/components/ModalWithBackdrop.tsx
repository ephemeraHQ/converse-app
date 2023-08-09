import * as React from "react";
import {
  Modal,
  useWindowDimensions,
  StyleSheet,
  TouchableOpacity,
  ModalProps,
} from "react-native";
import { KeyboardContext } from "../contexts/KeyboardContext";
import { useTimeout } from "../hooks/useTimeout";
import { IsSafeAreaWrapper } from "./ConditionalContainer";
import {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { ReanimatedView } from "../../../utils/animations";

type ModalWithBackdropProps = {
  isOpen: boolean;
  backdropPress: () => void;
  children: React.ReactNode;
};

export const ModalWithBackdrop = ({
  isOpen,
  backdropPress,
  children,
  ...rest
}: ModalWithBackdropProps & ModalProps) => {
  const { height: screenHeight } = useWindowDimensions();
  const translateY = useSharedValue(screenHeight);
  const { disableSafeArea } = React.useContext(KeyboardContext);
  const handleTimeout = useTimeout();

  React.useEffect(() => {
    translateY.value = withTiming(isOpen ? 0 : screenHeight, { duration: 400 });
  }, [isOpen, screenHeight, translateY]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: translateY.value }],
    };
  }, [translateY.value]);

  const backgroundColorValue = useSharedValue(0);
  const backdropAnimatedStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      backgroundColorValue.value,
      [0, 1],
      ["rgba(0, 0, 0, 0)", "rgba(0, 0, 0, 0.5)"]
    );
    return { backgroundColor };
  });
  React.useEffect(() => {
    backgroundColorValue.value = withTiming(isOpen ? 1 : 0, { duration: 400 });
  }, [isOpen]);

  const handleClose = React.useCallback(() => {
    translateY.value = withTiming(screenHeight, { duration: 400 });
    backgroundColorValue.value = withTiming(0, { duration: 600 });
    handleTimeout(() => backdropPress(), 600);
  }, []);

  return (
    <Modal visible={isOpen} transparent {...rest}>
      <TouchableOpacity
        style={[styles.modalContainer]}
        activeOpacity={1}
        onPress={handleClose}
      >
        <ReanimatedView style={[backdropAnimatedStyle, styles.modalContainer]}>
          <IsSafeAreaWrapper
            style={styles.modalContainer}
            isSafeArea={!disableSafeArea}
          >
            <TouchableOpacity activeOpacity={1}>
              <ReanimatedView style={animatedStyle}>{children}</ReanimatedView>
            </TouchableOpacity>
          </IsSafeAreaWrapper>
        </ReanimatedView>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: { flex: 1, justifyContent: "flex-end" },
  container: {
    backgroundColor: "#fff",
    borderRadius: 16,
    shadowColor: "black",
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 5,
    elevation: 10,
  },
});
