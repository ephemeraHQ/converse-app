## SpecStory

## Fixing Array Comparison in Code (1/14/2025, 7:58:10 PM)

_**User**_

those return array like [string, string] so fix to compare correclty

---

_**Assistant**_

I'll help you fix the comparison of the query keys. Since `conversationDataQueryKey()` returns an array, we should compare them properly by checking each element or using a deep comparison.

Here's the fix:

```typescript:queries/conversation-data-query.ts
// ... existing code ...
  resolver: (items, query) => {
    const match = items.find(
      (item) =>
        conversationDataQueryKey(query.account, query.topic)[0] === conversationDataQueryKey(item.account, item.topic)[0] &&
        conversationDataQueryKey(query.account, query.topic)[1] === conversationDataQueryKey(item.account, item.topic)[1]
    );
    if (!match) return undefined;
    // ... rest of the code ...
  },
// ... existing code ...
```

Alternatively, for better performance and readability since we're calling `conversationDataQueryKey` multiple times, we could store the query keys first:

```typescript:queries/conversation-data-query.ts
// ... existing code ...
  resolver: (items, query) => {
    const queryKey = conversationDataQueryKey(query.account, query.topic);
    const match = items.find((item) => {
      const itemKey = conversationDataQueryKey(item.account, item.topic);
      return queryKey[0] === itemKey[0] && queryKey[1] === itemKey[1];
    });
    if (!match) return undefined;
    // ... rest of the code ...
  },
// ... existing code ...
```

This fix ensures we're properly comparing the array elements of the query keys instead of comparing the arrays themselves, which would always return false since arrays are reference types in JavaScript.

---

_**User**_

maybe join?

---

_**Assistant**_

Yes, that's a cleaner solution! We can join the array elements to create a single string for comparison.

```typescript:queries/conversation-data-query.ts
// ... existing code ...
        conversationDataQueryKey(query.account, query.topic).join() ===
        conversationDataQueryKey(item.account, item.topic).join()
// ... existing code ...
```

This is more concise and achieves the same result since `join()` without arguments will concatenate array elements with commas, creating a unique string representation that we can compare directly.

---



---

