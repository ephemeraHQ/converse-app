import { captureError } from "@/utils/capture-error";
import * as ExpoHaptics from "expo-haptics";
import { runOnJS } from "react-native-reanimated";

const impactFeedbackStyle = ExpoHaptics.ImpactFeedbackStyle;

const notificationFeedbackStyles = ExpoHaptics.NotificationFeedbackType;

const selectionAsync = () => {
  ExpoHaptics.impactAsync(impactFeedbackStyle.Light).catch(captureError); // Selection doens't seem to work? So use light impact for now
};

const successNotificationAsync = () => {
  ExpoHaptics.notificationAsync(notificationFeedbackStyles.Success).catch(
    captureError
  );
};

const warningNotificationAsync = () => {
  ExpoHaptics.notificationAsync(notificationFeedbackStyles.Warning).catch(
    captureError
  );
};

const errorNotificationAsync = () => {
  ExpoHaptics.notificationAsync(notificationFeedbackStyles.Error).catch(
    captureError
  );
};

const lightImpactAsync = () => {
  ExpoHaptics.impactAsync(impactFeedbackStyle.Light).catch(captureError);
};

const mediumImpactAsync = () => {
  ExpoHaptics.impactAsync(impactFeedbackStyle.Medium).catch(captureError);
};

const heavyImpactAsync = () => {
  ExpoHaptics.impactAsync(impactFeedbackStyle.Heavy).catch(captureError);
};

const softImpactAsync = () => {
  ExpoHaptics.impactAsync(impactFeedbackStyle.Soft).catch(captureError);
};

const rigidImpactAsync = () => {
  ExpoHaptics.impactAsync(impactFeedbackStyle.Rigid).catch(captureError);
};

export const Haptics = {
  notificationFeedbackStyles,
  selectionAsync,
  successNotificationAsync,
  warningNotificationAsync,
  errorNotificationAsync,
  lightImpactAsync,
  mediumImpactAsync,
  heavyImpactAsync,
  softImpactAsync,
  rigidImpactAsync,

  /**
   * Animated
   */
  selectionAsyncAnimated: () => {
    "worklet";
    runOnJS(selectionAsync)();
  },
  successNotificationAsyncAnimated: () => {
    "worklet";
    runOnJS(successNotificationAsync)();
  },
  warningNotificationAsyncAnimated: () => {
    "worklet";
    runOnJS(warningNotificationAsync)();
  },
  errorNotificationAsyncAnimated: () => {
    "worklet";
    runOnJS(errorNotificationAsync)();
  },
  lightImpactAsyncAnimated: () => {
    "worklet";
    runOnJS(lightImpactAsync)();
  },
  mediumImpactAsyncAnimated: () => {
    "worklet";
    runOnJS(mediumImpactAsync)();
  },
  heavyImpactAsyncAnimated: () => {
    "worklet";
    runOnJS(heavyImpactAsync)();
  },
  softImpactAsyncAnimated: () => {
    "worklet";
    runOnJS(softImpactAsync)();
  },
  rigidImpactAsyncAnimated: () => {
    "worklet";
    runOnJS(rigidImpactAsync)();
  },
};
