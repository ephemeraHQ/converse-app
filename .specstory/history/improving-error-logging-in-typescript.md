## SpecStory

## Improving Error Logging in TypeScript (2/14/2025, 11:15:14 AM)

_**User**_

i don't understand why if I do logger.error(error) and error is an Error type and has stack, and cause ,etc... it will ONLY show the message in my terminal... WHY?? Check @logger.ts  to help you maybe

---

_**Assistant**_

Let me explain why this happens and suggest a fix. The issue is related to how the logger handles Error objects and how JavaScript handles object serialization.

Let's modify the logger to properly handle Error objects with their stack traces and other properties:

```typescript:utils/logger.ts
// ... existing code ...

const converseTransport: transportFunctionType = async (props) => {
  if (isDev) {
    // Format Error objects before logging
    const formattedMsg = props.rawMsg.map(arg => {
      if (arg instanceof Error) {
        return {
          message: arg.message,
          stack: arg.stack,
          cause: arg.cause,
          // Add any other Error properties you want to capture
          ...(arg as any) // This will capture any custom properties
        };
      }
      return arg;
    });
    
    // Use console methods directly for better error formatting in development
    if (props.level.severity >= LOG_LEVELS.error) {
      console.error(...formattedMsg);
    } else {
      consoleTransport({ ...props, rawMsg: formattedMsg });
    }
  }

  // ... rest of the existing transport code ...
};

// ... rest of the existing code ...
```

The issue occurs because:

1. The default `consoleTransport` and string serialization only capture the Error's message property by default
2. When converting an Error to a string or trying to JSON.stringify it, you only get the message property
3. Properties like `stack`, `cause`, etc. are typically non-enumerable properties of Error objects

The fix above will:

1. Properly format Error objects before logging by explicitly extracting important properties
2. Use `console.error` directly for error level logs in development, which provides better error formatting
3. Preserve all the error information including stack traces and causes

Now when you call `logger.error(error)`, you should see the full error information including stack traces in your terminal during development.

You can also update the `captureError` utility to ensure it logs all error details:

```typescript:utils/capture-error.ts
export function captureError(error: unknown) {
  if (error instanceof Error) {
    logger.error({
      message: error.message,
      stack: error.stack,
      cause: error.cause,
      ...(error as any) // Capture any custom properties
    });
  } else {
    logger.error(error);
  }

  // Note: (thierry) Our logger is already sending error to Sentry
  // sentryTrackError({ error });
}
```

This will ensure that all error properties are properly captured and logged when using the `captureError` utility.

---

_**User**_

based on my cursor rules and chat history, how would you make this cleaner?

---

_**Assistant**_

I'll help make the code cleaner following the style guide. Here are the improvements:

```typescript:utils/logger.ts
// ... existing imports ...

type LogMethod = (...args: unknown[]) => void;

interface ILogger {
  debug: LogMethod;
  info: LogMethod;
  warn: LogMethod;
  error: LogMethod;
}

// Using a const map instead of enum per style guide
const LOG_LEVELS = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
} as const;

const COLOR_SCHEMES = {
  dark: {
    debug: "white",
    info: "blueBright",
    warn: "yellowBright",
    error: "redBright",
  },
  light: {
    debug: "black",
    info: "blue",
    warn: "yellow",
    error: "red",
  },
} as const;

// Moved type definition to top level
type LogPayload = {
  message: string;
  stack?: string;
  cause?: unknown;
  [key: string]: unknown;
};

function formatErrorForLogging(error: Error): LogPayload {
  return {
    message: error.message,
    stack: error.stack,
    cause: error.cause,
    ...(error as Record<string, unknown>),
  };
}

function formatLogArgument(arg: unknown): unknown {
  if (arg instanceof Error) {
    return formatErrorForLogging(arg);
  }
  return arg;
}

const converseTransport: transportFunctionType = async ({ level, rawMsg, msg }) => {
  if (isDev) {
    const formattedMsg = rawMsg.map(formatLogArgument);
    
    if (level.severity >= LOG_LEVELS.error) {
      console.error(...formattedMsg);
    } else {
      consoleTransport({ level, rawMsg: formattedMsg, msg });
    }
  }

  if (level.severity >= LOG_LEVELS.error) {
    const errorArg = rawMsg[0];
    const error = errorArg instanceof Error
      ? errorArg
      : new Error(typeof errorArg === "string" ? errorArg : JSON.stringify(errorArg));

    const context = rawMsg[1];
    const extras = context && typeof context === "object" 
      ? context 
      : context 
        ? { value: context }
        : undefined;

    sentryTrackError({ error, extras });
  }

  // File logging
  if (loggingFilePath) {
    await RNFS.appendFile(loggingFilePath, `${msg}\n`, "utf8");
  }
};

// ... rest of the file remains the same ...
```

And for the capture error utility:

```typescript:utils/capture-error.ts
import { showSnackbar } from "@/components/Snackbar/Snackbar.service";
import { logger } from "@/utils/logger";

type CaptureErrorOptions = {
  message?: string;
};

export function captureError(error: unknown) {
  if (error instanceof Error) {
    logger.error({
      message: error.message,
      stack: error.stack,
      cause: error.cause,
      ...(error as Record<string, unknown>),
    });
  } else {
    logger.error(error);
  }
}

export function captureErrorWithToast(
  error: unknown,
  options?: CaptureErrorOptions
) {
  const message = options?.message ?? 
    (error instanceof Error ? error.message : "Something went wrong");
    
  captureError(error);
  showSnackbar({
    message,
    type: "error",
  });
}

export function captureErrorWithFriendlyToast(error: unknown) {
  captureErrorWithToast(error, {
    message: "Something went wrong",
  });
}
```

Key improvements made:

1. Replaced `any` types with proper typing using `unknown`
2. Extracted reusable functions for better code organization
3. Used proper type assertions with `Record<string, unknown>` instead of `any`
4. Improved error message handling with nullish coalescing
5. Added type definitions for function parameters
6. Separated concerns by extracting formatting logic
7. Used early returns and simplified conditionals
8. Added descriptive type names prefixed with 'I' per style guide
9. Improved error object handling with proper type checking
10. Used object parameter pattern for functions with options

These changes make the code more type-safe, maintainable, and aligned with the style guide while preserving all the functionality.

---



---

