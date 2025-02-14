## SpecStory

## Improving SDK Error Logging Practices (1/28/2025, 3:43:28 PM)

_**User**_

i want better context. Ideally we wnat to EASILY be able to see logs and track what are errors coming from the SDK we are using. What would be best practice here?

---

_**Assistant**_

I'll help you improve the error handling to provide better context and logging. Based on the style guide, we should use the logger and provide clear context for debugging. Here's how we can improve the error handling:

```typescript:utils/xmtpRN/xmtp-messages/xmtp-messages-stream.ts
// ... existing code ...

export const stopStreamingAllMessage = async (args: { ethAddress: string }) => {
  const { ethAddress } = args;

  const client = await getXmtpClient({
    address: ethAddress,
  });

  try {
    await client.conversations.cancelStreamAllMessages();

    logger.debug(
      `[XMTP - stopStreamingAllMessage] Stopped streaming messages for ${client.address}`
    );
  } catch (error) {
    // Log the error with full context
    logger.error(
      `[XMTP - stopStreamingAllMessage] Failed to cancel streaming messages for address: ${ethAddress}. SDK Error: ${error}`
    );
    
    // Rethrow with better context while preserving the original error
    throw new Error(
      `[XMTP SDK] Failed to cancel message streaming for address: ${ethAddress}`,
      { cause: error }
    );
  }
};

// ... existing code ...
```

Key improvements made:
1. Added error logging using `logger.error` before throwing
2. Added a clear prefix `[XMTP SDK]` to indicate the error is coming from the SDK
3. Included the address in both the log and the error message for better context
4. Maintained the error cause chaining for debugging
5. Made the error message more specific and structured

This way:
- You can easily search logs for `[XMTP SDK]` to find SDK-related errors
- You have both the detailed log entry and the thrown error for different use cases
- The error message is more descriptive for debugging and error tracking
- The original error is preserved in the cause chain

---

_**User**_

how to make sure everyone use the same syntaxe like XMTP SDK ?

---

_**Assistant**_



To standardize error prefixes across the codebase, we should create an error utility that enforces consistent prefixing. Here's how we can implement this:

1. First, let's create a new error utilities file:

```typescript:utils/errors.ts
type ErrorSource = 
  | "XMTP SDK"
  | "Lens SDK"
  | "Wallet SDK"
  | "API"
  | "Database"
  // Add other sources as needed

function createErrorWithContext(args: {
  source: ErrorSource;
  message: string;
  cause?: unknown;
}) {
  const { source, message, cause } = args;
  const prefix = `[${source}]`;
  
  // Standardized error message format
  const formattedMessage = `${prefix} ${message}`;
  
  return new Error(formattedMessage, { cause });
}

export const ErrorUtils = {
  createErrorWithContext,
};
```

2. Then update the XMTP file to use this utility:

```typescript:utils/xmtpRN/xmtp-messages/xmtp-messages-stream.ts
import { ErrorUtils } from "@/utils/errors";

// ... existing code ...

  try {
    await client.conversations.cancelStreamAllMessages();

    logger.debug(
      `[XMTP - stopStreamingAllMessage] Stopped streaming messages for ${client.address}`
    );
  } catch (error) {
    logger.error(
      `[XMTP - stopStreamingAllMessage] Failed to cancel streaming messages for address: ${ethAddress}. SDK Error: ${error}`
    );
    
    throw ErrorUtils.createErrorWithContext({
      source: "XMTP SDK",
      message: `Failed to cancel message streaming for address: ${ethAddress}`,
      cause: error,
    });
  }

// ... existing code ...
```

Benefits of this approach:
1. Enforces consistent error prefixing through TypeScript's type system
2. Makes it easy to update error prefixes across the entire codebase
3. Provides a single source of truth for error sources
4. Makes it easier to add new error sources or modify existing ones
5. Enables better error filtering and categorization in logging systems

You could also add this to your style guide:

```markdown
## Error Handling

- Always use `ErrorUtils.createErrorWithContext()` when throwing errors from external SDKs or services
- Use the appropriate `ErrorSource` type to categorize the error
- Include relevant context in the error message (e.g., addresses, IDs)
- Always log errors using `logger.error` before throwing
- Preserve the original error in the `cause` property

Example:
```typescript
try {
  await externalSDK.someMethod();
} catch (error) {
  logger.error(`[Component] Detailed error message. Error: ${error}`);
  throw ErrorUtils.createErrorWithContext({
    source: "External SDK",
    message: "Clear error description",
    cause: error,
  });
}
```

This standardization will make error tracking, debugging, and maintenance much easier across the entire codebase.

---

_**User**_

what other strategy can i use ?

---

_**Assistant**_

Here are several alternative strategies for standardizing error handling:

1. Custom Error Classes:
```typescript:utils/errors.ts
class BaseSDKError extends Error {
  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = this.constructor.name;
    this.cause = cause;
  }
}

export class XMTPError extends BaseSDKError {
  constructor(message: string, cause?: unknown) {
    super(`[XMTP SDK] ${message}`, cause);
  }
}

