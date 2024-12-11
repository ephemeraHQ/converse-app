import {
  resetConversationListContextMenuStore,
  useConversationListContextMenuConversationTopic,
  useConversationListContextMenuIsVisible,
  useConversationListContextMenuItems,
} from "@/features/conversation-list/ConversationListContextMenu.store";
import { ConversationReadOnly } from "@/screens/ConversationReadOnly";
import { AnimatedBlurView } from "@components/AnimatedBlurView";
import {
  BACKDROP_DARK_BACKGROUND_COLOR,
  BACKDROP_LIGHT_BACKGROUND_COLOR,
} from "@design-system/ContextMenu/ContextMenu.constants";
import { animation } from "@theme/animations";
import { useAppTheme } from "@theme/useAppTheme";
import { ConversationTopic } from "@xmtp/react-native-sdk";
import React, { FC, memo, useCallback, useEffect } from "react";
import {
  Platform,
  StyleSheet,
  View,
  useColorScheme,
  useWindowDimensions,
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
import { ContextMenuItems } from "./ContextMenuItems";

const ConversationContextMenuComponent: FC = () => {
  const isVisible = useConversationListContextMenuIsVisible();
  const conversationTopic = useConversationListContextMenuConversationTopic();
  const contextMenuItems = useConversationListContextMenuItems();
  const activeValue = useSharedValue(false);
  const opacityValue = useSharedValue(0);
  const intensityValue = useSharedValue(0);
  const { height } = useWindowDimensions();
  const colorScheme = useColorScheme();
  const styles = useStyles();

  useEffect(() => {
    activeValue.value = isVisible;
    opacityValue.value = withTiming(isVisible ? 1 : 0, {
      duration: animation.contextMenuHoldDuration,
    });
    intensityValue.value = withTiming(isVisible ? 50 : 0, {
      duration: animation.contextMenuHoldDuration,
    });
  }, [activeValue, isVisible, opacityValue, intensityValue]);

  const translateY = useSharedValue(height);

  useEffect(() => {
    translateY.value = withTiming(isVisible ? 0 : height, {
      duration: animation.contextMenuHoldDuration,
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

  const backDropContainerStyle = useAnimatedStyle(() => {
    const backgroundColor =
      colorScheme === "dark"
        ? BACKDROP_DARK_BACKGROUND_COLOR
        : BACKDROP_LIGHT_BACKGROUND_COLOR;

    return { backgroundColor };
  }, []);

  const closeMenu = useCallback(() => {
    translateY.value = withTiming(
      height,
      { duration: animation.contextMenuHoldDuration },
      () => {
        runOnJS(resetConversationListContextMenuStore)();
      }
    );
  }, [height, translateY]);

  const gesture = Gesture.Simultaneous(
    Gesture.Pan()
      .onUpdate((event) => {
        translateY.value = Math.max(0, event.translationY);
      })
      .onEnd((event) => {
        if (event.velocityY > 500 || event.translationY > height * 0.2) {
          runOnJS(closeMenu)();
        } else {
          translateY.value = withTiming(0, {
            duration: animation.contextMenuHoldDuration,
          });
        }
      }),
    Gesture.Tap().onEnd(() => {
      runOnJS(closeMenu)();
    })
  );

  if (!isVisible) {
    return null;
  }

  return (
    <Portal>
      <GestureHandlerRootView style={StyleSheet.absoluteFill}>
        <GestureDetector gesture={gesture}>
          <AnimatedBlurView
            tint="default"
            style={[
              styles.flex,
              Platform.OS === "android" ? backDropContainerStyle : undefined,
            ]}
            animatedProps={animatedContainerProps}
          >
            <View style={styles.overlay}>
              <Animated.View style={[styles.container, animatedStyle]}>
                <View style={styles.previewContainer}>
                  <GestureDetector
                    gesture={Gesture.Tap().onEnd(() => {
                      runOnJS(resetConversationListContextMenuStore)();
                    })}
                  >
                    <ConversationReadOnly
                      topic={conversationTopic as ConversationTopic}
                      conversationId={conversationId}
                    />
                  </GestureDetector>
                </View>
                <View style={styles.menuContainer}>
                  <ContextMenuItems
                    containerStyle={styles.table}
                    items={contextMenuItems}
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
  const { theme } = useAppTheme();

  return StyleSheet.create({
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
      marginHorizontal: theme.spacing.md,
      marginTop: theme.spacing["5xl"],
      marginBottom: theme.spacing.zero,
      paddingBottom: theme.spacing.xxs,
      overflow: "hidden",
      justifyContent: "flex-start",
      minHeight: 210,
      backgroundColor: theme.colors.background.raised,
      borderRadius: theme.borderRadius.sm,
    },
    menuContainer: {
      marginHorizontal: theme.spacing.md,
      minHeight: 300,
      borderRadius: 16,
      overflow: "hidden",
    },
    flex: {
      flex: 1,
    },
    table: {
      width: 180,
      backgroundColor:
        Platform.OS === "android" ? theme.colors.background.raised : undefined,
      borderRadius: Platform.OS === "android" ? 10 : undefined,
    },
  });
};

export const ConversationContextMenu = memo(ConversationContextMenuComponent);
