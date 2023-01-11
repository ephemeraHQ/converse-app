// Random values must be imported first for security.
import "react-native-get-random-values";
import "@ethersproject/shims";

import "text-encoding";
import "@azure/core-asynciterator-polyfill";
import "react-native-polyfill-globals/auto";
import { Crypto as WebCrypto } from "@peculiar/webcrypto";

import "@stardazed/streams-polyfill";

// Necessary for @peculiar/webcrypto.
if (!global.Buffer) {
  global.Buffer = require("safe-buffer").Buffer;
}
if (!global.crypto.subtle) {
  // Only polyfill SubtleCrypto as we prefer `react-native-get-random-values` for getRandomValues.
  const webCrypto = new WebCrypto();
  (global.crypto as any).subtle = webCrypto.subtle;
}
