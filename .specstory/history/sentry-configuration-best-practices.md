## SpecStory

## Sentry Configuration Best Practices (2/14/2025, 10:22:42 AM)

_**User**_

Check attentivaly the Sentry documentation and let me know what's missing in my Sentry config to make it very good and clean and etc...
@https://docs.sentry.io/platforms/react-native/features/ 

---

_**Assistant**_

Based on the Sentry documentation and best practices, here are some recommended improvements to enhance your Sentry configuration:

```typescript:utils/sentry.ts
import { getEnv, isDev } from "@/utils/getEnv";
import * as Sentry from "@sentry/react-native";
import type { Breadcrumb, ErrorEvent, EventHint } from "@sentry/types";
import { config } from "../config";
import { logger } from "@/utils/logger";

// Error patterns that should not be reported to Sentry
type ErrorFilter = {
  type: string;
  value: string;
};

const errorsToFilterOut: ErrorFilter[] = [
  { type: "AxiosError", value: "Network Error" },
];

export const initSentry = () => {
  Sentry.init({
    dsn: config.sentryDSN,
    debug: false,
    enabled: !isDev,
    environment: getEnv(),
    
    // Enable performance monitoring
    tracesSampleRate: isDev ? 1.0 : 0.2, // 100% in dev, 20% in prod
    enableAutoPerformanceTracking: true,
    
    // Enable session tracking
    enableAutoSessionTracking: true,
    sessionTrackingIntervalMillis: 30000, // 30 seconds
    
    // Enable view hierarchy for better debugging
    attachViewHierarchy: true,
    
    // Add more context to your events
    attachStacktrace: true,
    
    // Configure max breadcrumbs
    maxBreadcrumbs: 100,

    // Configure beforeBreadcrumb to filter sensitive data
    beforeBreadcrumb(breadcrumb) {
      // Don't record HTTP breadcrumbs for specific endpoints that might contain sensitive data
      if (
        breadcrumb.category === "http" &&
        breadcrumb.data?.url?.includes("sensitive-endpoint")
      ) {
        return null;
      }
      return breadcrumb;
    },

    beforeSend: (event: ErrorEvent, hint: EventHint) => {
      // Log to debug when events are sent
      logger.debug(`[Sentry] Sending event: ${event.event_id}`);

      // Filter out specific errors
      if (event.exception?.values?.length === 1) {
        const exception = event.exception.values[0];
        const shouldFilter = errorsToFilterOut.some(
          (e) => exception.type === e.type && exception.value === e.value
        );
        if (shouldFilter) {
          return null;
        }
      }

      // Remove sensitive data
      if (event.request?.cookies) {
        delete event.request.cookies;
      }

      // Add additional context
      event.extra = {
        ...event.extra,
        appVersion: config.version,
        buildNumber: config.buildNumber,
      };

      return event;
    },

    // Configure integrations
    integrations: [
      new Sentry.ReactNativeTracing({
        routingInstrumentation: Sentry.reactNavigationInstrumentation(),
        tracingOrigins: ["localhost", /^\//],
        // Enable specific performance metrics
        enableStallTracking: true,
        enableUserInteractionTracing: true,
        enableFileIOTracking: true,
        enableHttpAutoTracking: true,
      }),
    ],
  });
};

// ... rest of the code remains the same
```

Key improvements and additions:

1. **Performance Monitoring**:
   - Added `tracesSampleRate` with different rates for dev/prod environments
   - Enabled auto performance tracking
   - Added React Navigation instrumentation for route tracking

2. **Session Tracking**:
   - Enabled auto session tracking
   - Configured session tracking interval

3. **Enhanced Debugging**:
   - Enabled view hierarchy attachment
   - Enabled stack trace attachment
   - Configured max breadcrumbs

4. **Data Privacy & Security**:
   - Added breadcrumb filtering for sensitive data
   - Added request data cleaning in beforeSend
   - Added logging when events are sent

5. **Additional Context**:
   - Added app version and build number to events
   - Configured tracing origins

