## SpecStory

## Logging API Response Data (1/15/2025, 3:50:22 PM)

_**User**_

is there a place we log just the data object ?

---

_**Assistant**_

Looking through the file, there are several places where API responses are handled, but I don't see any direct logging of just the data object. The closest logging we have is in the error interceptor where we log the response data as part of error handling:

```typescript:utils/api.ts
// ... existing code ...
if (error.response) {
  logger.warn(
    `[API] HTTP Error ${error.response.status} - ${error.request._url}`,
    JSON.stringify(
      { headers: error.request._headers, response: error.response.data },  // Here we log response data, but only for errors
      null,
      2
    )
  );
  // ... rest of error handling ...
}
// ... existing code ...
```

If you want to log successful response data, you could add logging in the success interceptor. Here's how you could modify it:

```typescript:utils/api.ts
api.interceptors.response.use(
  function axiosSuccessResponse(response) {
    logger.debug('[API] Response data:', response.data);  // Add this line to log successful response data
    return response;
  },
  // ... existing error handler ...
);
```

---



---

