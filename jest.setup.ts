// @ts-ignore
import mockRNDeviceInfo from "react-native-device-info/jest/react-native-device-info-mock";

jest.mock("expo-constants", () => {
  return {
    expoConfig: {
      extra: {
        DEV_API_URI: (process.env as any).DEV_API_URI,
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
jest.mock("react-native-fs", () => {
  return {
    mkdir: jest.fn(),
    moveFile: jest.fn(),
    copyFile: jest.fn(),
    pathForBundle: jest.fn(),
    pathForGroup: jest.fn(),
    getFSInfo: jest.fn(),
    getAllExternalFilesDirs: jest.fn(),
    unlink: jest.fn(),
    exists: jest.fn(),
    stopDownload: jest.fn(),
    resumeDownload: jest.fn(),
    isResumable: jest.fn(),
    stopUpload: jest.fn(),
    completeHandlerIOS: jest.fn(),
    readDir: jest.fn(),
    readDirAssets: jest.fn(),
    existsAssets: jest.fn(),
    readdir: jest.fn(),
    setReadable: jest.fn(),
    stat: jest.fn(),
    readFile: jest.fn(),
    read: jest.fn(),
    readFileAssets: jest.fn(),
    hash: jest.fn(),
    copyFileAssets: jest.fn(),
    copyFileAssetsIOS: jest.fn(),
    copyAssetsVideoIOS: jest.fn(),
    writeFile: jest.fn(),
    appendFile: jest.fn(),
    write: jest.fn(),
    downloadFile: jest.fn(),
    uploadFiles: jest.fn(),
    touch: jest.fn(),
    MainBundlePath: jest.fn(),
    CachesDirectoryPath: jest.fn(),
    DocumentDirectoryPath: jest.fn(),
    ExternalDirectoryPath: jest.fn(),
    ExternalStorageDirectoryPath: jest.fn(),
    TemporaryDirectoryPath: jest.fn(),
    LibraryDirectoryPath: jest.fn(),
    PicturesDirectoryPath: jest.fn(),
  };
});
jest.mock("./utils/evm/privy", () => ({
  getPrivyRequestHeaders: jest.fn(),
}));

jest.mock("@op-engineering/op-sqlite", () => ({}));

jest.mock("rn-fetch-blob", () => {
  return {
    DocumentDir: () => {},
    polyfill: () => {},
  };
});