6. **Performance Features**:
   - Enabled stall tracking
   - Enabled user interaction tracing
   - Enabled file I/O tracking
   - Enabled HTTP auto tracking

To make full use of these features, you should also:

1. Add source maps uploading to your build process for better stack traces
2. Configure ProGuard mapping file uploads for Android
3. Set up proper release tracking by including version and build information
4. Consider adding user identification when applicable:

```typescript
// Example of setting user context
export function identifyUser(userId: string, email?: string) {
  Sentry.setUser({
    id: userId,
    email,
  });
}
```

These improvements will give you better insight into your application's performance and errors, while maintaining security and data privacy best practices.

---

_**User**_

anything missing if you check deeply in this doc alos? @https://docs.expo.dev/guides/using-sentry/ 

---

_**Assistant**_

Based on the Expo documentation and comparing with our current implementation, here are a few important additions we should make:

1. Add release and distribution configuration:

```typescript:utils/sentry.ts
import { getEnv, isDev } from "@/utils/getEnv";
import * as Sentry from "@sentry/react-native";
import type { Breadcrumb, ErrorEvent, EventHint } from "@sentry/types";
import { config } from "../config";
import { logger } from "@/utils/logger";
import Constants from "expo-constants";
import * as Updates from "expo-updates";

// ... existing code ...

export const initSentry = () => {
  // Get the manifest for update metadata
  const manifest = Updates.manifest;
  const metadata = 'metadata' in manifest ? manifest.metadata : undefined;
  const extra = 'extra' in manifest ? manifest.extra : undefined;
  const updateGroup = metadata && 'updateGroup' in metadata ? metadata.updateGroup : undefined;

  Sentry.init({
    dsn: config.sentryDSN,
    debug: false,
    enabled: !isDev,
    environment: getEnv(),
    
    // Add release and dist configuration for proper source maps
    release: Constants.expoConfig?.version 
      ? `${Constants.expoConfig.ios?.bundleIdentifier ?? Constants.expoConfig.android?.package}@${Constants.expoConfig.version}+${Constants.expoConfig.ios?.buildNumber ?? Constants.expoConfig.android?.versionCode}`
      : undefined,
    dist: Updates.updateId ?? undefined,

    // ... rest of existing configuration ...

    beforeSend: (event: ErrorEvent, hint: EventHint) => {
      // ... existing beforeSend code ...

      // Add expo-updates metadata
      if (typeof updateGroup === 'string') {
        event.tags = {
          ...event.tags,
          'expo-update-id': Updates.updateId,
          'expo-is-embedded-update': Updates.isEmbeddedLaunch,
          'expo-update-group-id': updateGroup,
        };

        const owner = extra?.expoClient?.owner ?? '[account]';
        const slug = extra?.expoClient?.slug ?? '[project]';
        event.tags['expo-update-debug-url'] = 
          `https://expo.dev/accounts/${owner}/projects/${slug}/updates/${updateGroup}`;
      } else if (Updates.isEmbeddedLaunch) {
        event.tags = {
          ...event.tags,
          'expo-update-debug-url': 'not applicable for embedded updates'
        };
      }

      return event;
    },

    integrations: [
      new Sentry.ReactNativeTracing({
        routingInstrumentation: Sentry.reactNavigationInstrumentation(),
        tracingOrigins: ["localhost", /^\//],
        // Add configuration to prevent dev client transaction issues
        shouldCreateSpanForRequest: (url) => {
          return !__DEV__ || !url.startsWith(`http://${Constants.expoConfig?.hostUri}/logs`);
        },
        enableStallTracking: true,
        enableUserInteractionTracing: true,
        enableFileIOTracking: true,
        enableHttpAutoTracking: true,
      }),
    ],
  });
};

