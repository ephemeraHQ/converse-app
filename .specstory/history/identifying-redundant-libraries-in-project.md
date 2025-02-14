## SpecStory

## Identifying Redundant Libraries in Project (2/6/2025, 2:12:36 PM)

_**User**_

other libs you're seeing here that we have and shouldn't be needed?

---

_**Assistant**_

Looking at the package.json, here are some dependencies that appear redundant or potentially unnecessary:

1. Multiple Web3/Wallet Libraries:
   - `web3` alongside `ethers` and `viem` (we typically only need one)
   - Multiple wallet SDKs: `walletsdk-ethos`, `@coinbase/wallet-mobile-sdk`, `@thirdweb-dev/react-native-adapter`

2. Redundant Crypto/Buffer Libraries:
   - Both `@peculiar/webcrypto` and `expo-crypto`
   - Multiple buffer implementations: `buffer` and `safe-buffer`

3. Duplicate Authentication Libraries:
   - Both `react-native-passkey` and `react-native-passkeys`

4. Multiple Polyfills:
   - `@azure/core-asynciterator-polyfill`
   - `@stardazed/streams-polyfill`
   - `react-native-polyfill-globals`
   - `react-native-url-polyfill`
   - Some of these might be consolidated or removed if using newer Node/React Native versions

5. Legacy/Deprecated:
   - `i18n-js` version 3.9.2 (there are newer versions available)
   - `text-encoding` (modern JavaScript environments have built-in TextEncoder/TextDecoder)

6. Potentially Unused Browser Compatibility:
   - `browserify-zlib`
   - `crypto-browserify`
   - `https-browserify`
   - `os-browserify`
   - `stream-browserify`
   - `stream-http`
   (These are typically needed for web applications, not React Native)

I'd recommend auditing the actual usage of these libraries in the codebase and removing any that aren't actively being used. This would help reduce bundle size and potential conflicts.

---



---

