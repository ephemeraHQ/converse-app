## SpecStory

## TypeScript Profile Search Code Cleanup (2/14/2025, 8:46:18 AM)

_**User**_

clean this and fix this 

---

_**Assistant**_

I'll help clean up and fix the issues in the file. The main problems are:
1. Missing type definition for `IProfileSearchResponse`
2. Missing `ProfileSearchResponseSchema` schema definition
3. Need to better structure the response validation

Here's how we can improve it:

```typescript:utils/api/api-profiles/api-profiles-socials.ts
import { getCurrentAccount } from "@/features/multi-inbox/multi-inbox.store";
import { api } from "@/utils/api/api";
import { getXmtpApiHeaders } from "@/utils/api/auth";
import { captureError } from "@/utils/capture-error";
import { ApiError } from "@/utils/error";
import { z } from "zod";

// Base profile schemas
const FarcasterProfileSchema = z.object({
  fid: z.number().optional(),
  bio: z.string().optional(),
  pfp: z.string().optional(),
  display: z.string().optional(),
  username: z.string().optional(),
  custodyAddress: z.string().optional(),
  addresses: z.array(z.string()).optional(),
});

const LensProfileSchema = z.object({
  name: z.string().optional(),
  bio: z.string().optional(),
  picture: z.string().optional(),
  coverPicture: z.string().optional(),
});

const EnsProfileSchema = z.object({
  name: z.string().optional(),
  address: z.string().optional(),
  avatar: z.string().optional(),
  display: z.string().optional(),
  description: z.string().optional(),
  keywords: z.array(z.string()).optional(),
  email: z.string().optional(),
  mail: z.string().optional(),
  notice: z.string().optional(),
  location: z.string().optional(),
  phone: z.string().optional(),
  url: z.string().optional(),
  twitter: z.string().optional(),
  github: z.string().optional(),
  discord: z.string().optional(),
  telegram: z.string().optional(),
});

const SocialProfileSchema = z.object({
  type: z.enum(["farcaster", "lens", "ens"]),
  name: z.string().optional(),
  avatar: z.string().optional(),
  bio: z.string().optional(),
  metadata: z
    .discriminatedUnion("type", [
      z.object({
        type: z.literal("farcaster"),
        ...FarcasterProfileSchema.shape,
      }),
      z.object({ type: z.literal("lens"), ...LensProfileSchema.shape }),
      z.object({ type: z.literal("ens"), ...EnsProfileSchema.shape }),
    ])
    .optional(),
});

// Profile search response schema
const ProfileSearchResponseSchema = z.object({
  profiles: z.array(SocialProfileSchema).optional(),
  cursor: z.string().optional(),
});

type ISocialProfile = z.infer<typeof SocialProfileSchema>;
type IProfileSearchResponse = z.infer<typeof ProfileSearchResponseSchema>;

export async function searchProfilesForCurrentAccount({ 
  query 
}: {
  query: string;
}): Promise<IProfileSearchResponse> {
  const currentAccount = getCurrentAccount()!;
  
  try {
    const { data } = await api.get("/api/profiles/search", {
      headers: await getXmtpApiHeaders(currentAccount),
      params: { query },
    });

    const parseResult = ProfileSearchResponseSchema.safeParse(data);
    
    if (!parseResult.success) {
      captureError(
        new ApiError(
          `[API PROFILES] searchProfilesForCurrentAccount parse error for query: ${query}`,
          parseResult.error
        )
      );
      return { profiles: [] };
    }

    return parseResult.data;
  } catch (error) {
    captureError(
      new ApiError(
        `[API PROFILES] searchProfilesForCurrentAccount failed for query: ${query}`,
        error
      )
    );
    return { profiles: [] };
  }
}

export type { ISocialProfile, IProfileSearchResponse };
```

Key improvements made:

1. Added missing `ProfileSearchResponseSchema` definition
2. Added proper type definitions using Zod inference
3. Improved error handling with try/catch
4. Changed the function to use object parameters following the style guide
5. Added better error messages with query context
6. Added proper return type for failed cases
7. Exported necessary types
8. Improved code organization with logical grouping and spacing
9. Used function declaration instead of arrow function per style guide
10. Added proper error handling that returns a safe default value

The code now properly validates the API response using Zod and provides proper TypeScript types for all the data structures involved.

---

_**User**_

why a cursor? There are no cursor the bacekend just returns an array of "SocialProfileSchema"

---

_**Assistant**_

You're right - if the backend only returns an array of social profiles, we should simplify the response schema to match exactly what we expect. Let me fix that:

