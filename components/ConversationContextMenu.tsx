import TableView, { TableViewItemType } from "@components/TableView/TableView";
import { ConversationReadOnly } from "@screens/ConversationReadOnly";
import { backgroundColor } from "@styles/colors";
import {
  SIDE_MARGIN,
  AUXILIARY_VIEW_MIN_HEIGHT,
  HOLD_ITEM_TRANSFORM_DURATION,
  contextMenuStyleGuide,
} from "@utils/contextMenu/constants";
import { BlurView } from "expo-blur";
import React, { FC, memo, useCallback, useEffect } from "react";
import {
  Platform,
  StyleSheet,
  useColorScheme,
  useWindowDimensions,
  View,
} from "react-native";
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import { Portal } from "react-native-paper";
import Animated, {
  runOnJS,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

const AnimatedBlurView =
  Platform.OS === "ios"
    ? Animated.createAnimatedComponent(BlurView)
    : Animated.createAnimatedComponent(View);

type ConversationContextMenuProps = {
  isVisible: boolean;
  onClose: (openConversationOnClose?: boolean) => void;
  items: TableViewItemType[];
  conversationTopic: string;
};

const ConversationContextMenuComponent: FC<ConversationContextMenuProps> = ({
  isVisible,
  onClose,
  items,
  conversationTopic,
}) => {
  const activeValue = useSharedValue(false);
  const opacityValue = useSharedValue(0);
  const intensityValue = useSharedValue(0);
  const { height, width } = useWindowDimensions();
  const styles = useStyles();

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
    translateY.value = withTiming(isVisible ? 0 : height, {
      duration: HOLD_ITEM_TRANSFORM_DURATION,
    });
  }, [isVisible, translateY, height]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const animatedContainerProps = useAnimatedProps(() => {
    return {
      intensity: intensityValue.value,
    };
  });

  const closeMenu = useCallback(() => {
    translateY.value = withTiming(
      height,
      { duration: HOLD_ITEM_TRANSFORM_DURATION },
      () => {
        runOnJS(onClose)();
      }
    );
  }, [height, onClose, translateY]);

  const gesture = Gesture.Pan()
    .onUpdate((event) => {
      translateY.value = Math.max(0, event.translationY);
    })
    .onEnd((event) => {
      if (event.velocityY > 500 || event.translationY > height * 0.2) {
        runOnJS(closeMenu)();
      } else {
        translateY.value = withTiming(0, {
          duration: HOLD_ITEM_TRANSFORM_DURATION,
        });
      }
    });

  if (!isVisible) {
    return null;
  }

  return (
    <Portal>
      <GestureHandlerRootView style={StyleSheet.absoluteFill}>
        <GestureDetector gesture={gesture}>
          <AnimatedBlurView
            tint="default"
            style={styles.flex}
            animatedProps={animatedContainerProps}
          >
            <View style={styles.overlay}>
              <Animated.View style={[styles.container, animatedStyle]}>
                <View style={styles.handle} />
                <View style={styles.previewContainer}>
                  <GestureDetector
                    gesture={Gesture.Tap().onEnd(() => {
                      runOnJS(onClose)(true);
                    })}
                  >
                    <ConversationReadOnly topic={conversationTopic} readOnly />
                  </GestureDetector>
                </View>
                <View style={styles.menuContainer}>
                  <TableView
                    style={{
                      maxWidth: width * 0.6,
                    }}
                    items={items}
                  />
                </View>
              </Animated.View>
            </View>
          </AnimatedBlurView>
        </GestureDetector>
      </GestureHandlerRootView>
    </Portal>
  );
};

const useStyles = () => {
  const colorScheme = useColorScheme();
  return StyleSheet.create({
    overlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
    },
    container: {
      flex: 1,
      justifyContent: "flex-end",
    },
    handle: {
      marginTop: 70,
      marginBottom: 10,
      width: 36,
      height: 5,
      backgroundColor: contextMenuStyleGuide.palette.secondary,
      alignSelf: "center",
      borderRadius: 2.5,
    },
    previewContainer: {
      flex: 1,
      margin: SIDE_MARGIN,
      paddingBottom: contextMenuStyleGuide.spacing,
      overflow: "hidden",
      justifyContent: "flex-start",
      minHeight: AUXILIARY_VIEW_MIN_HEIGHT,
      backgroundColor: backgroundColor(colorScheme),
      borderRadius: 16,
    },
    conversationName: {
      ...contextMenuStyleGuide.typography.body,
      fontWeight: "600",
      marginBottom: contextMenuStyleGuide.spacing,
    },
    lastMessagePreview: {
      ...contextMenuStyleGuide.typography.callout,
      color:
        Platform.OS === "ios"
          ? contextMenuStyleGuide.palette.secondary
          : contextMenuStyleGuide.palette.common.black,
    },
    menuContainer: {
      marginHorizontal: SIDE_MARGIN,
      minHeight: 300,
      borderRadius: 16,
      overflow: "hidden",
    },
    flex: {
      flex: 1,
    },
  });
};

export const ConversationContextMenu = memo(ConversationContextMenuComponent);
