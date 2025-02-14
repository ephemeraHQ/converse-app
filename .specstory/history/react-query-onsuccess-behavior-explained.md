## SpecStory

## React Query onSuccess Behavior Explained (2/4/2025, 1:22:46 PM)

_**User**_

read react-query doc. Will this defuaklt on success be triggered if we get the data from the persitance ?

---

_**Assistant**_

Let me help clarify this behavior based on the React Query documentation.

No, the `onSuccess` callback in the `QueryCache` configuration will **not** be triggered when data is retrieved from persistence/cache. This global `onSuccess` handler is only called when a query successfully fetches fresh data from the network via its `queryFn`.

When data is retrieved from persistence:
1. No network request is made
2. No `queryFn` is executed
3. Therefore, the `onSuccess` handler is not triggered

If you need to track when data is retrieved from persistence, you have two options:

1. Use the individual query's `onSuccess` callback, which will be called for both fresh and cached data:

```typescript
useQuery({
  queryKey: ['someKey'],
  queryFn: fetchData,
  onSuccess: (data) => {
    // This will be called for both fresh and cached data
    logger.debug(`Data retrieved: ${JSON.stringify(data)}`);
  }
})
```

2. Use the `select` option to track data access:

```typescript
useQuery({
  queryKey: ['someKey'],
  queryFn: fetchData,
  select: (data) => {
    // This will be called whenever data is accessed, whether from cache or network
    logger.debug(`Data accessed: ${JSON.stringify(data)}`);
    return data;
  }
})
```

This behavior is by design since the global `QueryCache` handlers are primarily meant for monitoring actual network operations rather than cache hits.

---



---

