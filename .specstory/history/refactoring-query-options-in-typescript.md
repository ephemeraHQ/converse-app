## SpecStory

## Refactoring Query Options in TypeScript (12/19/2024, 6:54:27 PM)

_**User**_

change for args and removed enabled and have "queryOptions?" instead

---

_**Assistant**_

I'll help modify the code to use a more consistent args pattern and simplify the query options. Here are the key changes:

```typescript:queries/useGroupMembersQuery.ts
// ... existing code ...

type IGroupMembersQueryConfig = {
  account: string;
  group: GroupWithCodecsType | undefined | null;
  queryOptions?: UseQueryOptions<GroupMembersSelectData>;
};

const groupMembersQueryConfig = (args: IGroupMembersQueryConfig): UseQueryOptions<GroupMembersSelectData> => {
  const { account, group, queryOptions } = args;
  const enabled = !!group && !!group.topic;
  
  return {
    queryKey: groupMembersQueryKey(account, group?.topic!),
    queryFn: () => fetchGroupMembers(group!),
    enabled,
    ...queryOptions,
  };
};

export const useGroupMembersQuery = (args: {
  account: string;
  topic: ConversationTopic;
  queryOptions?: UseQueryOptions<GroupMembersSelectData>;
}) => {
  const { account, topic, queryOptions } = args;
  const { data: group } = useGroupQuery({ account, topic });
  
  return useQuery<GroupMembersSelectData>(
    groupMembersQueryConfig({ account, group, queryOptions })
  );
};

export const useGroupMembersConversationScreenQuery = (args: {
  account: string;
  topic: ConversationTopic;
}) => {
  const { account, topic } = args;
  const { data: group } = useGroupQuery({ account, topic });
  
  return useQuery<GroupMembersSelectData>(
    groupMembersQueryConfig({ account, group })
  );
};

export const useConversationListMembersQuery = (args: {
  account: string;
  group: GroupWithCodecsType | undefined | null;
}) => {
  const { account, group } = args;
  const queryOptions = { enabled: !!group && !group.imageUrlSquare };
  
  return useQuery<GroupMembersSelectData>(
    groupMembersQueryConfig({ account, group, queryOptions })
  );
};

// ... rest of the file remains unchanged ...
```

Key changes made:
1. Created a type `IGroupMembersQueryConfig` for the query config arguments
2. Modified `groupMembersQueryConfig` to accept a single args object
3. Updated all query hooks to use args pattern
4. Removed separate enabled parameter and handled it within the config
5. Integrated queryOptions more consistently across the hooks

The changes make the code more consistent with your preferred style and make it easier to add new options in the future.

---



---

