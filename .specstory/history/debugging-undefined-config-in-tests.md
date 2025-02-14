## SpecStory

## Debugging Undefined Config in Tests (1/27/2025, 9:28:22 AM)

_**User**_

why does "config" is undefeind here? Check @config @index.ts it should work no? I think only in test

---

_**Assistant**_

Looking at the error and the code, I understand the issue. The problem is likely occurring in a test environment where the module imports and environment variables might not be properly set up.

The `config` import from "@/config" should work in normal circumstances, but in tests, you might need to:

1. Either mock the config module
2. Or ensure the test environment has the necessary environment variables and module resolution set up correctly

Here's how you can modify the logger to handle this case:

```typescript:utils/logger.ts
// ... existing code ...

// Add a fallback for tests or when config is undefined
const loggerColorScheme = config?.loggerColorScheme ?? "light";

const activeColorScheme: ReactNativeLogColorScheme =
  loggerColorScheme === "dark" ? darkSystemColorScheme : lightSystemColorScheme;

// ... existing code ...
```

For your test files, you should mock the config module. Here's an example of how to do it:

```typescript:__mocks__/config.ts
export const config = {
  loggerColorScheme: "light",
  // ... other required config properties
};
```

Then in your test setup file (like `jest.setup.js` or similar):

```javascript:jest.setup.js
jest.mock("@/config", () => ({
  config: {
    loggerColorScheme: "light",
    // ... other required config properties
  }
}));
```

This will ensure the logger works both in production and test environments. Let me know if you need help setting up the mocks or if you have any other questions!

---

_**User**_

i think it need to call getConfig, but why?

---

_**Assistant**_

Ah, I see what's happening. The issue is related to the circular dependency between the modules. Let me explain:

1. In `logger.ts`, you're importing `config` from "@/config"
2. In `config/index.ts`, you're importing `isDev` from "@/utils/getEnv"
3. And in `getEnv.ts`, you might be using the logger, creating a circular dependency

When this happens in Node.js/TypeScript, one of the modules might get an undefined value because the exports aren't fully initialized when they're needed.

Here's how to fix it:

```typescript:utils/logger.ts
import { getConfig } from "@/config";  // Import getConfig instead of config

// ... existing code ...

// Call getConfig() when needed
const activeColorScheme: ReactNativeLogColorScheme =
  getConfig().loggerColorScheme === "dark"
    ? darkSystemColorScheme
    : lightSystemColorScheme;

// ... existing code ...
```

And modify the config/index.ts to export the function:

```typescript:config/index.ts
import { isDev, isPreview } from "@/utils/getEnv";
import { devConfig } from "./dev";
import { prodConfig } from "./prod";
import { previewConfig } from "@/config/preview";

export const getConfig = () => {
  if (isDev) return devConfig;
  if (isPreview) return previewConfig;
  return prodConfig;
};

// You can keep this for backwards compatibility
export const config = getConfig();
```

By importing and calling `getConfig()` directly, we ensure that we get the config value after all modules are properly initialized. This is a common pattern to break circular dependencies and ensure proper module initialization.

The reason this works is that function declarations are hoisted and available immediately, while the result of function calls (like in the original `config` export) might not be available if there are circular dependencies.

---

_**User**_

look in @getEnv.ts  idon't import anything no?

---

_**Assistant**_

Ah, you're right! I apologize for my previous explanation about circular dependencies. Looking at `getEnv.ts`, there's actually no circular dependency since it doesn't import the logger or any other modules.

The issue is simpler - it's about the initialization timing. When you export a constant that's the result of a function call (like in config/index.ts):

```typescript
export const config = getConfig();
```

This value is computed once when the module is first loaded. However, in some environments (particularly tests), the module might be loaded before the environment variables or `__DEV__` global is properly set up.

That's why calling `getConfig()` directly works better - it evaluates the environment conditions at the time of the call rather than at module load time.

So the fix remains the same, but the reason is different:

```typescript:utils/logger.ts
import { getConfig } from "@/config";

// ... existing code ...

const activeColorScheme: ReactNativeLogColorScheme =
  getConfig().loggerColorScheme === "dark"
    ? darkSystemColorScheme
    : lightSystemColorScheme;

// ... existing code ...
```

This ensures we get the correct config based on the environment at runtime rather than at module initialization time.

---

_**User**_

but evne if i do "export const config = devConfig;" it doenst work?

---

_**Assistant**_



Ah, you're right! Looking at your `config/index.ts` again:

```typescript:config/index.ts
import { isDev, isPreview } from "@/utils/getEnv";
import { devConfig } from "./dev";
import { prodConfig } from "./prod";
import { previewConfig } from "@/config/preview";

const getConfig = () => {
  if (isDev) return devConfig;
  if (isPreview) return previewConfig;
  return prodConfig;
};

export const config = devConfig;  // This should work!
```

If you're explicitly exporting `devConfig` and it's still undefined, then the issue is likely that either:

1. `devConfig` isn't properly exported from `./dev`, or
2. The module resolution isn't working correctly

Could you share the contents of `config/dev.ts`? That might help us understand why `devConfig` is undefined.

Also, you could try debugging by adding a console.log:

```typescript:config/index.ts
import { devConfig } from "./dev";
console.log('devConfig:', devConfig);  // Add this to see what's being imported

export const config = devConfig;
```

This would help us see if `devConfig` is undefined when the module is loaded.

---

_**User**_

@dev.ts 

---

_**Assistant**_

Looking at `dev.ts`, I notice that the config relies on several environment variables like `process.env.EXPO_PUBLIC_DEV_XMTP_ENV`, `process.env.EXPO_PUBLIC_DEV_API_URI`, etc.

If these environment variables aren't set up properly when the module is loaded (especially in a test environment), some of the config properties might be undefined.

Let's try to debug this. Add some logging in `config/index.ts`:

```typescript:config/index.ts
import { isDev, isPreview } from "@/utils/getEnv";
import { devConfig } from "./dev";
import { prodConfig } from "./prod";
import { previewConfig } from "./preview";

console.log('Environment:', { isDev, isPreview });
console.log('Configs:', { 
  devConfig,
  process_env: {
    EXPO_PUBLIC_DEV_XMTP_ENV: process.env.EXPO_PUBLIC_DEV_XMTP_ENV,
    EXPO_PUBLIC_DEV_API_URI: process.env.EXPO_PUBLIC_DEV_API_URI,
  }
});

export const config = devConfig;
```

This will help us see:
1. What environment we're in
2. If devConfig is being imported correctly
3. If the environment variables are available

Are you seeing this issue in a test environment or in the actual app? If it's in tests, you'll need to set up the environment variables in your test setup. If it's in the actual app, we should check if your `.env` file is being loaded correctly.

---



---

