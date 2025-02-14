## SpecStory

## Error Handling Enhancement Discussion (2/14/2025, 9:35:37 AM)

_**User**_

problem here is what if error already have a cause? and a message? like how can i just improve the message and also keep the original cause you know?

---

_**Assistant**_

I'll help you improve the error handling to preserve the original error's cause and message while adding the query context. Here's how we can modify the `queryClient.ts` file:

```typescript:queries/queryClient.ts
// ... existing code ...
    onError: (error, query) => {
      // If error is already an Error instance, enhance its message
      const errorMessage = `Error in query: ${JSON.stringify(query.queryKey)}${
        query.meta?.caller ? ` (caller: ${query.meta.caller})` : ""
      }`;

      if (error instanceof Error) {
        // Preserve the original error's message and cause
        const enhancedError = new Error(
          `${errorMessage} - Original error: ${error.message}`,
          { cause: error.cause || error }
        );
        // Copy over the stack trace
        enhancedError.stack = error.stack;
        captureError(enhancedError);
      } else {
        // If it's not an Error instance, create a new one
        captureError(new Error(errorMessage, { cause: error }));
      }
    },
// ... existing code ...
```

This improvement:
1. Preserves the original error's cause if it exists
2. Includes the original error message in the enhanced error message
3. Maintains the original stack trace for better debugging
4. Handles both Error instances and other error types
5. Provides better context by combining the query information with the original error details

The error message will now look like: "Error in query: ["someKey"] (caller: someComponent) - Original error: Network timeout" instead of losing the original error message.

---

_**User**_

is there a way to make this cleaner? like look in my @error.ts file maybe? I don't know i just feel like this is not clean at all.... We had some context to the message when we catch an error but then we also add message here so like i feel we'll have a super long message and i don't know it doens'T feel clean? Maybe i'm wrong

---

_**Assistant**_

Yes, we can make this cleaner by leveraging your error utilities! Let's create a new `QueryError` class in `error.ts` and use it to handle query errors more elegantly.

First, let's add the new error class:

```typescript:utils/error.ts
// ... existing code ...

export class QueryError extends BaseError {
  constructor(args: { 
    message: string;
    queryKey: unknown[];
    caller?: string;
    cause: unknown;
  }) {
    const queryInfo = `${JSON.stringify(args.queryKey)}${
      args.caller ? ` (caller: ${args.caller})` : ""
    }`;
    super(`[Query] ${args.message} - Key: ${queryInfo}`, args.cause);
  }
}

```

Then simplify the query client error handling:

```typescript:queries/queryClient.ts
// ... existing code ...
    onError: (error, query) => {
      captureError(
        new QueryError({
          message: error instanceof Error ? error.message : "Unknown error occurred",
          queryKey: query.queryKey,
          caller: query.meta?.caller,
          cause: error
        })
      );
    },
// ... existing code ...
```

This approach:

1. Keeps error handling consistent with your existing pattern of specialized error classes
2. Maintains a clean error hierarchy
3. Preserves all error context without message duplication
4. Makes the error handling code much more readable
5. Follows your existing pattern of prefixing error contexts (like `[XMTP SDK]`, `[Stream]`, etc.)

The resulting error message will be cleaner and more consistent with your other error types, looking something like:
`[Query] Network timeout - Key: ["conversations", "0x123"] (caller: ConversationList)`

---

_**User**_

this kind of error will only be used in here so no need to add QueryError class. I was just hinking if we can make this cleaner

---

_**Assistant**_

Ah, I see your point! Since this error handling is specific to the query client, we can simplify it while still keeping it clean. Here's a cleaner approach:

```typescript:queries/queryClient.ts
    onError: (error, query) => {
      const originalMessage = error instanceof Error ? error.message : "Unknown error occurred";
      const queryInfo = `${JSON.stringify(query.queryKey)}${
        query.meta?.caller ? ` (caller: ${query.meta.caller})` : ""
      }`;
      
      captureError(
        new Error(`[Query] ${originalMessage} - Key: ${queryInfo}`, { cause: error })
      );
    },
```

This version:
1. Is more concise while still maintaining readability
2. Preserves the original error message and cause
3. Adds the query context in a clean format
4. Follows your existing pattern of using prefixes like `[Query]`
5. Doesn't need a separate error class since it's only used in one place

The resulting error message will look like:
`[Query] Network timeout - Key: ["conversations", "0x123"] (caller: ConversationList)`

---

_**User**_

do you think printing errors has an object is better? how will it look?

---

_**Assistant**_

Yes, using an object format for errors can be more structured and easier to parse in logging systems. Here's how we could modify it:

```typescript:queries/queryClient.ts
    onError: (error, query) => {
      captureError(
        new Error("[Query] Error executing query", {
          cause: {
            originalError: error,
            message: error instanceof Error ? error.message : "Unknown error occurred",
            queryKey: query.queryKey,
            caller: query.meta?.caller,
            stack: error instanceof Error ? error.stack : undefined
          }
        })
      );
    },
```

When logged, it would look something like:

```
Error: [Query] Error executing query
cause: {
  originalError: Error: Network timeout
  message: "Network timeout"
  queryKey: ["conversations", "0x123"]
  caller: "ConversationList"
  stack: "Error: Network timeout\n    at fetchData (api.ts:10:12)..."
}
```

Benefits of this approach:
1. More structured and easier to parse in logging systems
2. Clearer separation between different pieces of error context
3. Easier to filter and search through logs
4. Preserves all original error information in a more organized way
5. Better for automated error tracking systems like Sentry

Would you like me to make this change?

---

_**User**_

ok still not good. what I want here is just to add to the orignial error message

---

_**Assistant**_

Ah, I understand now! You want to enhance the original error message while preserving all the original error properties. Here's a cleaner approach:

```typescript:queries/queryClient.ts
    onError: (error, query) => {
      const queryInfo = `${JSON.stringify(query.queryKey)}${
        query.meta?.caller ? ` (caller: ${query.meta.caller})` : ""
      }`;
      
      const enhancedError = new Error(
        `[Query] ${error instanceof Error ? error.message : "Unknown error"} - Key: ${queryInfo}`,
        { cause: error instanceof Error ? error.cause : error }
      );

      // Preserve the original stack if it exists
      if (error instanceof Error) {
        enhancedError.stack = error.stack;
      }

      captureError(enhancedError);
    },
```

This approach:
1. Simply enhances the error message with query context
2. Preserves the original error cause chain
3. Maintains the original stack trace
4. Keeps the error structure clean and simple

The error message will look like:
`[Query] Failed to fetch conversation data - Key: ["conversations", "0x123"] (caller: ConversationList)`

And if the original error had a cause, it's preserved in the error chain.

---



---

