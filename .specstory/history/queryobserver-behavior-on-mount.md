## SpecStory

## QueryObserver Behavior on Mount (1/14/2025, 1:33:29 PM)

_**User**_

will the observer trigger on mount?

---

_**Assistant**_

Yes, the QueryObserver will trigger on mount. The QueryObserver from `@tanstack/react-query` automatically fetches data when it's instantiated, similar to how a useQuery hook works.

When you create a new QueryObserver instance with:

```typescript
const observer = new QueryObserver(queryClient, {
  ...getConversationListQueryOptions({...}),
  select: (conversations) => ...
});
```

It will:
1. Immediately check if there's cached data for this query
2. If there's no cached data (or if the data is stale), it will trigger a fetch
3. The `subscribe` callback will be called with the initial data (which might be empty at first)
4. When the fetch completes, the `subscribe` callback will be called again with the fresh data

This behavior ensures that you get the conversation data as soon as the component mounts, and also keeps the data in sync with any updates that might occur while the component is mounted.

---



---

