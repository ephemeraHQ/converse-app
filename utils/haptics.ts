import * as ExpoHaptics from "expo-haptics";
import { runOnJS } from "react-native-reanimated";

import { sentryTrackError } from "./sentry";

const impactFeedbackStyle = ExpoHaptics.ImpactFeedbackStyle;

const notificationFeedbackStyles = ExpoHaptics.NotificationFeedbackType;

const selectionAsync = () => {
  try {
    // logger.debug("selectionAsync");
    ExpoHaptics.impactAsync(impactFeedbackStyle.Light).catch(sentryTrackError); // Selection doens't seem to work? So use light impact for now
  } catch (error) {
    sentryTrackError(error);
  }
};

const successNotificationAsync = () => {
  try {
    // logger.debug("notificationAsync");
    ExpoHaptics.notificationAsync(notificationFeedbackStyles.Success).catch(
      sentryTrackError
    );
  } catch (error) {
    sentryTrackError(error);
  }
};

const warningNotificationAsync = () => {
  try {
    // logger.debug("notificationAsync");
    ExpoHaptics.notificationAsync(notificationFeedbackStyles.Warning).catch(
      sentryTrackError
    );
  } catch (error) {
    sentryTrackError(error);
  }
};

const errorNotificationAsync = () => {
  try {
    // logger.debug("notificationAsync");
    ExpoHaptics.notificationAsync(notificationFeedbackStyles.Error).catch(
      sentryTrackError
    );
  } catch (error) {
    sentryTrackError(error);
  }
};

const lightImpactAsync = () => {
  try {
    // logger.debug("lightImpactAsync");
    ExpoHaptics.impactAsync(impactFeedbackStyle.Light).catch(sentryTrackError);
  } catch (error) {
    sentryTrackError(error);
  }
};

const mediumImpactAsync = () => {
  try {
    // logger.debug("mediumImpactAsync");
    ExpoHaptics.impactAsync(impactFeedbackStyle.Medium).catch(sentryTrackError);
  } catch (error) {
    sentryTrackError(error);
  }
};

const heavyImpactAsync = () => {
  try {
    // logger.debug("heavyImpactAsync");
    ExpoHaptics.impactAsync(impactFeedbackStyle.Heavy).catch(sentryTrackError);
  } catch (error) {
    sentryTrackError(error);
  }
};

const softImpactAsync = () => {
  try {
    // logger.debug("softImpactAsync");
    ExpoHaptics.impactAsync(impactFeedbackStyle.Soft).catch(sentryTrackError);
  } catch (error) {
    sentryTrackError(error);
  }
};

const rigidImpactAsync = () => {
  try {
    // logger.debug("rigidImpactAsync");
    ExpoHaptics.impactAsync(impactFeedbackStyle.Rigid).catch(sentryTrackError);
  } catch (error) {
    sentryTrackError(error);
  }
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
