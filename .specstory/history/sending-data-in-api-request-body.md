## SpecStory

## Sending Data in API Request Body (1/15/2025, 3:15:03 PM)

_**User**_

params seems to send in the query? like in the url but I want in the body

---

_**Assistant**_

I'll help you modify the code to send the data in the request body instead of as URL query parameters. For API calls using axios (which I assume `api` is based on), we can use the `data` parameter to send information in the request body.

Here's how to modify the code:

```typescript:utils/api/topics.ts
const { data } = await api.get(`/api/topics`, {
  headers: await getXmtpApiHeaders(account),
  data: { topics },  // For GET requests, use data instead of params to send in body
});
```

However, it's important to note that while technically possible, sending a body with a GET request is not recommended as it goes against HTTP conventions. If you need to send data in the request body, you should use POST instead:

```typescript:utils/api/topics.ts
const { data } = await api.post(`/api/topics`, 
  { topics },  // This becomes the request body
  {
    headers: await getXmtpApiHeaders(account),
  }
);
```

The POST version is the recommended approach when sending data in the request body. The syntax is `post(url, data, config)` where:
- First argument is the URL
- Second argument is the request body
- Third argument is the config object (for headers, etc.)

---



---

