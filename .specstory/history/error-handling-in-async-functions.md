## SpecStory

## Error Handling in Async Functions (1/15/2025, 3:55:57 PM)

_**User**_

if this create an error will the caller catch it? Since it's not an async function... not sure

---

_**Assistant**_

Looking at the code context, this line is inside the `rotateAccessToken` function which is async, and it's using the `secureMmkv.set()` method. If `secureMmkv.set()` throws an error, it will be caught by the caller since the entire `rotateAccessToken` function is async.

Here's the relevant code flow:

```typescript:utils/api.ts
// ... existing code ...
export async function rotateAccessToken(
  account: string,
  refreshToken: string | undefined
): Promise<AuthResponse> {
  // ... existing code ...
  
  // If secureMmkv.set() throws, it will be propagated up
  secureMmkv.set(CONVERSE_ACCESS_TOKEN_STORAGE_KEY, data.accessToken);
  if (data.refreshToken) {
    secureMmkv.set(CONVERSE_REFRESH_TOKEN_STORAGE_KEY, data.refreshToken);
  }
  
  return data;
}
// ... existing code ...
```

The error will be properly caught by the caller because:
1. The function is marked as `async`
2. Any errors thrown within an async function (even from synchronous operations) are automatically wrapped in a rejected promise
3. The caller is already handling errors through the axios interceptor's error handling block

So yes, any errors from `secureMmkv.set()` will be properly propagated to and handled by the caller.

---



---