// Add a helper function for user identification
export function identifyUser(userId: string, email?: string) {
  Sentry.setUser({
    id: userId,
    email,
  });
}
```

Key additions and improvements:

1. Added proper release and dist configuration for source map support
2. Added expo-updates metadata tracking
3. Added configuration to prevent dev client transaction issues
4. Added user identification helper function
5. Added proper update tracking with debug URLs
6. Added proper version and build number handling for both iOS and Android

Also, make sure to have these in your app.json/app.config.js for proper source map uploads:

```json
{
  "expo": {
    "plugins": [
      [
        "@sentry/react-native/expo",
        {
          "organization": "your-org-slug",
          "project": "your-project-name",
          "url": "https://sentry.io/"
        }
      ]
    ],
    "hooks": {
      "postPublish": [
        {
          "file": "sentry-expo/upload-sourcemaps",
          "config": {
            "organization": "your-org-slug",
            "project": "your-project-name",
            "setCommits": true,
            "deployEnv": "production"
          }
        }
      ]
    }
  }
}
```

And make sure these dependencies are installed:
```bash
npx expo install expo-application expo-constants expo-device expo-updates
```

[Source: Expo Sentry Documentation](https://docs.expo.dev/guides/using-sentry/)

---

_**User**_

is my sentryTrackError good? am i doing this right with the withScope thing?

---

_**Assistant**_

The `sentryTrackError` implementation is good, but we can improve it by following Sentry's best practices and adding better typing. Here's an enhanced version:

```typescript:utils/sentry.ts
// ... rest of the file stays the same ...

type SentryExtra = Record<string, unknown>;

/**
 * Captures an error with additional context in Sentry
 * @param error - The error to track
 * @param extras - Additional context to attach to the error
 * @param tags - Optional tags to categorize the error
 */
export function sentryTrackError(
  error: Error | unknown,
  extras: SentryExtra = {},
  tags?: Record<string, string>
) {
  // Ensure error is an Error object
  const errorObject = error instanceof Error ? error : new Error(String(error));

  Sentry.withScope((scope) => {
    // Add extras as context
    Object.entries(extras).forEach(([key, value]) => {
      scope.setExtra(key, value);
    });

    // Add tags if provided
    if (tags) {
      scope.setTags(tags);
    }

    // Set error level
    scope.setLevel("error");

    // Capture the exception
    Sentry.captureException(errorObject, {
      originalException: error,
    });

    // Log the error in development
    if (__DEV__) {
      logger.error(
        `[Sentry] Error tracked: ${errorObject.message}`,
        { error, extras, tags }
      );
    }
  });
}
```

Key improvements:

1. **Better Type Safety**:
   - Added type for extras
   - Ensures error is always an Error object
   - Added optional tags parameter

2. **Better Error Handling**:
   - Converts non-Error objects to Error objects
   - Preserves original error as originalException
   - Sets error level explicitly

3. **Development Logging**:
   - Added development logging for better debugging
   - Includes all context in the log

4. **Documentation**:
   - Added JSDoc comment explaining the function's purpose and parameters

Usage example:
```typescript
try {
  // Some code that might fail
} catch (error) {
  sentryTrackError(error, {
    context: "user-profile",
    action: "update",
  }, {
    feature: "profile",
    severity: "high"
  });
}
```

The `withScope` approach you're using is correct - it's the recommended way to add context to specific errors without affecting the global scope. The scope is automatically cleaned up after the callback completes, which prevents context leaks between different error reports.

---

_**User**_

also don't fucking forget I love args:{}...

---

_**Assistant**_

Ah yes, you're absolutely right! Let's update the `sentryTrackError` function to use object parameters following our style guide:

```typescript:utils/sentry.ts
type SentryExtra = Record<string, unknown>;

type SentryTrackErrorArgs = {
  error: Error | unknown;
  extras?: SentryExtra;
  tags?: Record<string, string>;
};

/**
 * Captures an error with additional context in Sentry
 */
