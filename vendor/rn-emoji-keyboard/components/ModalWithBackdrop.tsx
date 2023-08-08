import * as React from "react";
import {
  Modal,
  useWindowDimensions,
  StyleSheet,
  TouchableOpacity,
  View,
  ModalProps,
} from "react-native";
import { KeyboardContext } from "../contexts/KeyboardContext";
import { useTimeout } from "../hooks/useTimeout";
import { IsSafeAreaWrapper } from "./ConditionalContainer";
import {
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
  const { theme, disableSafeArea } = React.useContext(KeyboardContext);
  const handleTimeout = useTimeout();

  React.useEffect(() => {
    translateY.value = withTiming(isOpen ? 0 : screenHeight, { duration: 300 });
  }, [isOpen, screenHeight, translateY]);

  const handleClose = () => {
    translateY.value = withTiming(screenHeight, { duration: 300 });
    handleTimeout(() => backdropPress(), 40);
  };

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: translateY.value }],
    };
  }, [translateY.value]);

  return (
    <Modal visible={isOpen} animationType="fade" transparent={true} {...rest}>
      <TouchableOpacity
        style={[styles.modalContainer, { backgroundColor: theme.backdrop }]}
        activeOpacity={1}
        onPress={handleClose}
      >
        <View
          style={[styles.modalContainer, { backgroundColor: theme.backdrop }]}
        >
          <IsSafeAreaWrapper
            style={styles.modalContainer}
            isSafeArea={!disableSafeArea}
          >
            <TouchableOpacity activeOpacity={1}>
              <ReanimatedView style={animatedStyle}>{children}</ReanimatedView>
            </TouchableOpacity>
          </IsSafeAreaWrapper>
        </View>
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
