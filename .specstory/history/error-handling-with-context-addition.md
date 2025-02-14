## SpecStory

## Error Handling with Context Addition (1/2/2025, 12:28:27 PM)

_**User**_

Let,s say I receive an error in a try catch, how can i then add a message to the error? wihtout changing the original message? Or add context . Like I want to add this text "[GroupMessageNotification] Error handling group message notification"

---

_**Assistant**_

I'll show you how to add context to an error message while preserving the original error. Here's how you can modify the `captureError` function to handle this:

```typescript:utils/capture-error.ts
// ... existing imports ...

type IErrorWithContext = {
  originalError: unknown;
  context: string;
};

function addErrorContext(error: unknown, context: string): IErrorWithContext {
  return {
    originalError: error,
    context: context,
  };
}

export function captureError(error: unknown) {
  if (isDev) {
    if ((error as IErrorWithContext).context) {
      logger.error(`${(error as IErrorWithContext).context}:`, (error as IErrorWithContext).originalError);
    } else {
      logger.error(error);
    }
  }

  sentryTrackError(error);
}

// ... rest of the file ...
```

Now you can use it in your try-catch like this:

```typescript
try {
  // your code
} catch (error) {
  const errorWithContext = addErrorContext(
    error,
    "[GroupMessageNotification] Error handling group message notification"
  );
  captureError(errorWithContext);
}
```

This approach:
1. Creates a type to represent errors with context
2. Provides a helper function to add context to any error
3. Modifies the `captureError` function to handle both regular errors and errors with context
4. Preserves the original error while adding additional context

The error logging will show both the context and the original error details, making debugging easier while maintaining the original error information.

---



---