```typescript:utils/api/api-profiles/api-profiles-socials.ts
// ... existing code ...

// Profile search response schema
const ProfileSearchResponseSchema = z.object({
  profiles: z.array(SocialProfileSchema).optional(),
});

type ISocialProfile = z.infer<typeof SocialProfileSchema>;
type IProfileSearchResponse = z.infer<typeof ProfileSearchResponseSchema>;

export async function searchProfilesForCurrentAccount({ 
  query 
}: {
  query: string;
}): Promise<IProfileSearchResponse> {
  const currentAccount = getCurrentAccount()!;
  
  try {
    const { data } = await api.get("/api/profiles/search", {
      headers: await getXmtpApiHeaders(currentAccount),
      params: { query },
    });

    const parseResult = ProfileSearchResponseSchema.safeParse(data);
    
    if (!parseResult.success) {
      captureError(
        new ApiError(
          `[API PROFILES] searchProfilesForCurrentAccount parse error for query: ${query}`,
          parseResult.error
        )
      );
      return { profiles: [] };
    }

    return parseResult.data;
  } catch (error) {
    captureError(
      new ApiError(
        `[API PROFILES] searchProfilesForCurrentAccount failed for query: ${query}`,
        error
      )
    );
    return { profiles: [] };
  }
}

// ... rest of the code ...
```

I removed the `cursor` field from the `ProfileSearchResponseSchema` since it's not part of the backend response. The schema now exactly matches what we expect from the API.

---

_**User**_

no profiles: z.array...  just the array dirreclty

---

_**Assistant**_

Ah, I see - if the backend returns the array directly, we should simplify the schema to just be an array of social profiles. Here's the fix:

```typescript:utils/api/api-profiles/api-profiles-socials.ts
// ... existing code for other schemas ...

// Profile search response schema
const ProfileSearchResponseSchema = z.array(SocialProfileSchema);

type ISocialProfile = z.infer<typeof SocialProfileSchema>;
type IProfileSearchResponse = z.infer<typeof ProfileSearchResponseSchema>;

export async function searchProfilesForCurrentAccount({ 
  query 
}: {
  query: string;
}): Promise<ISocialProfile[]> {
  const currentAccount = getCurrentAccount()!;
  
  try {
    const { data } = await api.get("/api/profiles/search", {
      headers: await getXmtpApiHeaders(currentAccount),
      params: { query },
    });

    const parseResult = ProfileSearchResponseSchema.safeParse(data);
    
    if (!parseResult.success) {
      captureError(
        new ApiError(
          `[API PROFILES] searchProfilesForCurrentAccount parse error for query: ${query}`,
          parseResult.error
        )
      );
      return [];
    }

    return parseResult.data;
  } catch (error) {
    captureError(
      new ApiError(
        `[API PROFILES] searchProfilesForCurrentAccount failed for query: ${query}`,
        error
      )
    );
    return [];
  }
}

export type { ISocialProfile };
```

Key changes:
1. Changed `ProfileSearchResponseSchema` to be a direct array schema
2. Updated return type to be `ISocialProfile[]` instead of an object
3. Updated error cases to return empty array `[]` instead of `{ profiles: [] }`
4. Removed unnecessary `IProfileSearchResponse` type since we're just working with arrays now

---

_**User**_

ok nevernmind the backend reutrn {socialProfiles: []}

---

_**Assistant**_

Ah, I see - let's fix it to match the actual backend response structure:

```typescript:utils/api/api-profiles/api-profiles-socials.ts
// ... existing schemas remain the same ...

// Profile search response schema
const ProfileSearchResponseSchema = z.object({
  socialProfiles: z.array(SocialProfileSchema)
});

type ISocialProfile = z.infer<typeof SocialProfileSchema>;
type IProfileSearchResponse = z.infer<typeof ProfileSearchResponseSchema>;

export async function searchProfilesForCurrentAccount({ 
  query 
}: {
  query: string;
}): Promise<ISocialProfile[]> {
  const currentAccount = getCurrentAccount()!;
  
  try {
    const { data } = await api.get("/api/profiles/search", {
      headers: await getXmtpApiHeaders(currentAccount),
      params: { query },
    });

    const parseResult = ProfileSearchResponseSchema.safeParse(data);
    
    if (!parseResult.success) {
      captureError(
        new ApiError(
          `[API PROFILES] searchProfilesForCurrentAccount parse error for query: ${query}`,
          parseResult.error
        )
      );
      return [];
    }

    return parseResult.data.socialProfiles;
  } catch (error) {
    captureError(
      new ApiError(
        `[API PROFILES] searchProfilesForCurrentAccount failed for query: ${query}`,
        error
      )
    );
    return [];
  }
}

export type { ISocialProfile };
```

Key changes:
1. Updated `ProfileSearchResponseSchema` to match the backend response structure with `socialProfiles` field
2. Still returning `ISocialProfile[]` from the function for simpler usage
3. Updated the successful case to return `parseResult.data.socialProfiles`

---



---

