import { backgroundColor } from "@styles/colors";
import { ReanimatedView } from "@utils/animations";
import { useKeyboardAnimation } from "@utils/animations/keyboardAnimation";
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
  useColorScheme,
  useWindowDimensions,
  View,
  ViewStyle,
} from "react-native";
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import { Portal } from "react-native-paper";
import {
  interpolateColor,
  LinearTransition,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const DRAWER_ANIMATION_DURATION = 300;
const DRAWER_THRESHOLD = 100;
const TRANSLATION = 1000;

export interface DrawerProps {
  visible: boolean;
  children: React.ReactNode;
  onClose?: () => void;
  style?: ViewStyle;
}

export const DrawerContext = React.createContext<{
  closeDrawer: () => void;
}>({
  closeDrawer: () => {},
});

export interface DrawerRef {
  /**
   * Will tell the drawer to close, but still needs
   * @returns
   */
  closeDrawer: (callback: () => void) => void;
}

export const Drawer = forwardRef<DrawerRef, DrawerProps>(function Drawer(
  { children, visible, onClose, style },
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
  const { height: keyboardHeight } = useKeyboardAnimation();
  const { bottom } = useSafeAreaInsets();

  const animtedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translation.value }],
    paddingBottom: Platform.OS === "ios" ? keyboardHeight.value + bottom : 0,
  }));

  if (!visible) {
    return null;
  }

  return (
    <DrawerContext.Provider value={{ closeDrawer: handleClose }}>
      <Portal>
        {/* A bit of a pain but have to wrap this in a gesture handler */}
        <GestureHandlerRootView style={styles.gestureHandlerContainer}>
          <TouchableWithoutFeedback onPress={handleClose}>
            <ReanimatedView style={[styles.backdrop, backgroundStyle]} />
          </TouchableWithoutFeedback>
          <GestureDetector gesture={composed}>
            <ReanimatedView
              style={[styles.trayContainer, animtedStyle, style]}
              layout={LinearTransition.springify()}
            >
              <View style={styles.handle} />
              {children}
            </ReanimatedView>
          </GestureDetector>
        </GestureHandlerRootView>
      </Portal>
    </DrawerContext.Provider>
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
