## SpecStory

## Merge Enabled Properties in Query Config (12/19/2024, 6:56:06 PM)

_**User**_

if queryOptions has enabled I want to merged both enabled

---

_**Assistant**_

I'll help you modify the `groupMembersQueryConfig` function to merge the `enabled` property from both sources. Here's the update:

```typescript:queries/useGroupMembersQuery.ts
const groupMembersQueryConfig = (
  args: IGroupMembersQueryConfig
): UseQueryOptions<GroupMembersSelectData> => {
  const { account, group, queryOptions } = args;
  const defaultEnabled = !!group && !!group.topic;
  const queryEnabled = queryOptions?.enabled;

  return {
    queryKey: groupMembersQueryKey(account, group?.topic!),
    queryFn: () => fetchGroupMembers(group!),
    enabled: queryEnabled !== undefined ? defaultEnabled && queryEnabled : defaultEnabled,
    ...queryOptions,
  };
};
```

The changes:
1. Extract the default `enabled` condition into a variable for clarity
2. Get the `enabled` value from `queryOptions` if it exists
3. Merge both enabled values if `queryOptions.enabled` exists, otherwise use the default
4. The spread of `queryOptions` remains after our `enabled` property so it won't override our merged value

This way, if `queryOptions` includes an `enabled` property, both conditions must be true for the query to be enabled. If `queryOptions` doesn't include `enabled`, it will use just the default condition.

---



---

