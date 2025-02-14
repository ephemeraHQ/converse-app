## SpecStory

## Update privyId to privyUserId (2/12/2025, 3:03:00 PM)

_**User**_

change privyId with privyUserId

---

_**Assistant**_

I'll help you update the file to change `privyId` to `privyUserId`. This is a straightforward rename of the parameter across the file.

```typescript:features/authentication/user-query.ts
// ... existing code ...

type IGetUserArgs = {
  privyUserId: string;
};

type IGetUserArgsWithCaller = IGetUserArgs & { caller: string };

export const useUserQuery = (args: IGetUserArgsWithCaller) => {
  return useQuery(getUserQueryOptions(args));
};

export function getUserQueryOptions(
  args: Optional<IGetUserArgsWithCaller, "caller">
) {
  const { privyUserId, caller } = args;
  return queryOptions({
    meta: {
      caller,
    },
    queryKey: getUserQueryKey({ privyUserId }),
    queryFn: () => getUser({ privyUserId }),
    enabled: !!privyUserId,
  });
}

export const setUserQueryData = (
  args: IGetUserArgs & { user: UserQueryData }
) => {
  const { privyUserId, user } = args;
  queryClient.setQueryData(
    getUserQueryOptions({
      privyUserId,
    }).queryKey,
    user
  );
};

export function updateUserQueryData(
  args: IGetUserArgs & {
    userUpdate: Partial<UserQueryData>;
  }
) {
  const { userUpdate } = args;
  queryClient.setQueryData(
    getUserQueryOptions(args).queryKey,
    (previousUser) => {
      if (!previousUser) {
        return undefined;
      }
      return updateObjectAndMethods(previousUser, userUpdate);
    }
  );
}

export const getUserQueryData = (args: IGetUserArgs) => {
  return queryClient.getQueryData(getUserQueryOptions(args).queryKey);
};

export function getOrFetchUser(args: IGetUserArgsWithCaller) {
  return queryClient.ensureQueryData(getUserQueryOptions(args));
}

export function ensureUserQueryData(args: IGetUserArgsWithCaller) {
  return queryClient.ensureQueryData(getUserQueryOptions(args));
}

export function fetchUserQueryData(args: IGetUserArgsWithCaller) {
  return queryClient.fetchQuery(getUserQueryOptions(args));
}
```

I've replaced all occurrences of `privyId` with `privyUserId` throughout the file. This includes:
1. The type definition for `IGetUserArgs`
2. Parameter destructuring in `getUserQueryOptions`
3. Parameter destructuring in `setUserQueryData`
4. All references in function calls and query key generation

Note that this change assumes that the imported `getUserQueryKey` function and `getUser` API function have also been updated to use `privyUserId` instead of `privyId` in their parameter types.

---



---

