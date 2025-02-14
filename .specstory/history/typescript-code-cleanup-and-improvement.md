## SpecStory

## TypeScript Code Cleanup and Improvement (1/20/2025, 5:44:39 PM)

_**User**_

clean this

---

_**Assistant**_

I'll help clean up this file according to the style guide. Here are the main changes needed:

1. Replace `any` types with proper TypeScript types
2. Use object parameters for functions
3. Add proper type definitions
4. Add more descriptive comments
5. Clean up the error filtering logic

Here's the cleaned up version:

```typescript:utils/sentry.ts
import { getEnv, isProd } from "@/utils/getEnv";
import * as Sentry from "@sentry/react-native";
import type { ErrorEvent, EventHint, Breadcrumb, Scope } from "@sentry/types";
import { Platform } from "react-native";
import { config } from "../config";
import versions from "../versions.json";

// Determines whether to disable Sentry's native crash reporting on iOS
const DISABLE_IOS_NATIVE_SENTRY = false;

// Error patterns that should not be reported to Sentry
type ErrorFilter = {
  type: string;
  value: string;
};

const errorsToFilterOut: ErrorFilter[] = [
  { type: "AxiosError", value: "Network Error" },
];

export const initSentry = () => {
  const sentryOptions: Sentry.ReactNativeOptions = {
    dsn: config.sentryDSN,
    debug: false,
    enabled: isProd,
    environment: getEnv(),
    beforeSend: (event: ErrorEvent, hint: EventHint) => {
      if (event.exception?.values?.length === 1) {
        const exception = event.exception.values[0];
        const shouldFilter = errorsToFilterOut.some(
          (e) => exception.type === e.type && exception.value === e.value
        );
        if (shouldFilter) {
          return null;
        }
      }
      return event;
    },
  };

  // ... existing code ...

  Sentry.init(sentryOptions);
};

type BreadcrumbParams = {
  message: string;
  forceSafe?: boolean;
};

export function sentryAddBreadcrumb({ message, forceSafe = false }: BreadcrumbParams) {
  const breadcrumbData: Record<string, string> = {
    base64Message: Buffer.from(message).toString("base64"),
  };

  if (forceSafe) {
    breadcrumbData.safeValue = message;
  }

  const breadcrumb: Breadcrumb = {
    category: "converse",
    message,
    level: "info",
    data: breadcrumbData,
  };

  Sentry.addBreadcrumb(breadcrumb);
}

type TrackMessageParams = {
  message: string;
  extras?: Record<string, unknown>;
};

export function sentryTrackMessage({ message, extras = {} }: TrackMessageParams) {
  console.log(`[Sentry] ${message}`, extras);
  Sentry.withScope((scope) => {
    scope.setExtras(extras);
    Sentry.captureMessage(message);
  });
}

type TrackErrorParams = {
  error: Error;
  extras?: Record<string, unknown>;
};

export function sentryTrackError({ error, extras = {} }: TrackErrorParams) {
  Sentry.withScope((scope) => {
    scope.setExtras(extras);
    Sentry.captureException(error);
  });
}
```

Key changes made:
- Added proper TypeScript types instead of `any`
- Moved error filters to a constant
- Used object parameters for functions
- Added type definitions for parameters
- Added descriptive comments for important sections
- Used proper function declarations with the `function` keyword
- Made the code more readable with better type safety
- Used Record<string, unknown> instead of any for extras objects
- Added proper typing for breadcrumb data

The iOS-specific code block was left unchanged as it appears to be working as intended.

---



---

