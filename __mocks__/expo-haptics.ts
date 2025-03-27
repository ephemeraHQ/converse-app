// Jest mock for expo-haptics

/*
  During Expo 52 upgrade haptics were failing in tests, so mocked it for now
*/

enum ImpactFeedbackStyle {
  Light = "light",
  Medium = "medium",
  Heavy = "heavy",
  Soft = "soft",
  Rigid = "rigid",
}

enum NotificationFeedbackType {
  Success = "success",
  Warning = "warning",
  Error = "error",
}

const impactAsync = jest.fn(async (style: ImpactFeedbackStyle) => {})
const notificationAsync = jest.fn(async (type: NotificationFeedbackType) => {})

const MockedExpoHaptics = {
  impactAsync,
  notificationAsync,
  ImpactFeedbackStyle,
  NotificationFeedbackType,
}

export { impactAsync, notificationAsync, ImpactFeedbackStyle, NotificationFeedbackType }

export default MockedExpoHaptics
