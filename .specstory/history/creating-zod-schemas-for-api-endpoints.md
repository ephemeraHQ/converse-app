## SpecStory

## Creating Zod Schemas for API Endpoints (2/4/2025, 1:42:34 PM)

_**User**_

look at @topics.ts  and create zod schema for each endpoint. Remove the typed return since it will be inferred from the zod schema

---

_**Assistant**_

I'll help you add Zod schemas for each endpoint and update the return types to use inference. Here are the necessary changes:

```typescript:utils/api/topics.ts
// ... existing code ...

// Response schemas
const MessageResponseSchema = z.object({
  message: z.string(),
});

const TopicSchema = z.object({
  isDeleted: z.boolean(),
  isPinned: z.boolean(),
  markedAsUnread: z.boolean(),
  readUntil: z.number().optional(),
  timestamp: z.number().optional(),
  /** @deprecated */
  status: z.enum(["unread", "read", "deleted"]).optional().nullable(),
});

// Request schemas
const GetTopicsRequestSchema = z.object({
  account: z.string(),
  topics: z.array(z.string()),
});

const GetAllTopicsRequestSchema = z.object({
  account: z.string(),
});

const GetTopicRequestSchema = z.object({
  account: z.string(),
  topic: z.string(),
});

const MarkTopicAsReadRequestSchema = z.object({
  account: z.string(),
  topic: z.string(),
  readUntil: z.number(),
});

const TopicActionRequestSchema = z.object({
  account: z.string(),
  topic: z.string(),
});

// Response

---

_**User**_

dont change things in topics api. do it for @profiles.ts 

---

_**Assistant**_

I'll help add Zod schemas for the profiles API endpoints. Here's how we can update the profiles.ts file:

```typescript:utils/api/profiles.ts
import { getCurrentAccount } from "@/data/store/accountsStore";
import type { ProfileType } from "@/features/onboarding/types/onboarding.types";
import type { IProfileSocials } from "@/features/profiles/profile-types";
import type { InboxId } from "@xmtp/react-native-sdk";
import { api } from "./api";
import { getXmtpApiHeaders } from "./auth";
import { ObjectTyped } from "@/utils/object-typed";
import { z } from "zod";

// Define schemas
const ProfileSocialsSchema = z.record(z.string(), z.any()); // Replace with actual IProfileSocials schema

const ProfileResponseSchema = z.record(z.string(), ProfileSocialsSchema);

const ProfileSearchResponseSchema = z.record(z.string(), ProfileSocialsSchema);

const ClaimProfileResponseSchema = z.string();

const UsernameValidResponseSchema = z.string();

const EnsResolveResponseSchema = z.object({
  address: z.string().nullable(),
});

const UnsResolveResponseSchema = z.object({
  address: z.string().nullable(),
});

const FarcasterResolveResponseSchema = z.object({
  address: z.string().nullable(),
});

export const getProfilesForAddresses = async (addresses: string[]) => {
  const { data } = await api.post("/api/profile/batch", {
    addresses,
  });
  return ProfileResponseSchema.parse(data);
};

export const getProfilesForInboxIds = async ({ inboxIds }: { inboxIds: InboxId[] }) => {
  const { data } = await api.get("/api/inbox/", {
    params: { ids: inboxIds.join(",") },
  });
  // Transform data to only include first profile social for each inbox ID
  const transformedData = ObjectTyped.fromEntries(
    Object.entries(data).map(([inboxId, profileSocials]) => [
      inboxId,
      Array.isArray(profileSocials) ? profileSocials[0] : profileSocials,
    ])
  );
  return ProfileResponseSchema.parse(transformedData);
};

export const searchProfilesForCurrentAccount = async (query: string) => {
  const currentAccount = getCurrentAccount()!;
  const { data } = await api.get("/api/profile/search", {
    headers: await getXmtpApiHeaders(currentAccount),
    params: { query },
  });
  return ProfileSearchResponseSchema.parse(data);
};

export const claimProfile = async ({
  account,
  profile,
}: {
  account: string;
  profile: ProfileType;
}) => {
  const { data } = await api.post("/api/profile/username", profile, {
    headers: await getXmtpApiHeaders(account),
  });
  return ClaimProfileResponseSchema.parse(data);
};

export const checkUsernameValid = async (address: string, username: string) => {
  const { data } = await api.get("/api/profile/username/valid", {
    params: { address, username },
    headers: await getXmtpApiHeaders(address),
  });
  return UsernameValidResponseSchema.parse(data);
};

export const resolveEnsName = async (name: string) => {
  const { data } = await api.get("/api/profile/ens", { params: { name } });
  const parsed = EnsResolveResponseSchema.parse(data);
  return parsed.address;
};

export const resolveUnsDomain = async (domain: string) => {
  const { data } = await api.get("/api/profile/uns", { params: { domain } });
  const parsed = UnsResolveResponseSchema.parse(data);
  return parsed.address;
};

export const resolveFarcasterUsername = async (username: string) => {
  const { data } = await api.get("/api/profile/farcaster", {
    params: { username },
  });
  const parsed = FarcasterResolveResponseSchema.parse(data);
  return parsed.address;
};
```

Key changes made:
1. Added Zod schemas for each API response type
2. Removed explicit return type annotations since they'll be inferred from the Zod schemas
3. Added .parse() calls to validate the response data
4. Added z as an import from 'zod'

Note: The `ProfileSocialsSchema` is currently using `z.any()` as a placeholder. You'll want to replace this with the actual schema that matches your `IProfileSocials` type structure.

---



---

