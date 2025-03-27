import * as ExpoHaptics from "expo-haptics"
import { runOnJS } from "react-native-reanimated"

const impactFeedbackStyle = ExpoHaptics.ImpactFeedbackStyle

const notificationFeedbackStyles = ExpoHaptics.NotificationFeedbackType

const selectionAsync = () => {
  ExpoHaptics.impactAsync(impactFeedbackStyle.Light).catch(console.error) // Selection doens't seem to work? So use light impact for now
}

const successNotificationAsync = () => {
  ExpoHaptics.notificationAsync(notificationFeedbackStyles.Success).catch(console.error)
}

const warningNotificationAsync = () => {
  ExpoHaptics.notificationAsync(notificationFeedbackStyles.Warning).catch(console.error)
}

const errorNotificationAsync = () => {
  ExpoHaptics.notificationAsync(notificationFeedbackStyles.Error).catch(console.error)
}

const lightImpactAsync = () => {
  ExpoHaptics.impactAsync(impactFeedbackStyle.Light).catch(console.error)
}

const mediumImpactAsync = () => {
  ExpoHaptics.impactAsync(impactFeedbackStyle.Medium).catch(console.error)
}

const heavyImpactAsync = () => {
  ExpoHaptics.impactAsync(impactFeedbackStyle.Heavy).catch(console.error)
}

const softImpactAsync = () => {
  ExpoHaptics.impactAsync(impactFeedbackStyle.Soft).catch(console.error)
}

const rigidImpactAsync = () => {
  ExpoHaptics.impactAsync(impactFeedbackStyle.Rigid).catch(console.error)
}

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
    "worklet"
    runOnJS(selectionAsync)()
  },
  successNotificationAsyncAnimated: () => {
    "worklet"
    runOnJS(successNotificationAsync)()
  },
  warningNotificationAsyncAnimated: () => {
    "worklet"
    runOnJS(warningNotificationAsync)()
  },
  errorNotificationAsyncAnimated: () => {
    "worklet"
    runOnJS(errorNotificationAsync)()
  },
  lightImpactAsyncAnimated: () => {
    "worklet"
    runOnJS(lightImpactAsync)()
  },
  mediumImpactAsyncAnimated: () => {
    "worklet"
    runOnJS(mediumImpactAsync)()
  },
  heavyImpactAsyncAnimated: () => {
    "worklet"
    runOnJS(heavyImpactAsync)()
  },
  softImpactAsyncAnimated: () => {
    "worklet"
    runOnJS(softImpactAsync)()
  },
  rigidImpactAsyncAnimated: () => {
    "worklet"
    runOnJS(rigidImpactAsync)()
  },
}
