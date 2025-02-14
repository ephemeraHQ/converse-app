## SpecStory

## User Query Implementation in TypeScript (2/12/2025, 9:48:56 AM)

_**User**_

create a user query litte bit like we do in @conversation-query.ts 



---

_**Assistant**_

I'll help create a user query file following similar patterns from the conversation query. Here's the implementation:

```typescript:features/authentication/user-query.ts
import { queryOptions, skipToken, useQuery } from "@tanstack/react-query";
import { queryClient } from "@/queries/queryClient";
import { captureError } from "@/utils/capture-error";
import { updateObjectAndMethods } from "@/utils/update-object-and-methods";
import { Optional } from "@/types/general";
import { z } from "zod";

// Define Zod schema for user data validation
const UserSchema = z.object({
  id: z.string(),
  address: z.string(),
  username: z.string().nullable(),
  avatarUrl: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

type IUser = z.infer<typeof UserSchema>;

export type UserQueryData = IUser;

type IGetUserArgs = {
  address: string;
};

type IGetUserArgsWithCaller = IGetUserArgs & { caller: string };

async function getUser(args: IGetUserArgs) {
  const { address } = args;

  if (!address) {
    throw new Error("Address is required");
  }

  const totalStart = new Date().getTime();

  try {
    // Replace with your actual API endpoint
    const response = await fetch(`/api/users/${address}`);
    const data = await response.json();
    
    // Validate response data
    const user = UserSchema.parse(data);

    const totalEnd = new Date().getTime();
    const totalTimeDiff = totalEnd - totalStart;

    if (totalTimeDiff > 3000) {
      captureError(
        new Error(
          `[useUserQuery] Fetched user for ${address} in ${totalTimeDiff}ms`
        )
      );
    }

    return user;
  } catch (error) {
    throw new Error(`Failed to fetch user: ${error}`);
  }
}

export const useUserQuery = (args: IGetUserArgsWithCaller) => {
  return useQuery(getUserQueryOptions(args));
};

export function getUserQueryOptions(
  args: Optional<IGetUserArgsWithCaller, "caller">
) {
  const { address, caller } = args;
  const enabled = !!address;
  return queryOptions({
    meta: {
      caller,
    },
    queryKey: ["user", address?.toLowerCase()],
    queryFn: enabled ? () => getUser({ address }) : skipToken,
    enabled,
  });
}

export const setUserQueryData = (args: IGetUserArgs & { user: UserQueryData }) => {
  const { address, user } = args;
  queryClient.setQueryData(
    getUserQueryOptions({
      address,
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
```

This implementation follows the same patterns as the conversation query with some key features:

1. Uses Zod for response validation
2. Follows the same query options pattern
3. Includes similar helper functions for managing cache
4. Uses the same error handling and performance monitoring
5. Follows TypeScript best practices with proper typing

The main differences are:

1. Simpler data model focused on user data
2. Direct API call instead of XMTP client usage
3. Simpler query key structure
4. No sync requirements like in the conversation query

You'll need to:

1. Replace the API endpoint in `getUser` with your actual user API endpoint
2. Adjust the `UserSchema` to match your actual user data structure
3. Add any additional user-specific functionality you need

Would you like me to make any adjustments to this implementation?

---

_**User**_

put the getUser api thing inside @users.ts and use axios . but keep zod we want something clean a litte bit like we do in @topics.ts 

---

_**Assistant**_

I'll help modify both files to follow the pattern from topics.ts, using axios and keeping the Zod schema.

```typescript:utils/api/users.ts
import { Platform } from "react-native";
import { api, oldApi } from "./api";
import { getXmtpApiHeaders } from "./auth";
import * as Device from "expo-device";
import { z } from "zod";
import logger from "@/utils/logger";

// Define Zod schemas
const UserSchema = z.object({
  id: z.string(),
  address: z.string(),
  username: z.string().nullable(),
  avatarUrl: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type IUser = z.infer<typeof UserSchema>;

export async function getUser(args: { address: string }) {
  logger.debug(`[API USERS] getUser for address: ${args.address}`);
  const { address } = args;

  if (!address) {
    throw new Error("Address is required");
  }

  const { data } = await oldApi.get(`/api/users/${address}`, {
    headers: await getXmtpApiHeaders(address),
  });

  const parseResult = UserSchema.safeParse(data);
  if (!parseResult.success) {
    logger.error(
      "[API USERS] getUser parse error:",
      JSON.stringify(parseResult.error)
    );
    throw new Error("Failed to parse user data");
  }

  return parseResult.data;
}

export const createUser = async (args: {
  privyUserId: string;
  smartContractWalletAddress: string;
  inboxId: string;
}) => {
  const { privyUserId, smartContractWalletAddress, inboxId } = args;

  await api.post(
    "/api/user/create",
    {
      inboxId,
      address: smartContractWalletAddress,
      privyId: privyUserId,
      deviceName:
        /* todo get we get the ios entgitlement to get "vivians iphone"*/ Device.modelId,
      os: Platform.OS.toLowerCase(),
    },
    { headers: await getXmtpApiHeaders(smartContractWalletAddress) }
  );
};
```

Now I'll update the user-query.ts file to use this API function:

```typescript:features/authentication/user-query.ts
import { queryOptions, skipToken, useQuery } from "@tanstack/react-query";
import { queryClient } from "@/queries/queryClient";
import { updateObjectAndMethods } from "@/utils/update-object-and-methods";
import { Optional } from "@/types/general";
import { getUser, type IUser } from "@/utils/api/users";

export type UserQueryData = IUser;

type IGetUserArgs = {
  address: string;
};

type IGetUserArgsWithCaller = IGetUserArgs & { caller: string };

export const useUserQuery = (args: IGetUserArgsWithCaller) => {
  return useQuery(getUserQueryOptions(args));
};

export function getUserQueryOptions(
  args: Optional<IGetUserArgsWithCaller, "caller">
) {
  const { address, caller } = args;
  const enabled = !!address;
  return queryOptions({
    meta: {
      caller,
    },
    queryKey: ["user", address?.toLowerCase()],
    queryFn: enabled ? () => getUser({ address }) : skipToken,
    enabled,
  });
}

export const setUserQueryData = (args: IGetUserArgs & { user: UserQueryData }) => {
  const { address, user } = args;
  queryClient.setQueryData(
    getUserQueryOptions({
      address,
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
```

Key changes made:

1. Moved the API logic and Zod schema to `users.ts`
2. Added proper logging using logger
3. Used oldApi (axios) instead of fetch
4. Added proper error handling for schema validation
5. Followed the same pattern as topics.ts for API functions
6. Simplified the user-query.ts file by removing duplicate types and validation
7. Added proper error handling with logger.error for parse errors
8. Maintained the same query pattern as the conversation query

The code is now more consistent with the rest of the codebase and follows the established patterns.

---



---

