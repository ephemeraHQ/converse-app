## SpecStory

## Error Logging Enhancement Discussion (1/3/2025, 8:27:39 AM)

_**User**_

how can we hceck if a message is passed and include it as part of the error

---

_**Assistant**_

I'll help you modify the `captureError` function to include the message as part of the error logging when it's provided. Here's how we can update it:

```typescript:utils/capture-error.ts
export function captureError(
  error: unknown,
  options?: {
    message?: string;
  }
) {
  if (isDev) {
    if (options?.message) {
      logger.error(`${options.message}:`, error);
    } else {
      logger.error(error);
    }
  }

  sentryTrackError(error, {
    message: options?.message,
  });
}
```

The changes:
1. Added a condition to check if `options.message` exists
2. If it does, we log the message followed by the error using template literals
3. If no message is provided, we maintain the original behavior of just logging the error

This way, when you pass a message, the development logs will be more descriptive by showing both the custom message and the error details.

---



---

