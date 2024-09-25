import TableView, { TableViewItemType } from "@components/TableView/TableView";
import { backgroundColor } from "@styles/colors";
import { HOLD_ITEM_TRANSFORM_DURATION } from "@utils/contextMenu/constants";
import { BlurView } from "expo-blur";
import React, { FC, memo, useEffect } from "react";
import {
  Text,
  Platform,
  StyleSheet,
  TouchableWithoutFeedback,
  useColorScheme,
  useWindowDimensions,
  View,
} from "react-native";
import { Portal } from "react-native-paper";
import Animated, {
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const AnimatedBlurView =
  Platform.OS === "ios"
    ? Animated.createAnimatedComponent(BlurView)
    : Animated.createAnimatedComponent(View);

type ConversationContextMenuProps = {
  isVisible: boolean;
  onClose: () => void;
  items: TableViewItemType[];
  conversation: {
    name: string;
    lastMessagePreview?: string;
  };
};

const ConversationContextMenuComponent: FC<ConversationContextMenuProps> = ({
  isVisible,
  onClose,
  items,
  conversation,
}) => {
  const activeValue = useSharedValue(false);
  const opacityValue = useSharedValue(0);
  const intensityValue = useSharedValue(0);
  const { height } = useWindowDimensions();
  const safeAreaInsets = useSafeAreaInsets();
  const colorScheme = useColorScheme();

  useEffect(() => {
    activeValue.value = isVisible;
    opacityValue.value = withTiming(isVisible ? 1 : 0, {
      duration: HOLD_ITEM_TRANSFORM_DURATION,
    });
    intensityValue.value = withTiming(isVisible ? 50 : 0, {
      duration: HOLD_ITEM_TRANSFORM_DURATION,
    });
  }, [activeValue, isVisible, opacityValue, intensityValue]);

  const translateY = useSharedValue(height);

  useEffect(() => {
    translateY.value = withTiming(isVisible ? 0 : height, { duration: 300 });
  }, [isVisible, translateY, height]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const animatedContainerProps = useAnimatedProps(() => {
    return {
      intensity: intensityValue.value,
    };
  });

  if (!isVisible) {
    return null;
  }

  return (
    <Portal>
      <TouchableWithoutFeedback onPress={onClose}>
        <AnimatedBlurView
          tint="default"
          style={styles.flex}
          animatedProps={animatedContainerProps}
        >
          <View style={styles.overlay}>
            <Animated.View style={[styles.container, animatedStyle]}>
              <View style={styles.previewContainer}>
                <Text style={styles.conversationName}>{conversation.name}</Text>
                <Text style={styles.lastMessagePreview}>
                  {conversation.lastMessagePreview}
                </Text>
              </View>
              <View style={styles.menuContainer}>
                <TableView
                  style={{
                    backgroundColor:
                      Platform.OS === "android"
                        ? backgroundColor(colorScheme)
                        : undefined,
                    borderTopLeftRadius: 20,
                    borderTopRightRadius: 20,
                    paddingBottom: safeAreaInsets.bottom,
                  }}
                  items={items}
                />
              </View>
            </Animated.View>
          </View>
        </AnimatedBlurView>
      </TouchableWithoutFeedback>
    </Portal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  container: {
    flex: 1,
    justifyContent: "flex-end",
  },
  previewContainer: {
    flex: 1,
    backgroundColor: "white",
    padding: 20,
    justifyContent: "center",
  },
  conversationName: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
  },
  lastMessagePreview: {
    fontSize: 16,
  },
  menuContainer: {
    maxHeight: 300,
  },
  flex: {
    flex: 1,
  },
});

export const ConversationContextMenu = memo(ConversationContextMenuComponent);
