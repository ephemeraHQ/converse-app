import React, { useCallback, useState } from "react";
import { Modal, TouchableOpacity, Text, StyleSheet } from "react-native";
import {
  GestureDetector,
  Gesture,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";

export interface MessageActionSheetProps {
  visible: boolean;
  onClose: () => void;
  options: string[];
  cancelButtonIndex?: number;
  destructiveButtonIndex?: number | number[];
  onSelect: (index: number) => void;
  title?: string;
}

export interface MessageActionSheetOptions {
  options: string[];
  message?: string;
  cancelButtonIndex?: number;
  destructiveButtonIndex?: number | number[];
  title?: string;
}

export const useMessageActionSheet = () => {
  const [visible, setVisible] = useState(false);
  const [currentOptions, setCurrentOptions] =
    useState<MessageActionSheetOptions | null>(null);
  const [onSelectCallback, setOnSelectCallback] = useState<
    ((index: number) => void) | null
  >(null);

  const showActionSheetWithOptions = useCallback(
    (options: MessageActionSheetOptions, callback: (index: number) => void) => {
      setCurrentOptions(options);
      setOnSelectCallback(() => callback);
      setVisible(true);
    },
    []
  );

  const hideActionSheet = useCallback(() => {
    setVisible(false);
  }, []);

  const handleSelect = useCallback(
    (index: number) => {
      if (onSelectCallback) {
        onSelectCallback(index);
      }
      hideActionSheet();
    },
    [onSelectCallback, hideActionSheet]
  );

  const actionSheet = currentOptions ? (
    <MessageActionSheet
      visible={visible}
      onClose={hideActionSheet}
      options={currentOptions.options}
      cancelButtonIndex={currentOptions.cancelButtonIndex}
      destructiveButtonIndex={currentOptions.destructiveButtonIndex}
      onSelect={handleSelect}
      title={currentOptions.title}
    />
  ) : null;

  return {
    showActionSheetWithOptions,
    actionSheet,
  };
};

const MessageActionSheet: React.FC<MessageActionSheetProps> = ({
  visible,
  onClose,
  options,
  cancelButtonIndex,
  destructiveButtonIndex,
  onSelect,
  title,
}) => {
  const translateY = useSharedValue(0);

  const gesture = Gesture.Pan()
    .onUpdate((event) => {
      if (event.translationY > 0) {
        translateY.value = event.translationY;
      }
    })
    .onEnd((event) => {
      if (event.translationY > 50) {
        onClose();
      } else {
        translateY.value = withSpring(0);
      }
    });

  const animatedStyles = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: translateY.value }],
    };
  });

  const isDestructive = (index: number) => {
    if (typeof destructiveButtonIndex === "number") {
      return index === destructiveButtonIndex;
    }
    return (
      Array.isArray(destructiveButtonIndex) &&
      destructiveButtonIndex.includes(index)
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <GestureHandlerRootView style={{ flex: 1 }}>
        <TouchableOpacity style={styles.overlay} onPress={onClose}>
          <GestureDetector gesture={gesture}>
            <Animated.View style={[styles.actionSheet, animatedStyles]}>
              {title && <Text style={styles.title}>{title}</Text>}
              {options.map((option, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.option,
                    isDestructive(index) && styles.destructiveOption,
                    index === cancelButtonIndex && styles.cancelOption,
                  ]}
                  onPress={() => {
                    onSelect(index);
                    onClose();
                  }}
                >
                  <Text
                    style={[
                      styles.optionText,
                      isDestructive(index) && styles.destructiveText,
                      index === cancelButtonIndex && styles.cancelText,
                    ]}
                  >
                    {option}
                  </Text>
                </TouchableOpacity>
              ))}
            </Animated.View>
          </GestureDetector>
        </TouchableOpacity>
      </GestureHandlerRootView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    justifyContent: "flex-end",
  },
  actionSheet: {
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    maxHeight: "80%",
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
  },
  message: {
    fontSize: 14,
    marginBottom: 10,
    textAlign: "center",
  },
  option: {
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#ccc",
  },
  optionText: {
    fontSize: 16,
  },
  destructiveOption: {
    // Style for destructive options
  },
  destructiveText: {
    color: "red",
  },
  cancelOption: {
    // Style for cancel option
  },
  cancelText: {
    fontWeight: "bold",
  },
});

export default MessageActionSheet;
