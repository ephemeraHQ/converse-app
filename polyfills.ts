// IMPORTANT: DO NOT CHANGE THE ORDER OF THESE IMPORTS
// These imports must be in this specific order for polyfills to work correctly
import "@ethersproject/shims";
import "@walletconnect/react-native-compat";
import "react-native-get-random-values";

import "@azure/core-asynciterator-polyfill";
import { Crypto as WebCrypto } from "@peculiar/webcrypto";
import "@stardazed/streams-polyfill";
import "react-native-polyfill-globals/auto";
import "text-encoding";

// Necessary for @peculiar/webcrypto.
if (!global.Buffer) {
  global.Buffer = require("safe-buffer").Buffer;
}
if (!global.crypto.subtle) {
  // Only polyfill SubtleCrypto as we prefer `react-native-get-random-values` for getRandomValues.
  const webCrypto = new WebCrypto();
  (global.crypto as any).subtle = webCrypto.subtle;
}
