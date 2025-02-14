## SpecStory

## Resolving React Native Fetch API Error (2/6/2025, 2:23:09 PM)

_**User**_

I just removed "react-native-fetch-api" from my package.sjon but still get error "converse-app/node_modules/react-native-polyfill-globals/src/fetch.js: react-native-fetch-api could not be found within the project or in these directories:"

why so? I thought it was a peer deps so will be added automaticayll no? @https://www.npmjs.com/package/react-native-polyfill-globals 

---

_**Assistant**_

Based on the error and the npm documentation, even though react-native-fetch-api is listed as a peer dependency of react-native-polyfill-globals, peer dependencies are not installed automatically. You need to install peer dependencies manually.

Let me explain the changes needed:

```typescript:polyfills.ts
// ... existing code ...
// Remove or comment out react-native-polyfill-globals/auto since it's trying to use fetch polyfill
// import "react-native-polyfill-globals/auto";

// Instead, import only the specific polyfills you need:
import { polyfill as polyfillBase64 } from 'react-native-polyfill-globals/src/base64';
import { polyfill as polyfillEncoding } from 'react-native-polyfill-globals/src/encoding';
import { polyfill as polyfillReadableStream } from 'react-native-polyfill-globals/src/readable-stream';
import { polyfill as polyfillURL } from 'react-native-polyfill-globals/src/url';
import { polyfill as polyfillCrypto } from 'react-native-polyfill-globals/src/crypto';

// Call the polyfills you want to use
polyfillBase64();
polyfillEncoding();
polyfillReadableStream();
polyfillURL();
polyfillCrypto();
// ... existing code ...
```

You have two options to fix this:

1. **Recommended**: Selectively import only the polyfills you need (as shown above) and avoid the fetch polyfill since you removed react-native-fetch-api

2. **Alternative**: If you actually need the fetch polyfill, reinstall react-native-fetch-api:
```bash
npm install react-native-fetch-api
```

The error occurs because react-native-polyfill-globals/auto tries to load all polyfills including the fetch polyfill, which requires react-native-fetch-api. Peer dependencies need to be installed manually - they're just listed as peer dependencies to indicate compatibility requirements.

---

_**User**_

For the code present, we get this error:
```
Could not find a declaration file for module 'react-native-polyfill-globals/src/encoding'. '/Users/thierryskoda/Programming/converse-app/node_modules/react-native-polyfill-globals/src/encoding.js' implicitly has an 'any' type.
  Try `npm i --save-dev @types/react-native-polyfill-globals` if it exists or add a new declaration (.d.ts) file containing `declare module 'react-native-polyfill-globals/src/encoding';`
```
How can I resolve this? If you propose a fix, please make it concise.

---

_**Assistant**_

Create a new file `types/react-native-polyfill-globals.d.ts` with:

```typescript:types/react-native-polyfill-globals.d.ts
declare module 'react-native-polyfill-globals/src/base64' {
  export function polyfill(): void;
}
declare module 'react-native-polyfill-globals/src/encoding' {
  export function polyfill(): void;
}
declare module 'react-native-polyfill-globals/src/readable-stream' {
  export function polyfill(): void;
}
declare module 'react-native-polyfill-globals/src/url' {
  export function polyfill(): void;
}
declare module 'react-native-polyfill-globals/src/crypto' {
  export function polyfill(): void;
}
```

Make sure your `tsconfig.json` includes the types directory in the `include` array.

---

_**User**_

but why the fuck i get  those error ? In the npm it says we can import them

---

_**Assistant**_

The issue occurs because while the package works at runtime, it doesn't include TypeScript type definitions (`.d.ts` files). This is actually a limitation/oversight of the package itself - it should ideally ship with its own type definitions.

You have three options:

1. **Quick fix**: Add `// @ts-ignore` above each import:
```typescript:polyfills.ts
// @ts-ignore
import { polyfill as polyfillBase64 } from "react-native-polyfill-globals/src/base64";
// @ts-ignore
import { polyfill as polyfillEncoding } from "react-native-polyfill-globals/src/encoding";
// ... etc
```

2. **Better fix**: Create type definitions as shown in my previous response

3. **Best fix**: Open an issue/PR on the `react-native-polyfill-globals` repository to add proper TypeScript support

The package works fine in JavaScript, but TypeScript needs explicit type information to understand what's being imported.

---



---

