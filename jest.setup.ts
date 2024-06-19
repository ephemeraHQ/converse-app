// @ts-ignore
import mockRNDeviceInfo from "react-native-device-info/jest/react-native-device-info-mock";

jest.mock("expo-constants", () => {
  return {
    expoConfig: {
      extra: {
        DEV_API_URI: process.env.DEV_API_URI,
      },
    },
  };
});

jest.mock("react-native-webview", () => {
  const { View } = require("react-native");
  return {
    WebView: () => View,
  };
});
jest.mock("react-native-device-info", () => mockRNDeviceInfo);
jest.mock("react-native/Libraries/EventEmitter/NativeEventEmitter");
jest.mock("./utils/evm/privy", () => ({
  getPrivyRequestHeaders: jest.fn(),
}));
