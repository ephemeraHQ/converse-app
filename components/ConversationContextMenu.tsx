import React from "react";
import { Modal, View, Text, TouchableOpacity, StyleSheet } from "react-native";
import Animated, {
  SharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";

type ConversationContextMenuProps = {
  isVisible: boolean;
  onClose: () => void;
  items: { title: string; action: () => void; id: string }[];
  itemRect: SharedValue<{
    x: number;
    y: number;
    width: number;
    height: number;
  }>;
};

export const ConversationContextMenu: React.FC<
  ConversationContextMenuProps
> = ({ isVisible, onClose, items, itemRect }) => {
  const animatedStyle = useAnimatedStyle(() => {
    return {
      position: "absolute",
      top: itemRect.value.y,
      left: itemRect.value.x,
      width: itemRect.value.width,
      height: itemRect.value.height,
      opacity: withTiming(isVisible ? 1 : 0),
    };
  });

  if (!isVisible) return null;

  return (
    <Modal visible={isVisible} transparent animationType="fade">
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <Animated.View style={animatedStyle}>
          <View style={styles.contextMenuContainer}>
            <View style={styles.previewContainer}>
              {/* Add conversation preview here */}
              <Text>Preview</Text>
            </View>
            {items.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.menuItem}
                onPress={item.action}
              >
                <Text>{item.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  contextMenuContainer: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  previewContainer: {
    marginBottom: 8,
    padding: 8,
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
  },
  menuItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
});
