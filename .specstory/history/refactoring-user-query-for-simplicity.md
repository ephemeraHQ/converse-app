## SpecStory

## Refactoring User Query for Simplicity (2/13/2025, 9:24:54 AM)

_**User**_

remove prviy args i want no arg this should be getCurrentUser

---

_**Assistant**_

I'll help modify the user query to get the current user without requiring privy arguments. Here's how we can update the file:

```typescript:features/authentication/user-query.ts
import { getUserQueryKey } from "@/queries/QueryKeys";
import { queryClient } from "@/queries/queryClient";
import { Optional } from "@/types/general";
import { getCurrentUser, type User } from "@/utils/api/users";
import { updateObjectAndMethods } from "@/utils/update-object-and-methods";
import { queryOptions, useQuery } from "@tanstack/react-query";

export type UserQueryData = User;

type IGetUserArgs = {
  caller?: string;
};

export const useUserQuery = (args: IGetUserArgs = {}) => {
  return useQuery(getUserQueryOptions(args));
};

export function getUserQueryOptions(args: IGetUserArgs = {}) {
  const { caller } = args;
  return queryOptions({
    meta: {
      caller,
    },
    queryKey: getUserQueryKey(),
    queryFn: getCurrentUser,
  });
}

export const setUserQueryData = (args: { user: UserQueryData }) => {
  const { user } = args;
  queryClient.setQueryData(getUserQueryOptions().queryKey, user);
};

export function updateUserQueryData(args: {
  userUpdate: Partial<UserQueryData>;
}) {
  const { userUpdate } = args;
  queryClient.setQueryData(
    getUserQueryOptions().queryKey,
    (previousUser) => {
      if (!previousUser) {
        return undefined;
      }
      return updateObjectAndMethods(previousUser, userUpdate);
    }
  );
}

export const getUserQueryData = () => {
  return queryClient.getQueryData(getUserQueryOptions().queryKey);
};

export function getOrFetchUser(args: IGetUserArgs = {}) {
  return queryClient.ensureQueryData(getUserQueryOptions(args));
}

export function ensureUserQueryData(args: IGetUserArgs = {}) {
  return queryClient.ensureQueryData(getUserQueryOptions(args));
}

export function fetchUserQueryData(args: IGetUserArgs = {}) {
  return queryClient.fetchQuery(getUserQueryOptions(args));
}
```

Key changes made:
1. Removed privy-specific arguments and types
2. Changed `IUser` to `User` type from the API
3. Made `getCurrentUser` the query function instead of `getUserByPrivyUserId`
4. Simplified the arguments to only include an optional caller
5. Made all args optional with default empty objects
6. Updated the query key to not require any arguments
7. Removed unnecessary type parameters

You'll need to make sure your `QueryKeys.ts` and `users.ts` API files are updated accordingly. Let me know if you need help with those changes as well.

---



---

