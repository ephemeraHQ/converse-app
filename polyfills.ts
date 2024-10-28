// Random values must be imported first for security.
import "@walletconnect/react-native-compat";
import "react-native-get-random-values";
import "@ethersproject/shims";

import "text-encoding";
import "@azure/core-asynciterator-polyfill";
import "react-native-polyfill-globals/auto";
import { Crypto as WebCrypto } from "@peculiar/webcrypto";
import "@stardazed/streams-polyfill";
import { NativeModules } from "react-native";
import ViewReactNativeStyleAttributes from "react-native/Libraries/Components/View/ReactNativeStyleAttributes";
ViewReactNativeStyleAttributes.scaleY = true;

// Necessary for @peculiar/webcrypto.
if (!global.Buffer) {
  global.Buffer = require("safe-buffer").Buffer;
}
if (!global.crypto.subtle) {
  // Only polyfill SubtleCrypto as we prefer `react-native-get-random-values` for getRandomValues.
  const webCrypto = new WebCrypto();
  (global.crypto as any).subtle = webCrypto.subtle;
}

function randomUUID() {
  if (NativeModules.RandomUuid) {
    return NativeModules.RandomUuid.getRandomUuid();
  }

  // Expo SDK 48+
  if (
    global.expo &&
    global.expo.modules &&
    global.expo.modules.ExpoCrypto &&
    global.expo.modules.ExpoCrypto.randomUUID
  ) {
    // ExpoCrypto.randomUUID() sometimes returns uppercase UUIDs, so we convert them to lowercase
    return global.expo.modules.ExpoCrypto.randomUUID().toLowerCase();
  }

  throw new Error("No random UUID available");
}

if (typeof global.crypto.randomUUID !== "function") {
  global.crypto.randomUUID = randomUUID;
}
