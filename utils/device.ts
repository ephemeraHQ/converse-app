import DeviceInfo from "react-native-device-info";

export const isDesktop = DeviceInfo.getDeviceType() === "Desktop";
