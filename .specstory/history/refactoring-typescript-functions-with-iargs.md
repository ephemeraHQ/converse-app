## SpecStory

## Refactoring TypeScript Functions with IArgs (2/3/2025, 10:51:57 AM)

_**User**_

fix all to be args: {}. Create a type IArgs at the top and reuseu

---

_**Assistant**_

I'll help you update the functions to use object parameters and create a reusable IArgs type. Here are the necessary changes:

```typescript:queries/useInboxProfileSocialsQuery.ts
// ... existing code ...

type IArgs = {
  account: string;
  inboxId: InboxId;
};

type IMultipleArgs = {
  account: string;
  inboxIds: InboxId[];
};

const profileSocialsQueryKey = ({ account, inboxId }: IArgs): QueryKey => [
  "inboxProfileSocials",
  account?.toLowerCase(),
  inboxId?.toLowerCase(),
];

export const inboxProfileSocialsQueryStorageKey = ({ account, inboxId }: IArgs) =>
  profileSocialsQueryKey({ account, inboxId }).join("-");

// ... existing code ...

const fetchInboxProfileSocials = async ({
  account,
  inboxId,
}: IArgs): Promise<IProfileSocials[] | null> => {
  const data = await profileSocials.fetch(inboxId);
  const key = inboxProfileSocialsQueryStorageKey({ account, inboxId });

  // Set in mmkv to use for notifications in Swift
  mmkv.delete(key);
  if (data) {
    mmkv.set(key, JSON.stringify(data));
  }

  return data;
};

const inboxProfileSocialsQueryConfig = ({ account, inboxId }: {
  account: string;
  inboxId: InboxId | undefined;
}) =>
  queryOptions({
    queryKey: profileSocialsQueryKey({ account, inboxId: inboxId! }),
    queryFn: () => fetchInboxProfileSocials({ account, inboxId: inboxId! }),
    enabled: !!account && !!inboxId,
    persister: reactQueryPersister,
    initialData: (): IProfileSocials[] | null | undefined => {
      if (!account || !inboxId) {
        return undefined;
      }
      if (mmkv.contains(inboxProfileSocialsQueryStorageKey({ account, inboxId }))) {
        const data = JSON.parse(
          mmkv.getString(inboxProfileSocialsQueryStorageKey({ account, inboxId }))!
        ) as IProfileSocials[];
        return data;
      }
    },
    gcTime: 1000 * 60 * 60 * 24 * 30,
  });

export const useInboxProfileSocialsQuery = ({
  account,
  inboxId,
}: {
  account: string;
  inboxId: InboxId | undefined;
}) => {
  return useQuery(inboxProfileSocialsQueryConfig({ account, inboxId }));
};

export const useInboxProfileSocialsQueries = ({
  account,
  inboxIds,
}: IMultipleArgs) => {
  return useQueries({
    queries: inboxIds.map((inboxId) =>
      inboxProfileSocialsQueryConfig({ account, inboxId })
    ),
  });
};

export const fetchInboxProfileSocialsQuery = ({ account, inboxId }: IArgs) => {
  return queryClient.fetchQuery(
    inboxProfileSocialsQueryConfig({ account, inboxId })
  );
};

export const setInboxProfileSocialsQueryData = ({
  account,
  inboxId,
  data,
  updatedAt,
}: IArgs & { data: IProfileSocials; updatedAt?: number }) => {
  return queryClient.setQueryData(
    inboxProfileSocialsQueryConfig({ account, inboxId }).queryKey,
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

export const getInboxProfileSocialsQueryData = ({ account, inboxId }: IArgs) => {
  return queryClient.getQueryData(
    inboxProfileSocialsQueryConfig({ account, inboxId }).queryKey
  );
};

export const invalidateInboxProfileSocialsQuery = ({
  account,
  inboxId,
}: IArgs) => {
  queryClient.invalidateQueries({
    queryKey: inboxProfileSocialsQueryConfig({ account, inboxId }).queryKey,
  });
};

export const ensureInboxProfileSocialsQueryData = ({
  account,
  inboxId,
}: IArgs) => {
  return queryClient.ensureQueryData(
    inboxProfileSocialsQueryConfig({ account, inboxId })
  );
};
```

The changes include:
1. Added `IArgs` and `IMultipleArgs` types at the top
2. Updated all function parameters to use object destructuring
3. Updated all function calls to pass objects instead of individual parameters
4. Created a specific type for `setInboxProfileSocialsQueryData` that extends `IArgs` with additional properties
5. Maintained the same functionality while making the code more consistent with the style guide

---



---

