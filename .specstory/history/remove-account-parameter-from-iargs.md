## SpecStory

## Remove Account Parameter from IArgs (2/3/2025, 10:56:34 AM)

_**User**_

remove account Iarg should only be inboxID

---

_**Assistant**_

I'll help you modify the code to remove the `account` parameter from `IArgs` and all related functions. Here's the simplified version highlighting the changes:

```typescript:queries/useInboxProfileSocialsQuery.ts
// ... existing code ...

type IArgs = {
  inboxId: InboxId;
};

const inboxProfileSocialsBatchFetcher = create({
  // ... existing code ...
});

const fetchInboxProfileSocials = async ({
  inboxId,
}: IArgs): Promise<IProfileSocials[] | null> => {
  return inboxProfileSocialsBatchFetcher.fetch(inboxId);
};

const inboxProfileSocialsQueryConfig = ({ inboxId }: IArgs) =>
  queryOptions({
    queryKey: profileSocialsQueryKey({ inboxId }),
    queryFn: () => fetchInboxProfileSocials({ inboxId }),
    enabled: !!inboxId,
    persister: reactQueryPersister,
    initialData: (): IProfileSocials[] | null | undefined => {
      if (!inboxId) {
        return undefined;
      }
      if (mmkv.contains(profileSocialsQueryKey({ inboxId }))) {
        const data = JSON.parse(
          mmkv.getString(profileSocialsQueryKey({ inboxId }))!
        ) as IProfileSocials[];
        return data;
      }
    },
    gcTime: 1000 * 60 * 60 * 24 * 30,
  });

export const useInboxProfileSocialsQuery = ({
  inboxId,
}: {
  inboxId: InboxId | undefined;
}) => {
  return useQuery(inboxProfileSocialsQueryConfig({ inboxId }));
};

export const useInboxProfileSocialsQueries = ({
  inboxIds,
}: {
  inboxIds: InboxId[];
}) => {
  return useQueries({
    queries: inboxIds.map((inboxId) =>
      inboxProfileSocialsQueryConfig({ inboxId })
    ),
  });
};

export const fetchInboxProfileSocialsQuery = ({ inboxId }: IArgs) => {
  return queryClient.fetchQuery(
    inboxProfileSocialsQueryConfig({ inboxId })
  );
};

export const setInboxProfileSocialsQueryData = ({
  inboxId,
  data,
  updatedAt,
}: IArgs & { data: IProfileSocials; updatedAt?: number }) => {
  return queryClient.setQueryData(
    inboxProfileSocialsQueryConfig({ inboxId }).queryKey,
    (oldData) => {
      if (!oldData) return undefined;
      return {
        ...oldData,
        updatedAt,
      };
    },
    { updatedAt }
  );
};

export const getInboxProfileSocialsQueryData = ({
  inboxId,
}: IArgs) => {
  return queryClient.getQueryData(
    inboxProfileSocialsQueryConfig({ inboxId }).queryKey
  );
};

export const invalidateInboxProfileSocialsQuery = ({
  inboxId,
}: IArgs) => {
  queryClient.invalidateQueries({
    queryKey: inboxProfileSocialsQueryConfig({ inboxId }).queryKey,
  });
};

export const ensureInboxProfileSocialsQueryData = ({
  inboxId,
}: IArgs) => {
  return queryClient.ensureQueryData(
    inboxProfileSocialsQueryConfig({ inboxId })
  );
};
```

Changes made:
1. Removed `account` from `IArgs` type
2. Removed `account` parameter from all function calls and definitions
3. Updated query key calls to only use `inboxId`
4. Removed `account` from function parameters in all exported functions
5. Updated type definitions in function parameters to remove `account`

Note: Make sure that the `profileSocialsQueryKey` function in `QueryKeys.ts` is also updated to only accept `inboxId` as a parameter.

---

_**User**_

For the code present, we get this error:
```
The result of useQueries is not referentially stable, so don't pass it directly into the dependencies array of useMemo. Instead, destructure the return value of useQueries and pass the destructured values into the dependency array of useMemo.
```
How can I resolve this? If you propose a fix, please make it concise.

---

_**Assistant**_

Here's the concise fix for the `useGroupMembersSocials` hook to resolve the referential stability issue:

```typescript:hooks/useGroupMembersSocials.ts
// ... existing code ...
  const queries = useQueries({
    queries: memberInboxIds.map((inboxId) =>
      getInboxProfileSocialsQueryConfig({ inboxId })
    ),
  });

  const mappedData = useMemo(() => {
    const profileMap: Record<InboxId, IProfileSocials[] | null | undefined> = {};
    queries.forEach(({ data: socials }, index) => {
      const memberId = groupMembers?.ids[index];
      if (!memberId) return;
      profileMap[memberId] = socials;
    });
    return profileMap;
  }, [queries.map(q => q.data), groupMembers]); // Only depend on the data array

  return mappedData;
```

The key change is using `queries.map(q => q.data)` in the dependency array instead of the entire `queries` result.

---

_**User**_

For the code present, we get this error:
```
React Hook useMemo has a missing dependency: 'queries'. Either include it or remove the dependency array.
```
How can I resolve this? If you propose a fix, please make it concise.

---

_**Assistant**_

Here's the fix to properly handle the `queries` dependency:

```typescript:hooks/useGroupMembersSocials.ts
// ... existing code ...
  const mappedData = useMemo(() => {
    const profileMap: Record<InboxId, IProfileSocials[] | null | undefined> = {};
    queries.forEach(({ data: socials }, index) => {
      const memberId = groupMembers?.ids[index];
      if (!memberId) return;
      profileMap[memberId] = socials;
    });
    return profileMap;
  }, [queries, groupMembers]);

  return mappedData;
```

The fix is to simply include `queries` in the dependency array since we're using it directly in the callback. React Query handles the stability of the query results internally.

---



---

