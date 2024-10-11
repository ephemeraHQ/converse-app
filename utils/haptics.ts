import * as ExpoHaptics from "expo-haptics";
import { runOnJS } from "react-native-reanimated";

import { sentryTrackError } from "./sentry";

const impactFeedbackStyle = ExpoHaptics.ImpactFeedbackStyle;

const notificationFeedbackStyles = ExpoHaptics.NotificationFeedbackType;

const selectionAsync = () => {
  ExpoHaptics.impactAsync(impactFeedbackStyle.Light).catch(sentryTrackError); // Selection doens't seem to work? So use light impact for now
};

const successNotificationAsync = () => {
  ExpoHaptics.notificationAsync(notificationFeedbackStyles.Success).catch(
    sentryTrackError
  );
};

const warningNotificationAsync = () => {
  ExpoHaptics.notificationAsync(notificationFeedbackStyles.Warning).catch(
    sentryTrackError
  );
};

const errorNotificationAsync = () => {
  ExpoHaptics.notificationAsync(notificationFeedbackStyles.Error).catch(
    sentryTrackError
  );
};

const lightImpactAsync = () => {
  ExpoHaptics.impactAsync(impactFeedbackStyle.Light).catch(sentryTrackError);
};

const mediumImpactAsync = () => {
  ExpoHaptics.impactAsync(impactFeedbackStyle.Medium).catch(sentryTrackError);
};

const heavyImpactAsync = () => {
  ExpoHaptics.impactAsync(impactFeedbackStyle.Heavy).catch(sentryTrackError);
};

const softImpactAsync = () => {
  ExpoHaptics.impactAsync(impactFeedbackStyle.Soft).catch(sentryTrackError);
};

const rigidImpactAsync = () => {
  ExpoHaptics.impactAsync(impactFeedbackStyle.Rigid).catch(sentryTrackError);
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
