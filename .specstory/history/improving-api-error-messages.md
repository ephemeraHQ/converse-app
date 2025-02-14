## SpecStory

## Improving API Error Messages (1/15/2025, 7:57:04 PM)

_**User**_

right now if i call "saveNotificationsSubscribe" and the api call fail i get this error "ERROR : Request failed with status code 401" it'S not describpting at all... I have an interceptor tho. What can i do to make this error more clear?

---

_**Assistant**_

Based on the code style guide and the need to improve error handling, I'll help you modify the `saveNotificationsSubscribe` function to provide better error messages. We should throw a more descriptive error while still allowing the interceptor to handle it.

Here's how to update the function:

```typescript:utils/api/notifications.ts
// ... existing code ...

export const saveNotificationsSubscribe = async (
  account: string,
  nativeToken: string,
  nativeTokenType: string,
  notificationChannel: string | null,
  topicsWithKeys: {
    [topic: string]: {
      status: "PUSH" | "MUTED";
      hmacKeys?: any;
    };
  }
) => {
  try {
    const { data } = await api.post(
      "/api/subscribe",
      { nativeToken, nativeTokenType, notificationChannel, topicsWithKeys },
      {
        headers: await getXmtpApiHeaders(account),
      }
    );
    return data.subscribeHash as string;
  } catch (error: any) {
    // Enhance the error message while preserving the original error
    if (error?.response?.status === 401) {
      throw new Error(
        "Failed to subscribe to notifications: Authentication failed. Please check your account credentials.",
        { cause: error }
      );
    }
    
    // For other errors, provide a generic but informative message
    throw new Error(
      `Failed to subscribe to notifications: ${error?.response?.data?.message || error?.message || "Unknown error occurred"}`,
      { cause: error }
    );
  }
};

// ... existing code ...
```

This update:
1. Adds a try-catch block to handle API errors
2. Provides a specific message for 401 authentication errors
3. Includes the original error as the `cause` so the interceptor can still access it
4. Attempts to extract any error message from the response data
5. Maintains the error throwing pattern so it can still be handled at the caller level as per the style guide

The error messages will now be more descriptive while still allowing your existing interceptor to handle the error as needed.

---

_**User**_

but do you think we can add logic in interceptor instead?  in setupApiInterceptors in @interceptors.ts 

---

_**Assistant**_

Yes, handling the error messages in the interceptor is a better approach since it provides consistent error handling across all API calls. Here's how to update the interceptor:

```typescript:utils/api/interceptors.ts
// ... existing code ...

async function axiosErrorResponse(error: PatchedAxiosError) {
  const { config: req, response, request } = error;

  if (!response) {
    if (request) {
      logger.warn(
        `[API] HTTP Error - No response received - ${request._url}`,
        request
      );
    } else {
      logger.warn("Error", error.message);
    }
    return Promise.reject(new Error("Network error: Unable to reach the server"));
  }

  // Log API errors with response
  logger.warn(
    `[API] HTTP Error ${response.status} - ${request._url}`,
    JSON.stringify(
      { headers: request._headers, response: response.data },
      null,
      2
    )
  );

  const account = req.headers?.[XMTP_API_ADDRESS_HEADER_KEY];
  if (typeof account !== "string") {
    throw new Error("No account in request headers");
  }

  // Enhanced error messages based on status codes
  let errorMessage: string;
  switch (response.status) {
    case 401:
      const secureMmkv = await getSecureMmkvForAccount(account);
      const refreshToken = secureMmkv.getString(
        CONVERSE_REFRESH_TOKEN_STORAGE_KEY
      );

      if (!req._retry && refreshToken) {
        try {
          const { accessToken } = await rotateAccessToken(
            account,
            refreshToken
          );
          req._retry = true;
          req.headers = {
            ...req.headers,
            authorization: `Bearer ${accessToken}`,
          };
          return api(req);
        } catch (refreshError) {
          errorMessage = "Authentication failed: Your session has expired. Please sign in again.";
          return Promise.reject(new Error(errorMessage, { cause: refreshError }));
        }
      }
      errorMessage = "Authentication failed: Please check your credentials.";
      break;
    case 403:
      errorMessage = "Access denied: You don't have permission to perform this action.";
      break;
    case 404:
      errorMessage = "Resource not found: The requested data doesn't exist.";
      break;
    case 429:
      errorMessage = "Too many requests: Please try again later.";
      break;
    case 500:
      errorMessage = "Server error: Something went wrong on our end. Please try again later.";
      break;
    default:
      errorMessage = response.data?.message || "An unexpected error occurred. Please try again.";
  }

  return Promise.reject(new Error(errorMessage, { cause: error }));
}

// ... existing code ...
```

This update:
1. Provides clear, user-friendly error messages for common HTTP status codes
2. Maintains the original error as the `cause` for debugging purposes
3. Keeps the token refresh logic while improving its error message
4. Handles network errors with a clear message
5. Uses the server's error message when available for other cases

