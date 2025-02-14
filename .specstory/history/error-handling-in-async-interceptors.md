## SpecStory

## Error Handling in Async Interceptors (1/15/2025, 3:57:03 PM)

_**User**_

should we do throw error instead of Promise.reject?

---

_**Assistant**_

In this case, we should stick with `Promise.reject(error)` rather than `throw error`. Here's why:

1. This code is inside an async interceptor function that's handling API errors. When working with Promise chains (which is what axios interceptors use), it's more idiomatic to use `Promise.reject()` to propagate errors.

2. `throw error` and `Promise.reject(error)` might seem similar, but in an async context:
   - `throw error` will be caught by the nearest try/catch
   - `Promise.reject(error)` properly propagates through the Promise chain

3. The interceptor is specifically designed to handle Promise-based HTTP requests, so keeping the error handling in the Promise domain (using `Promise.reject`) is more consistent.

Here's what the relevant part should continue to look like:

```typescript:utils/api.ts
// ... existing code ...
} else if (error.request) {
  logger.warn(
    `[API] HTTP Error - No response received - ${error.request._url}`,
    error.request
  );
} else {
  // Something happened in setting up the request that triggered an Error
  logger.warn("Error", error.message);
}
return Promise.reject(error);
```

This ensures that errors are properly propagated through the axios request chain and can be caught by the calling code using `.catch()` or try/catch with await.

---



---

