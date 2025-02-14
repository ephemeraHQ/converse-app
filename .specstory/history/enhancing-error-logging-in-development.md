## SpecStory

## Enhancing Error Logging in Development (1/22/2025, 3:08:13 PM)

_**User**_

if we are in dev can we add the stack to the error?

---

_**Assistant**_

I'll help modify the code to include the stack trace in the error logging when in dev mode. Here's the updated version:

```typescript:utils/capture-error.ts
// ... existing code ...
  if (options?.message) {
    logger.error(`${options.message}:`, error);
    if (__DEV__) {
      const stack = error instanceof Error ? error.stack : undefined;
      if (stack) {
        logger.error(`Stack trace:\n${stack}`);
      }
    }
  } else {
    logger.error(error);
    if (__DEV__) {
      const stack = error instanceof Error ? error.stack : undefined;
      if (stack) {
        logger.error(`Stack trace:\n${stack}`);
      }
    }
  }

  // Remove the separate DEV check since we've integrated it above
  // ... existing code ...
```

The changes:
1. Integrated the stack trace logging into the main error logging logic
2. Using `logger.error` instead of `console.error` to keep consistency with our logging approach
3. Removed the separate `__DEV__` check since we've incorporated it into the main error logging flow

This way, in development mode, the stack trace will be logged right after the error message, making it easier to debug issues.

---

_**User**_

can we make cleaner? possible to show in one log?

---

_**Assistant**_

Yes, we can make it cleaner by combining the error and stack trace into a single log message. Here's the improved version:

```typescript:utils/capture-error.ts
// ... existing code ...
  if (options?.message) {
    const stack = __DEV__ && error instanceof Error ? `\nStack trace:\n${error.stack}` : '';
    logger.error(`${options.message}:`, error, stack);
  } else {
    const stack = __DEV__ && error instanceof Error ? `\nStack trace:\n${error.stack}` : '';
    logger.error(error, stack);
  }
// ... existing code ...
```

This change:
1. Combines the error and stack trace into a single `logger.error` call
2. Uses a ternary operator to conditionally include the stack trace only in dev mode
3. Removes the nested if statements for cleaner code
4. Maintains the same functionality but with better readability

---



---

