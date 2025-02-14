## SpecStory

## Removing Logger Functionality from Code (1/31/2025, 10:16:16 AM)

_**User**_

remove all the logger stuff

---

_**Assistant**_

I'll help remove all the logger-related code. Here's the simplified version showing just the changes needed:

```typescript:queries/useInboxProfileSocialsQuery.ts
// ... existing code ...

const profileSocials = create({
  fetcher: async (inboxIds: InboxId[]) => {
    const data = await getProfilesForInboxIds({ inboxIds });
    return data;
  },
  resolver: indexedResolver(),
  scheduler: windowedFiniteBatchScheduler({
    windowMs: 10,
    maxBatchSize: 150,
  }),
});

const fetchInboxProfileSocials = async (
  account: string,
  inboxId: InboxId
): Promise<IProfileSocials[] | null> => {
  const data = await profileSocials.fetch(inboxId);
  const key = inboxProfileSocialsQueryStorageKey(account, inboxId);

  // Set in mmkv to use for notifications in Swift
  mmkv.delete(key);
  if (data) {
    mmkv.set(key, JSON.stringify(data));
  }

  return data;
};

// ... existing code ...

export const useInboxProfileSocialsQuery = (
  account: string,
  inboxId: InboxId | undefined
) => {
  return useQuery(inboxProfileSocialsQueryConfig(account, inboxId));
};

export const useInboxProfileSocialsQueries = (
  account: string,
  inboxIds: InboxId[]
) => {
  return useQueries({
    queries: inboxIds.map((inboxId) =>
      inboxProfileSocialsQueryConfig(account, inboxId)
    ),
  });
};

export const fetchInboxProfileSocialsQuery = (
  account: string,
  inboxId: InboxId
) => {
  return queryClient.fetchQuery(
    inboxProfileSocialsQueryConfig(account, inboxId)
  );
};

export const setInboxProfileSocialsQueryData = (
  account: string,
  inboxId: InboxId,
  data: IProfileSocials,
  updatedAt?: number
) => {
  return queryClient.setQueryData(
    inboxProfileSocialsQueryConfig(account, inboxId).queryKey,
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

export const getInboxProfileSocialsQueryData = (
  account: string,
  inboxId: InboxId
): IProfileSocials[] | null => {
  return queryClient.getQueryData(
    inboxProfileSocialsQueryConfig(account, inboxId).queryKey
  ) ?? null;
};

export const invalidateInboxProfileSocialsQuery = (
  account: string,
  inboxId: InboxId
) => {
  queryClient.invalidateQueries({
    queryKey: inboxProfileSocialsQueryConfig(account, inboxId).queryKey,
  });
};

export const ensureInboxProfileSocialsQueryData = (
  account: string,
  inboxId: InboxId
) => {
  return queryClient.ensureQueryData(
    inboxProfileSocialsQueryConfig(account, inboxId)
  );
};
```

Changes made:
1. Removed the logger import
2. Removed all logger.debug calls throughout the file
3. Removed commented-out logger calls in useInboxProfileSocialsQuery and useInboxProfileSocialsQueries
4. Simplified return statements where logger calls were the only other operation

---



---

