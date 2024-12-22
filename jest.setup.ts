// @ts-ignore
import mockRNDeviceInfo from "react-native-device-info/jest/react-native-device-info-mock";
// todo(lustig): figure out how to use dotenv in jest - this was working before I left
// require("dotenv").config();

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
    DocumentDirectoryPath: "",
    ExternalDirectoryPath: jest.fn(),
    ExternalStorageDirectoryPath: jest.fn(),
    TemporaryDirectoryPath: "",
    LibraryDirectoryPath: jest.fn(),
    PicturesDirectoryPath: jest.fn(),
  };
});
jest.mock("./utils/evm/privy", () => ({
  getPrivyRequestHeaders: jest.fn(),
}));

jest.mock("rn-fetch-blob", () => {
  return {
    DocumentDir: () => {},
    polyfill: () => {},
  };
});

jest.mock("@sentry/react-native", () => ({
  init: jest.fn(),
  addBreadcrumb: jest.fn(),
}));
jest.mock("expo-constants", () => ({}));

jest.mock("uuid", () => ({
  v4: jest.fn(() => "uuidv4"),
}));

jest.mock("path", () => ({
  join: jest.fn(() => ""),
}));

jest.mock("expo-localization", () => ({
  // TODO: Update later to begin returning more locales and mock within individual tests
  getLocales: jest.fn(() => [{ languageTag: "en-US" }]),
}));
