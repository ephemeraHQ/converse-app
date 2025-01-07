import { AnimatedVStack } from "@/design-system/VStack";
import { AnimatedScrollView } from "@design-system/ScrollView";
import { backgroundColor } from "@styles/colors";
import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
} from "react";
import {
  Platform,
  StyleSheet,
  TouchableWithoutFeedback,
  View,
  ViewStyle,
  useColorScheme,
  useWindowDimensions,
  Modal,
} from "react-native";
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import Animated, {
  interpolateColor,
  runOnJS,
  useAnimatedKeyboard,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  FadeIn,
  FadeOut,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const DRAWER_ANIMATION_DURATION = 300;
const DRAWER_THRESHOLD = 100;
const TRANSLATION = 1000;

export type DrawerProps = {
  visible: boolean;
  children: React.ReactNode;
  onClose?: () => void;
  style?: ViewStyle;
  showHandle?: boolean;
};

export const DrawerContext = React.createContext<{
  closeDrawer: () => void;
}>({
  closeDrawer: () => {},
});

export type DrawerRef = {
  /**
   * Will tell the drawer to close, but still needs
   * @returns
   */
  closeDrawer: (callback: () => void) => void;
};

export const Drawer = forwardRef<DrawerRef, DrawerProps>(function Drawer(
  { children, visible, onClose, style, showHandle },
  ref
) {
  const styles = useStyles();
  const translation = useSharedValue(TRANSLATION);
  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      translation.value = Math.max(0, event.translationY);
    })
    .onEnd((event) => {
      if (event.translationY < DRAWER_THRESHOLD) {
        translation.value = withTiming(0, {
          duration: DRAWER_ANIMATION_DURATION,
        });
      } else {
        translation.value = withTiming(
          TRANSLATION,
          {
            duration: DRAWER_ANIMATION_DURATION,
          },
          () => {
            if (onClose) {
              runOnJS(onClose)();
            }
          }
        );
      }
    });

  const nativeGesture = useMemo(() => Gesture.Native(), []);

  const composed = useMemo(
    () => Gesture.Simultaneous(nativeGesture, panGesture),
    [nativeGesture, panGesture]
  );

  useEffect(() => {
    if (visible) {
      translation.value = withTiming(0, {
        duration: DRAWER_ANIMATION_DURATION,
      });
    } else {
      translation.value = withTiming(
        TRANSLATION,
        {
          duration: DRAWER_ANIMATION_DURATION,
        },
        () => {
          if (onClose) {
            runOnJS(onClose)();
          }
        }
      );
    }
  }, [onClose, translation, visible]);

  const handleClose = useCallback(() => {
    translation.value = withTiming(
      TRANSLATION,
      {
        duration: DRAWER_ANIMATION_DURATION,
      },
      () => {
        if (onClose) {
          runOnJS(onClose)();
        }
      }
    );
  }, [onClose, translation]);

  useImperativeHandle(ref, () => ({
    closeDrawer: (callback: () => void) =>
      (translation.value = withTiming(
        TRANSLATION,
        {
          duration: DRAWER_ANIMATION_DURATION,
        },
        () => {
          if (callback) {
            runOnJS(callback)();
          }
        }
      )),
  }));

  const backgroundStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      translation.value,
      [TRANSLATION, 0],
      ["rgba(0, 0, 0, 0)", "rgba(0, 0, 0, 0.5)"]
    ),
  }));
  const { height: keyboardHeight } = useAnimatedKeyboard();
  const { bottom } = useSafeAreaInsets();

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translation.value }],
    paddingBottom: Platform.OS === "ios" ? keyboardHeight.value + bottom : 0,
  }));

  if (!visible) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      transparent={true}
      onRequestClose={onClose}
      animationType="fade"
      statusBarTranslucent={Platform.OS === "android"}
    >
      <Animated.View style={StyleSheet.absoluteFill}>
        <DrawerContext.Provider value={{ closeDrawer: handleClose }}>
          <GestureHandlerRootView style={styles.gestureHandlerContainer}>
            <TouchableWithoutFeedback onPress={handleClose}>
              <AnimatedVStack style={[styles.backdrop, backgroundStyle]} />
            </TouchableWithoutFeedback>
            <GestureDetector gesture={composed}>
              <AnimatedScrollView
                style={[styles.trayContainer, animatedStyle, style]}
                alwaysBounceVertical={false}
              >
                {showHandle && <View style={styles.handle} />}
                {children}
              </AnimatedScrollView>
            </GestureDetector>
          </GestureHandlerRootView>
        </DrawerContext.Provider>
      </Animated.View>
    </Modal>
  );
});

const useStyles = () => {
  const colorScheme = useColorScheme();
  const { height } = useWindowDimensions();
  return StyleSheet.create({
    gestureHandlerContainer: {
      flex: 1,
    },
    backdrop: {
      flex: 1,
    },
    trayContainer: {
      minHeight: 200,
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: backgroundColor(colorScheme),
      paddingHorizontal: 15,
      borderTopRightRadius: 15,
      borderTopLeftRadius: 15,
      maxHeight: Platform.OS === "ios" ? height * 0.8 : height * 0.6,
    },
    handle: {
      marginTop: 4,
      height: 3,
      width: 50,
      backgroundColor:
        colorScheme === "dark"
          ? "rgba(255, 255, 255, 0.3)"
          : "rgba(0, 0, 0, 0.3)",
      alignSelf: "center",
      borderRadius: 2,
    },
  });
};
