## SpecStory

## Adding Deprecated Comments to Functions (2/10/2025, 3:01:17 PM)

_**User**_

put the deprecated comments above each functions here

---

_**Assistant**_

I'll add deprecated comments above the relevant functions. Here are the edits:

```typescript:queries/useProfileSocialsQuery.ts
// ... existing code ...

/**
 * @deprecated Use useProfileQuery instead
 */
export const useProfileSocialsQuery = (peerAddress: string) => {
  return useQuery(profileSocialsQueryConfig(peerAddress));
};

/**
 * @deprecated Use useProfilesQuery instead
 */
export const useProfileSocialsQueries = (peerAddresses: string[]) => {
  return useQueries({
    queries: peerAddresses.map((peerAddress) =>
      profileSocialsQueryConfig(peerAddress)
    ),
  });
};

/**
 * @deprecated Use prefetchProfileQuery instead
 */
export const prefetchProfileSocialsQuery = (
  account: string,
  peerAddress: string
) => {
  return queryClient.prefetchQuery(profileSocialsQueryConfig(peerAddress));
};

/**
 * @deprecated Use fetchProfileQuery instead
 */
export const fetchProfileSocialsQuery = (
  account: string,
  peerAddress: string
) => {
  return queryClient.fetchQuery<IProfileSocials | null>(
    profileSocialsQueryConfig(peerAddress)
  );
};

/**
 * @deprecated Use setProfileQueryData instead
 */
export const setProfileSocialsQueryData = (
  peerAddress: string,
  data: IProfileSocials,
  updatedAt?: number
) => {
  return queryClient.setQueryData<ProfileSocialsData>(
    profileSocialsQueryKey(peerAddress),
    data,
    {
      updatedAt,
    }
  );
};

/**
 * @deprecated Use setProfilesQueryData instead
 */
export const setProfileRecordSocialsQueryData = (
  record: Record<string, IProfileSocials>
) => {
  Object.keys(record).forEach((peerAddress) => {
    setProfileSocialsQueryData(peerAddress, record[peerAddress]);
  });
};

/**
 * @deprecated Use getProfileQueryData instead
 */
export const getProfileSocialsQueryData = (peerAddress: string) => {
  return queryClient.getQueryData<ProfileSocialsData>(
    profileSocialsQueryConfig(peerAddress).queryKey
  );
};

/**
 * @deprecated Use invalidateProfileQuery instead
 */
export const invalidateProfileSocialsQuery = (address: string) => {
  queryClient.invalidateQueries({
    queryKey: profileSocialsQueryKey(address),
  });
};

// ... existing code ...
```

I've added `@deprecated` JSDoc comments above each exported function, indicating which new function should be used instead. This helps developers know that these functions are deprecated and provides guidance on which alternative functions to use.

---

_**User**_

For the code present, we get this error:
```
React Hook useCallback has unnecessary dependencies: 'displayName', 'router', and 'userAddress'. Either exclude them or remove the dependency array.
```
How can I resolve this? If you propose a fix, please make it concise.

---

_**Assistant**_

For the `handleContextMenuAction` callback in `profile-me.screen-header.tsx`, we should keep only the dependencies that are actually used within the function's switch cases. Here's the fix:

```typescript:features/profiles/profile-me.screen-header.tsx
// ... existing code ...

const handleContextMenuAction = useCallback(
  async (actionId: string) => {
    Haptics.selectionAsync();
    switch (actionId) {
      case "edit":
        profileMeStoreActions.setEditMode(true);
        break;
      case "share":
        if (isMyProfile) {
          navigate("ShareProfile");
        } else {
          const shareUrl = `${config.websiteDomain}/profile/${peerAddress}`;
          await Share.share({
            message: shareUrl,
          });
        }
        break;
    }
  },
  [isMyProfile, peerAddress, profileMeStoreActions]
);

// ... existing code ...
```

I removed `displayName`, `router`, and `userAddress` from the dependency array since they're not used in the current implementation of the function.

---



---

