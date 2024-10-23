export const DependencyFlavors = {
  iosSimulator: "iOS Simulator",
  iosDevice: "iOS Device",
  androidEmulator: "Android Emulator",
  androidDevice: "Android Device",
  jest: "Jest Test Environment",
  detox: "Detox Test Environment",
  Unknown: "Unknown",
} as const;

export type DependencyFlavor =
  (typeof DependencyFlavors)[keyof typeof DependencyFlavors];
