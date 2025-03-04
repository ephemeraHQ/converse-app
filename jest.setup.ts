// @ts-ignore
// todo(lustig): figure out how to use dotenv in jest - this was working before I left
// require("dotenv").config();

jest.mock("react-native-webview", () => {
  const MockWebView = () => null
  MockWebView.defaultProps = {}
  return {
    WebView: MockWebView,
    default: MockWebView,
  }
})
jest.mock("react-native/Libraries/EventEmitter/NativeEventEmitter")
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
  }
})

jest.mock("rn-fetch-blob", () => {
  return {
    DocumentDir: () => {},
    polyfill: () => {},
  }
})

jest.mock("@sentry/react-native", () => ({
  init: jest.fn(),
  addBreadcrumb: jest.fn(),
}))
jest.mock("expo-constants", () => ({}))

jest.mock("uuid", () => ({
  v4: jest.fn(() => "uuidv4"),
}))

jest.mock("expo-localization", () => ({
  // TODO: Update later to begin returning more locales and mock within individual tests
  getLocales: jest.fn(() => [{ languageTag: "en-US" }]),
}))

// Mock config module
jest.mock("@/config", () => ({
  __esModule: true,
  getConfig: () => ({
    loggerColorScheme: "light",
    debugMenu: false,
    env: "test",
    xmtpEnv: "dev",
    deprecatedApiURI: "https://test.api",
    // Add other config values as needed by tests
  }),
  default: {
    loggerColorScheme: "light",
    debugMenu: false,
    env: "test",
    xmtpEnv: "dev",
    deprecatedApiURI: "https://test.api",
    // Add other config values as needed by tests
  },
}))

jest.mock("@react-native-firebase/app-check", () => {
  return {
    firebase: {
      appCheck: () => ({
        getLimitedUseToken: jest.fn().mockResolvedValue({ token: "mock-token" }),
        getToken: jest.fn().mockResolvedValue({ token: "mock-token" }),
        newReactNativeFirebaseAppCheckProvider: jest.fn().mockReturnValue({
          configure: jest.fn(),
        }),
        initializeAppCheck: jest.fn(),
      }),
    },
  }
})

jest.mock("@xmtp/react-native-sdk", () => ({
  Client: {
    build: jest.fn(),
    dropClient: jest.fn(),
  },
  ConversationVersion: {
    DM: "dm",
    GROUP: "group",
  },
  TextCodec: jest.fn().mockImplementation(() => ({
    contentType: "text/plain",
    encode: jest.fn(),
    decode: jest.fn(),
  })),
  ReactionCodec: jest.fn().mockImplementation(() => ({
    contentType: "reaction",
    encode: jest.fn(),
    decode: jest.fn(),
  })),
  ReadReceiptCodec: jest.fn().mockImplementation(() => ({
    contentType: "receipt",
    encode: jest.fn(),
    decode: jest.fn(),
  })),
  GroupUpdatedCodec: jest.fn().mockImplementation(() => ({
    contentType: "group-updated",
    encode: jest.fn(),
    decode: jest.fn(),
  })),
  ReplyCodec: jest.fn().mockImplementation(() => ({
    contentType: "reply",
    encode: jest.fn(),
    decode: jest.fn(),
  })),
  RemoteAttachmentCodec: jest.fn().mockImplementation(() => ({
    contentType: "remote-attachment",
    encode: jest.fn(),
    decode: jest.fn(),
  })),
  StaticAttachmentCodec: jest.fn().mockImplementation(() => ({
    contentType: "static-attachment",
    encode: jest.fn(),
    decode: jest.fn(),
  })),
}))

jest.mock("@privy-io/expo", () => ({
  usePrivy: jest.fn().mockReturnValue({
    login: jest.fn(),
    logout: jest.fn(),
    authenticated: false,
    ready: true,
    user: null,
  }),
}))