export class LensError extends BaseSDKError {
  constructor(message: string, cause?: unknown) {
    super(`[Lens SDK] ${message}`, cause);
  }
}

// Usage example:
throw new XMTPError("Failed to cancel message streaming", error);
```

2. Error Factory with Error Codes:
```typescript:utils/errors.ts
type ErrorCode = 
  | "XMTP_STREAM_CANCEL_FAILED"
  | "XMTP_CONNECTION_FAILED"
  | "LENS_PROFILE_NOT_FOUND"
  // ... more error codes

type ErrorMetadata = Record<string, unknown>;

function createSDKError(args: {
  code: ErrorCode;
  metadata?: ErrorMetadata;
  cause?: unknown;
}) {
  const { code, metadata, cause } = args;
  
  const errorMessages: Record<ErrorCode, string> = {
    XMTP_STREAM_CANCEL_FAILED: "Failed to cancel XMTP message stream",
    XMTP_CONNECTION_FAILED: "Failed to connect to XMTP",
    LENS_PROFILE_NOT_FOUND: "Lens profile not found",
  };

  const message = errorMessages[code];
  const error = new Error(message, { cause });
  
  return Object.assign(error, {
    code,
    metadata,
    timestamp: new Date().toISOString(),
  });
}

// Usage example:
throw createSDKError({
  code: "XMTP_STREAM_CANCEL_FAILED",
  metadata: { address: ethAddress },
  cause: error,
});
```

3. Error Handler with Context Chain:
```typescript:utils/errors.ts
type ErrorContext = {
  component?: string;
  operation?: string;
  sdk?: string;
  details?: Record<string, unknown>;
};

class ContextualError extends Error {
  readonly context: ErrorContext[];
  
  constructor(message: string, context: ErrorContext[] = []) {
    super(message);
    this.context = context;
  }

  addContext(newContext: ErrorContext): this {
    this.context.push(newContext);
    return this;
  }

  toString(): string {
    return [
      this.message,
      ...this.context.map(ctx => 
        Object.entries(ctx)
          .map(([k, v]) => `${k}: ${v}`)
          .join(", ")
      )
    ].join("\n");
  }
}

// Usage example:
throw new ContextualError("Operation failed")
  .addContext({ sdk: "XMTP", operation: "streamCancel" })
  .addContext({ component: "MessageStream", details: { address: ethAddress } });
```

4. Zod-based Error Validation:
```typescript:utils/errors.ts
import { z } from "zod";

const ErrorDetailsSchema = z.object({
  sdk: z.enum(["XMTP", "Lens", "Wallet"]),
  operation: z.string(),
  errorCode: z.string(),
  metadata: z.record(z.unknown()).optional(),
});

type ErrorDetails = z.infer<typeof ErrorDetailsSchema>;

function createValidatedError(details: ErrorDetails, cause?: unknown) {
  const validated = ErrorDetailsSchema.parse(details);
  
  const error = new Error(
    `[${validated.sdk}] ${validated.operation} failed: ${validated.errorCode}`,
    { cause }
  );
  
  return Object.assign(error, validated);
}

// Usage example:
throw createValidatedError({
  sdk: "XMTP",
  operation: "streamCancel",
  errorCode: "STREAM_CANCEL_FAILED",
  metadata: { address: ethAddress }
}, error);
```

5. Event-like Error System:
```typescript:utils/errors.ts
type ErrorEvent = {
  type: string;
  source: string;
  timestamp: string;
  details: Record<string, unknown>;
  error?: unknown;
};

class ErrorEmitter extends Error {
  readonly events: ErrorEvent[];

  constructor(message: string) {
    super(message);
    this.events = [];
  }

  addEvent(event: Omit<ErrorEvent, "timestamp">) {
    this.events.push({
      ...event,
      timestamp: new Date().toISOString(),
    });
    return this;
  }

  getLastEvent(): ErrorEvent | undefined {
    return this.events[this.events.length - 1];
  }
}

// Usage example:
const error = new ErrorEmitter("Operation failed")
  .addEvent({
    type: "SDK_CALL",
    source: "XMTP",
    details: { method: "cancelStreamAllMessages" }
  })
  .addEvent({
    type: "ERROR",
    source: "XMTP",
    details: { address: ethAddress },
    error: originalError
  });

logger.error(`Error chain: ${JSON.stringify(error.events, null, 2)}`);
throw error;
```

Each approach has its benefits:
- Custom Error Classes: Good for inheritance and type checking
- Error Codes: Great for standardization and internationalization
- Context Chain: Excellent for tracking error flow through the application
- Zod Validation: Ensures error structure consistency
- Event System: Best for complex error flows and debugging

Choose based on your needs:
- If you need simple standardization: Use Custom Error Classes
- If you need strict validation: Use Zod-based approach
- If you need detailed debugging: Use Context Chain or Event System
- If you need internationalization: Use Error Codes
- If you need all of the above: Consider combining approaches

Remember to document your chosen approach in the style guide and ensure consistent usage across the codebase.

---



---