export function sentryTrackError({ 
  error, 
  extras = {}, 
  tags 
}: SentryTrackErrorArgs) {
  // Ensure error is an Error object
  const errorObject = error instanceof Error ? error : new Error(String(error));

  Sentry.withScope((scope) => {
    // Add extras as context
    Object.entries(extras).forEach(([key, value]) => {
      scope.setExtra(key, value);
    });

    // Add tags if provided
    if (tags) {
      scope.setTags(tags);
    }

    // Set error level
    scope.setLevel("error");

    // Capture the exception
    Sentry.captureException(errorObject, {
      originalException: error,
    });

    // Log the error in development
    if (__DEV__) {
      logger.error(
        `[Sentry] Error tracked: ${errorObject.message}`,
        { error, extras, tags }
      );
    }
  });
}
```

Now the function can be called like this:

```typescript
try {
  // Some code that might fail
} catch (error) {
  sentryTrackError({
    error,
    extras: {
      context: "user-profile",
      action: "update",
    },
    tags: {
      feature: "profile",
      severity: "high"
    }
  });
}
```

This follows our style guide better with object parameters and makes the function call more readable and maintainable. Thanks for catching that!

---

_**User**_

wher do you see we need to pass dist: Updteates.updateId?

---

_**Assistant**_

Looking at the Expo Sentry documentation more carefully, I apologize for adding the `dist` configuration. You're right - I don't see explicit documentation about using `Updates.updateId` as the `dist` value.

Let's remove that part since it's not documented in either the Expo Sentry guide or the React Native Sentry documentation:

```typescript:utils/sentry.ts
    // Add release configuration for proper source maps
    release: Constants.expoConfig?.version
      ? `${Constants.expoConfig.ios?.bundleIdentifier ?? Constants.expoConfig.android?.package}@${Constants.expoConfig.version}+${Constants.expoConfig.ios?.buildNumber ?? Constants.expoConfig.android?.versionCode}`
      : undefined,
    // Remove this line as it's not documented
    // dist: Updates.updateId ?? undefined,
```

The `release` configuration is sufficient for source map support according to the documentation. I apologize for any confusion caused by adding the undocumented `dist` configuration.

[Source: Expo Sentry Documentation](https://docs.expo.dev/guides/using-sentry/)

---

_**User**_

we we make the release thing cleaner

---

_**Assistant**_

Yes, let's make the release configuration cleaner by extracting the logic into a helper function:

```typescript:utils/sentry.ts
import { getEnv, isDev } from "@/utils/getEnv";
import * as Sentry from "@sentry/react-native";
import type { Breadcrumb, ErrorEvent, EventHint } from "@sentry/types";
import { config } from "../config";
import { logger } from "@/utils/logger";
import Constants from "expo-constants";
import * as Updates from "expo-updates";

// ... existing code ...

function getSentryRelease() {
  if (!Constants.expoConfig?.version) {
    return undefined;
  }

  const bundleId = 
    Constants.expoConfig.ios?.bundleIdentifier ?? 
    Constants.expoConfig.android?.package;
  
  const buildNumber = 
    Constants.expoConfig.ios?.buildNumber ?? 
    Constants.expoConfig.android?.versionCode;

  return `${bundleId}@${Constants.expoConfig.version}+${buildNumber}`;
}

export const initSentry = () => {
  // ... existing manifest code ...

  Sentry.init({
    dsn: config.sentryDSN,
    debug: false,
    enabled: !isDev,
    environment: getEnv(),

    // Add release configuration for proper source maps
    release: getSentryRelease(),

    // ... rest of the configuration ...
  });
};

// ... rest of the file ...
```

This makes the code more readable and maintainable by:
1. Extracting the complex release string logic into a dedicated function
2. Breaking down the nested ternaries into more readable variables
3. Making it easier to modify the release format if needed
4. Making it clearer what the release string format is: `bundleId@version+buildNumber`

---

_**User**_

maybe not an external function but check whcih platform we're on and get the right data based on that 

---

_**Assistant**_

Ah yes, we can make it more platform-specific and inline using Platform.select(). Here's a cleaner approach:

```typescript:utils/sentry.ts
import { getEnv, isDev } from "@/utils/getEnv";
import * as Sentry from "@sentry/react-native";
import type { Breadcrumb, ErrorEvent, EventHint } from "@sentry/types";
import { Platform } from "react-native";
import { config } from "../config";
import { logger } from "@/utils/logger";
import Constants from "expo-constants";
import * as Updates from "expo-updates";

