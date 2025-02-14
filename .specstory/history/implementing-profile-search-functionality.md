## SpecStory

## Implementing Profile Search Functionality (2/14/2025, 9:11:32 AM)

_**User**_

do something like but for profilesSearch and the arg will be query: string and the endpoint.

you can chekc the backend ednpoint here and what will it return

profilesRouter.get(
  "/search",
  async (
    req: Request<unknown, unknown, unknown, SearchProfilesQuery>,
    res: Response,
  ) => {
    try {
      const query = req.query.query.trim();

      if (query.length === 0) {
        res.status(400).json({ error: "Invalid search query" });
        return;
      }

      const profiles = await prisma.profile.findMany({
        where: {
          name: {
            contains: query,
            mode: "insensitive",
          },
          deviceIdentity: {
            xmtpId: {
              not: null,
            },
          },
        },
        select: {
          id: true,
          name: true,
          description: true,
          deviceIdentity: {
            select: {
              xmtpId: true,
            },
          },
        },
        take: 50,
      });

      res.json(
        profiles.map(
          (profile) =>
            ({
              id: profile.id,
              name: profile.name,
              description: profile.description,
              // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
              xmtpId: profile.deviceIdentity.xmtpId!,
            }) satisfies SearchProfilesResult,
        ),
      );
    } catch {
      res.status(500).json({ error: "Failed to search profiles" });
    }
  },
);

---

_**Assistant**_

I'll help create a profiles search function similar to the social profiles one, but for searching profiles by query string. Based on the backend endpoint, I'll create the appropriate schema and function.

```typescript:utils/api/api-profiles/api-profiles-search.ts
import { getCurrentAccount } from "@/features/multi-inbox/multi-inbox.store";
import { api } from "@/utils/api/api";
import { getXmtpApiHeaders } from "@/utils/api/auth";
import { ApiError } from "@/utils/error";
import { z } from "zod";

const ProfileSearchResultSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  xmtpId: z.string(),
});

const ProfileSearchResponseSchema = z.array(ProfileSearchResultSchema);

export type IProfileSearchResult = z.infer<typeof ProfileSearchResultSchema>;

export async function searchProfilesForCurrentAccount({
  query,
}: {
  query: string;
}) {
  const currentAccount = getCurrentAccount()!;

  try {
    const { data } = await api.get("/api/profiles/search", {
      headers: await getXmtpApiHeaders(currentAccount),
      params: { query },
    });

    const parseResult = ProfileSearchResponseSchema.safeParse(data);

    if (!parseResult.success) {
      throw new ApiError(
        `[API PROFILES] searchProfilesForCurrentAccount parse error for query: ${query}`,
        parseResult.error
      );
    }

    return parseResult.data;
  } catch (error) {
    throw new ApiError(
      `[API PROFILES] searchProfilesForCurrentAccount failed for query: ${query}`,
      error
    );
  }
}
```

This implementation:

1. Creates a Zod schema matching the backend response structure
2. Defines a type for the search results using schema inference
3. Implements a search function that:
   - Takes a query string parameter
   - Uses the current account for authentication
   - Makes a GET request to `/api/profiles/search`
   - Validates the response using the schema
   - Returns the typed search results
4. Includes proper error handling with ApiError

The function follows the same pattern as `getProfileSocialsForCurrentAccount` but is adapted for the profile search endpoint.

---

_**User**_

ok question here, the backend returns xmtpId but I want to convert this to inboxId, how can i do this in a clean way?

---

_**Assistant**_

Since we want to convert xmtpId to inboxId in the response, we can create a mapping function and modify the schema to reflect this change. Here's how we can do it cleanly:

```typescript:utils/api/api-profiles/api-profiles-search.ts
// ... existing imports ...
import { getInboxIdFromXmtpId } from "@/utils/inbox";

// Backend response schema (internal use only)
const ProfileSearchBackendSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  xmtpId: z.string(),
});

// Our public-facing schema
const ProfileSearchResultSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  inboxId: z.string(),
});

const ProfileSearchResponseSchema = z.array(ProfileSearchBackendSchema);

export type IProfileSearchResult = z.infer<typeof ProfileSearchResultSchema>;

function mapBackendToProfileResult(profile: z.infer<typeof ProfileSearchBackendSchema>): IProfileSearchResult {
  return {
    id: profile.id,
    name: profile.name,
    description: profile.description,
    inboxId: getInboxIdFromXmtpId(profile.xmtpId),
  };
}

export async function searchProfilesForCurrentAccount({
  query,
}: {
  query: string;
}) {
  const currentAccount = getCurrentAccount()!;

  try {
    const { data } = await api.get("/api/profiles/search", {
      headers: await getXmtpApiHeaders(currentAccount),
      params: { query },
    });

    const parseResult = ProfileSearchResponseSchema.safeParse(data);

    if (!parseResult.success) {
      throw new ApiError(
        `[API PROFILES] searchProfilesForCurrentAccount parse error for query: ${query}`,
        parseResult.error
      );
    }

    // Map the backend response to our desired format
    return parseResult.data.map(mapBackendToProfileResult);
  } catch (error) {
    throw new ApiError(
      `[API PROFILES] searchProfilesForCurrentAccount failed for query: ${query}`,
      error
    );
  }
}
```

Key changes made:
1. Created separate schemas for backend response and our public-facing API
2. Added a mapping function `mapBackendToProfileResult` to handle the conversion
3. Used the mapping function in the return statement to transform the data
4. The exported type `IProfileSearchResult` now uses the public-facing schema with `inboxId`

This approach:
- Keeps the data transformation logic isolated and easy to understand
- Maintains type safety throughout the process
- Clearly separates the backend contract from our internal representation
- Makes it easy to modify the transformation logic if needed in the future

---

_**User**_

For the code present, we get this error:
```
'ProfileSearchResultSchema' is assigned a value but only used as a type.
```
How can I resolve this? If you propose a fix, please make it concise.

---

_**Assistant**_

Since we're only using `ProfileSearchResultSchema` for type inference but not for runtime validation, we can remove it and define the type directly:

```typescript:utils/api/api-profiles/api-profiles-search.ts
// Remove ProfileSearchResultSchema and replace with type
export type IProfileSearchResult = {
  id: string;
  name: string;
  description?: string;
  inboxId: string;
};
```

The rest of the code can remain unchanged since we're still validating the backend response with `ProfileSearchBackendSchema`.

---

_**User**_

does "viem" or thirdweb" or any other lib we have ahve an utility function to check if an address is a eth address?

---

_**Assistant**_

Yes, Viem has a built-in utility function called `isAddress` that checks if a string is a valid Ethereum address. Here's how you can use it:

```typescript
import { isAddress } from "viem";

// Example usage
const isValidAddress = isAddress("0x123..."); // returns boolean
```

This function will:
- Return `true` for valid Ethereum addresses (both checksummed and non-checksummed)
- Return `false` for invalid addresses
- Handle both 0x-prefixed and non-prefixed addresses
- Properly validate the checksum if present

It's more reliable than using regex patterns and is actively maintained as part of the Viem library.

---



---

