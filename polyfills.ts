/* prettier-ignore */
// IMPORTANT: DO NOT CHANGE THE ORDER OF THESE IMPORTS
import "@walletconnect/react-native-compat";
// Privy require those in this order https://github.com/privy-io/expo-starter/blob/main/entrypoint.js
import "fast-text-encoding";
import "react-native-get-random-values";
import "@ethersproject/shims";
import "@azure/core-asynciterator-polyfill";
import "react-native-polyfill-globals/auto";
import { Crypto as WebCrypto } from "@peculiar/webcrypto";
import "@stardazed/streams-polyfill";
import "react-native-gesture-handler";
import "react-native-url-polyfill/auto";

// Necessary for @peculiar/webcrypto.
if (!global.Buffer) {
  global.Buffer = require("safe-buffer").Buffer;
}

if (!global.crypto.subtle) {
  // Only polyfill SubtleCrypto as we prefer `react-native-get-random-values` for getRandomValues.
  const webCrypto = new WebCrypto();
  (global.crypto as any).subtle = webCrypto.subtle;
}