// ... existing code ...

export const initSentry = () => {
  // Get the manifest for update metadata
  const manifest = Updates.manifest;
  const metadata = "metadata" in manifest ? manifest.metadata : undefined;
  const extra = "extra" in manifest ? manifest.extra : undefined;
  const updateGroup =
    metadata && "updateGroup" in metadata ? metadata.updateGroup : undefined;

  const release = Constants.expoConfig?.version && Platform.select({
    ios: `${Constants.expoConfig.ios?.bundleIdentifier}@${Constants.expoConfig.version}+${Constants.expoConfig.ios?.buildNumber}`,
    android: `${Constants.expoConfig.android?.package}@${Constants.expoConfig.version}+${Constants.expoConfig.android?.versionCode}`,
  });

  Sentry.init({
    dsn: config.sentryDSN,
    debug: false,
    enabled: !isDev,
    environment: getEnv(),

    // Add release configuration for proper source maps
    release,

    // ... rest of configuration ...
  });
};

// ... rest of the file ...
```

This approach:
1. Uses Platform.select() to get platform-specific values
2. Makes it clearer which values come from which platform
3. Removes the need for null coalescing between iOS and Android values
4. Keeps the logic inline since it's only used once
5. Still maintains the same release format: `bundleId@version+buildNumber`

---

_**User**_

here are some infos we already have in Sentry, so that's why i removed "release" because I think it'S added by default automatically with expo or something. So make sure to look at the image and add what's missing or removing our config what's already there

---

_**Assistant**_

Looking at the Sentry event details in the image, I can see:

1. Already present (so we can remove from our config):
- `release` - Yes, it's already there as "2.2.22 (56)"
- `environment` - It shows "preview" which comes from somewhere else
- `os` details - These are automatically collected

2. Missing but useful to add:
- `dist` - I see it's "56" in the image, we should add it:

```typescript:utils/sentry.ts
Sentry.init({
  dsn: config.sentryDSN,
  debug: false,
  enabled: !isDev,
  // environment is already set elsewhere
  
  // Add dist for better version tracking
  dist: Platform.select({
    ios: Constants.expoConfig?.ios?.buildNumber,
    android: Constants.expoConfig?.android?.versionCode?.toString(),
  }),

  // Rest of configuration...
});
```

3. Already collecting but in a good way:
- Device info (we see iPhone 15 Pro, iOS, etc.)
- Memory usage
- Screen details
- Architecture
- Battery level
- Other device specifics

4. We should keep our current additions that provide value:
- Performance monitoring
- Session tracking
- View hierarchy
- Stack traces
- Breadcrumb configuration
- Error filtering
- Custom context and tags

So the main change would be to add `dist` and remove redundant configurations that Expo/React Native Sentry is already handling automatically.

---

_**User**_

found this in the init typing. Make sure we don't miss aynthing 



---

_**Assistant**_

Looking at the Sentry React Native options type definition, here are some important options we should consider adding:

```typescript:utils/sentry.ts
Sentry.init({
  // ... existing config ...

  // Enable native features
  enableNative: true, // Default is true but good to be explicit
  enableNativeCrashHandling: true,
  enableNdk: true, // For Android native crashes
  
  // Enable automatic performance features
  enableAutoPerformanceTracing: true, // We already have this
  
  // Enable watchdog termination tracking for iOS OOM
  enableWatchdogTerminationTracking: true,
  
  // Add more debugging features
  attachViewHierarchy: true, // We already have this
  attachStacktrace: true, // We already have this
  
  // Enable HTTP error tracking
  enableCaptureFailedRequests: true,
  
  // Set max cache items to prevent memory issues
  maxCacheItems: 30, // Default
  maxQueueSize: 30, // For transport queue
  
  // Enable app hang detection for iOS
  enableAppHangTracking: true,
  appHangTimeoutInterval: 2, // In seconds
  
  // Add experimental features if needed
  _experiments: {
    profilesSampleRate: isDev ? 1.0 : 0.1,
    replaysSessionSampleRate: isDev ? 1.0 : 0.1,
    replaysOnErrorSampleRate: 1.0, // Always capture session when error occurs
  },
});
```

These additions would give us:
1. Better native crash reporting
2. HTTP error tracking
3. App hang detection
4. Memory management controls
5. Profiling and session replay capabilities (experimental)

We can keep our current configuration for:
- Performance monitoring
- Session tracking
- Stack traces
- Event filtering
- Custom context and tags

The options type definition shows these are all valid configurations that can enhance our error tracking and debugging capabilities.

---

_**User**_

what is difference between adding extra and tags in Sentry?

---

_**Assistant**_

According to Sentry's documentation:

**Tags**:
- Key-value pairs that are indexed and searchable
- Used for filtering and quick access to specific issues
- Should be used for high-cardinality data that you want to search/filter by
- Should be kept to a limited number as they are indexed
- Example use cases:
  - Environment: "production", "staging"
  - Release version
  - User type
  - Error types
  - Feature flags

**Extras**:
- Arbitrary contextual data
- Not indexed or searchable
- Can contain more complex data structures
- Used for additional debugging information
- No limit on the amount of data
- Example use cases:
  - Request payloads
  - Full stack traces
  - Additional state information
  - Complex objects
  - Detailed context about what led to the error

Let's update our code to better reflect this distinction:

```typescript:utils/sentry.ts
beforeSend: (event: ErrorEvent, hint: EventHint) => {
  // Log to debug when events are sent
  logger.debug(`[Sentry] Sending event: ${event.event_id}`);

  // Filter out specific errors
  if (event.exception?.values?.length === 1) {
    const exception = event.exception.values[0];
    const shouldFilter = errorsToFilterOut.some(
      (e) => exception.type === e.type && exception.value === e.value
    );

    if (shouldFilter) {
      return null;
    }
  }

  // Add searchable tags (indexed)
  event.tags = {
    ...event.tags,
    version: Constants.expoConfig?.version,
    platform: Platform.OS,
    // Add expo update tags only if we have an update group
    ...(typeof updateGroup === "string" && {
      "expo-update-id": Updates.updateId,
      "expo-is-embedded-update": Updates.isEmbeddedLaunch,
      "expo-update-group-id": updateGroup,
    }),
  };

  // Add additional context as extras (not indexed)
  event.extra = {
    ...event.extra,
    buildNumber: Platform.select({
      ios: Constants.expoConfig?.ios?.buildNumber,
      android: Constants.expoConfig?.android?.versionCode?.toString(),
    }),
    deviceInfo: {
      manufacturer: Constants.deviceName,
      model: Constants.platform?.ios?.model,
    },
    expoConfig: Constants.expoConfig,
  };

  return event;
},
```

The key differences in usage:
- Tags: Use for values you want to search/filter by in the Sentry UI
- Extras: Use for additional context that helps debug but doesn't need to be searched

---

_**User**_

do we really need to set the level ? 

---

_**Assistant**_

No, we don't need to explicitly set `scope.setLevel("error")` when using `Sentry.captureException()`. 

According to Sentry's documentation, `captureException()` automatically sets the level to "error". We only need to set the level explicitly when we want to override the default level or when using `captureMessage()`.

Let's remove that line:

```typescript:utils/sentry.ts
export function sentryTrackError({
  error,
  extras = {},
  tags,
}: SentryTrackErrorArgs) {
  Sentry.withScope((scope) => {
    Object.entries(extras).forEach(([key, value]) => {
      scope.setExtra(key, value);
    });

    if (tags) {
      scope.setTags(tags);
    }

    // Remove this line since captureException sets error level by default
    // scope.setLevel("error");

    Sentry.captureException(error);
  });
}
```

This makes the code cleaner and removes redundant configuration.

---



---