Now all API calls will receive these improved error messages without needing to handle them individually in each API function.

---

_**User**_

hmm too much maybe what i want is the error to be in that kind of format: 

that way the call have more info about it you know

---

_**Assistant**_

Ah, I see! You want to format the error message to include the request context, similar to the logging format. Here's how we can modify the interceptor to create more informative error messages:

```typescript:utils/api/interceptors.ts
// ... existing code ...

async function axiosErrorResponse(error: PatchedAxiosError) {
  const { config: req, response, request } = error;

  if (!response) {
    if (request) {
      const message = `[API] HTTP Error - No response received - ${request._url}`;
      logger.warn(message, request);
      return Promise.reject(new Error(message));
    } else {
      logger.warn("Error", error.message);
      return Promise.reject(error);
    }
  }

  // Create a descriptive error message with request context
  const errorMessage = `[API] HTTP Error ${response.status} - ${request._url} - ${response.data?.message || 'Unknown error'}`;
  
  logger.warn(
    errorMessage,
    JSON.stringify(
      { headers: request._headers, response: response.data },
      null,
      2
    )
  );

  // Rest of the token refresh logic...
  const account = req.headers?.[XMTP_API_ADDRESS_HEADER_KEY];
  if (typeof account !== "string") {
    throw new Error("No account in request headers");
  }

  const secureMmkv = await getSecureMmkvForAccount(account);
  const refreshToken = secureMmkv.getString(
    CONVERSE_REFRESH_TOKEN_STORAGE_KEY
  );

  if (response.status === 401 && !req._retry && refreshToken) {
    try {
      const { accessToken } = await rotateAccessToken(
        account,
        refreshToken
      );
      req._retry = true;
      req.headers = {
        ...req.headers,
        authorization: `Bearer ${accessToken}`,
      };
      return api(req);
    } catch (refreshError) {
      return Promise.reject(new Error(`${errorMessage} (Token refresh failed)`));
    }
  }

  return Promise.reject(new Error(errorMessage));
}

// ... existing code ...
```

Now when an API call fails, you'll get an error message that includes:
- The API endpoint that failed
- The HTTP status code
- The error message from the server (if available)

For example, if `saveNotificationsSubscribe` fails, you might see an error like:
`[API] HTTP Error 401 - /api/subscribe - Invalid authentication credentials`

This provides more context while keeping the error message format consistent with your logging.

---

_**User**_

I don't want to "warn" I want to Promise.reject but "boost" the error with more data so the caller have some more stuff

---

_**Assistant**_



Ah, now I understand! You want to enhance the error object that gets rejected. Here's how we can modify the interceptor to add more context to the error while preserving the original error structure:

```typescript:utils/api/interceptors.ts
// ... existing code ...

async function axiosErrorResponse(error: PatchedAxiosError) {
  const { config, response, request } = error;

  if (!response) {
    if (request) {
      error.message = `[API] No response received - ${request._url}`;
      return Promise.reject(error);
    }
    return Promise.reject(error);
  }

  // Enhance the error message with request context
  error.message = `[API] HTTP ${response.status} - ${request._url} - ${
    response.data?.message || "Unknown error"
  }`;
  
  // Add additional context to the error object
  Object.assign(error, {
    requestDetails: {
      url: request._url,
      method: config.method,
      status: response.status,
      responseData: response.data,
    },
  });

  const account = config.headers?.[XMTP_API_ADDRESS_HEADER_KEY];
  if (typeof account !== "string") {
    throw new Error("No account in request headers");
  }

  // Token refresh logic
  const secureMmkv = await getSecureMmkvForAccount(account);
  const refreshToken = secureMmkv.getString(
    CONVERSE_REFRESH_TOKEN_STORAGE_KEY
  );

  if (response.status === 401 && !config._retry && refreshToken) {
    try {
      const { accessToken } = await rotateAccessToken(
        account,
        refreshToken
      );
      config._retry = true;
      config.headers = {
        ...config.headers,
        authorization: `Bearer ${accessToken}`,
      };
      return api(config);
    } catch (refreshError) {
      return Promise.reject(refreshError);
    }
  }

  return Promise.reject(error);
}

// ... existing code ...
```

Now when you catch the error in your calling code, you'll have access to more detailed information:

```typescript
try {
  await saveNotificationsSubscribe(/* ... args ... */);
} catch (error: any) {
  console.error(error.message); // "[API] HTTP 401 - /api/subscribe - Invalid authentication"
  console.error(error.requestDetails); // { url, method, status, responseData }
}
```

This approach:
1. Enhances the error message with more context
2. Adds a `requestDetails` object to the error with useful debugging information
3. Preserves the original error object structure
4. Still allows the error to be handled normally in try/catch blocks

---



---

