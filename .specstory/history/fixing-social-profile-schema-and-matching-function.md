## SpecStory

## Fixing Social Profile Schema and Matching Function (2/18/2025, 3:26:41 PM)

_**User**_

fix this based on scahem in @social-lookup.api.ts 

---

_**Assistant**_

Looking at the schema in social-lookup.api.ts, I notice that the error stems from a mismatch between the schema definition and how we're using it in the does-socials-match-text-query.ts file. Let me fix this by updating the schema and the matching function.

First, we need to update the Web3SocialProfileSchema to include all the fields we're checking:

```typescript:features/social-profiles/social-lookup.api.ts
// ... existing imports ...

const ENSNameSchema = z.object({
  name: z.string(),
  displayName: z.string().optional(),
});

const LensHandleSchema = z.object({
  handle: z.string(),
  name: z.string().optional(),
});

const FarcasterUsernameSchema = z.object({
  username: z.string(),
  name: z.string().optional(),
});

const UnstoppableDomainSchema = z.object({
  domain: z.string(),
});

const UserNameSchema = z.object({
  name: z.string(),
  displayName: z.string().optional(),
});

const Web3SocialProfileSchema = z.object({
  type: Web3SocialProfileType,
  address: z.string(),
  name: z.string(),
  bio: z.string().optional(),
  avatar: z.string().optional(),
  ensNames: z.array(ENSNameSchema).optional(),
  lensHandles: z.array(LensHandleSchema).optional(),
  farcasterUsernames: z.array(FarcasterUsernameSchema).optional(),
  unstoppableDomains: z.array(UnstoppableDomainSchema).optional(),
  userNames: z.array(UserNameSchema).optional(),
});

// ... rest of the file remains the same ...
```

Now let's update the matching function to use proper typing:

```typescript:features/profiles/utils/does-socials-match-text-query.ts
import { IWeb3SocialProfile } from "@/features/social-profiles/social-lookup.api";

export function doesSocialsMatchTextQuery(args: {
  socials: IWeb3SocialProfile[];
  normalizedQuery: string;
}) {
  const { socials, normalizedQuery } = args;

  return socials.some((profile) => {
    return [
      // Check address
      profile.address.toLowerCase().includes(normalizedQuery),
      // Check ENS
      profile.ensNames?.some(
        (ens) =>
          ens.name.toLowerCase().includes(normalizedQuery) ||
          ens.displayName?.toLowerCase()?.includes(normalizedQuery)
      ),
      // Check Lens
      profile.lensHandles?.some(
        (lens) =>
          lens.handle.toLowerCase().includes(normalizedQuery) ||
          lens.name?.toLowerCase()?.includes(normalizedQuery)
      ),
      // Check Farcaster
      profile.farcasterUsernames?.some(
        (fc) =>
          fc.username.toLowerCase().includes(normalizedQuery) ||
          fc.name?.toLowerCase()?.includes(normalizedQuery)
      ),
      // Check Unstoppable Domains
      profile.unstoppableDomains?.some((ud) =>
        ud.domain.toLowerCase().includes(normalizedQuery)
      ),
      // Check userNames
      profile.userNames?.some(
        (un) =>
          un.name.toLowerCase().includes(normalizedQuery) ||
          un.displayName?.toLowerCase()?.includes(normalizedQuery)
      ),
    ].some(Boolean);
  });
}
```

The key changes made:

1. Updated the import to use `IWeb3SocialProfile` instead of `IWeb3SocialProfileType`
2. Added proper schema definitions for all the social profile fields we're checking
3. Made the profile fields properly typed through the schema
4. Removed the optional chaining on `profile.address` since it's required in the schema
5. All the array methods now have proper typing through the schema definitions

These changes ensure type safety and match the actual data structure we're working with.

---

_**User**_

hmm not sure it'S right, here's our backend for reference:

import { Router, type Request, type Response } from "express";
import { createThirdwebClient } from "thirdweb";
import { getSocialProfiles } from "thirdweb/social";
import { z } from "zod";

const lookupRouter = Router();

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
    .union([FarcasterProfileSchema, LensProfileSchema, EnsProfileSchema])
    .optional(),
});

const SocialProfilesSchema = z.array(SocialProfileSchema);

type ISocialProfiles = z.infer<typeof SocialProfilesSchema>;

type SocialProfilesResponse = {
  socialProfiles: ISocialProfiles;
};

type ErrorResponse = {
  error: string;
};

// Combined response type
type AddressLookupResponse = SocialProfilesResponse | ErrorResponse;

type GetAddressLookupRequestParams = {
  address: string;
};

// GET /lookup/address/:address - Lookup social profiles by address
lookupRouter.get(
  "/address/:address",
  async (
    req: Request<GetAddressLookupRequestParams>,
    res: Response<AddressLookupResponse>,
  ) => {
    try {
      const { address } = req.params;

      if (!process.env.THIRDWEB_SECRET_KEY) {
        throw new Error("THIRDWEB_SECRET_KEY is not set");
      }

      const client = createThirdwebClient({
        secretKey: process.env.THIRDWEB_SECRET_KEY,
      });

      const profiles = await getSocialProfiles({
        address,
        client,
      });

      const validationResult = SocialProfilesSchema.safeParse(profiles);

      if (!validationResult.success) {
        console.error(
          "Social profiles validation failed:",
          validationResult.error,
        );
      }

      res.json({
        socialProfiles: validationResult.success
          ? validationResult.data
          : (profiles as ISocialProfiles),
      });
    } catch {
      res.status(500).json({
        error: "Failed to lookup address",
      });
    }
  },
);

export default lookupRouter;


---

_**Assistant**_

Ah, I see. Let me update the schema to match the backend implementation:

```typescript:features/social-profiles/social-lookup.api.ts
import { api } from "@/utils/api/api";
import { z } from "zod";

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
    .union([FarcasterProfileSchema, LensProfileSchema, EnsProfileSchema])
    .optional(),
});

export type IWeb3SocialProfile = z.infer<typeof SocialProfileSchema>;

const SocialProfilesResponseSchema = z.object({
  socialProfiles: z.array(SocialProfileSchema),
});

/**
 * Fetches social profiles for a given address using the lookup endpoint
 */
export const fetchSocialProfilesForAddress = async (
  address: string
): Promise<IWeb3SocialProfile[]> => {
  try {
    const { data } = await api.get(`/api/v1/lookup/address/${address}`);
    const response = SocialProfilesResponseSchema.parse(data);
    return response.socialProfiles;
  } catch (error) {
    console.error("[API SOCIAL-LOOKUP] Failed to fetch social profiles:", error);
    return [];
  }
};
```

And now let's update the matching function to work with this schema:

```typescript:features/profiles/utils/does-socials-match-text-query.ts
import { IWeb3SocialProfile } from "@/features/social-profiles/social-lookup.api";

export function doesSocialsMatchTextQuery(args: {
  socials: IWeb3SocialProfile[];
  normalizedQuery: string;
}) {
  const { socials, normalizedQuery } = args;

  return socials.some((profile) => {
    return [
      // Check name and bio
      profile.name?.toLowerCase().includes(normalizedQuery),
      profile.bio?.toLowerCase().includes(normalizedQuery),

      // Check ENS metadata
      profile.type === "ens" &&
        profile.metadata && {
          name: profile.metadata.name?.toLowerCase().includes(normalizedQuery),
          display: profile.metadata.display?.toLowerCase().includes(normalizedQuery),
        },

      // Check Lens metadata
      profile.type === "lens" &&
        profile.metadata &&
        profile.metadata.name?.toLowerCase().includes(normalizedQuery),

      // Check Farcaster metadata
      profile.type === "farcaster" &&
        profile.metadata && {
          username: profile.metadata.username?.toLowerCase().includes(normalizedQuery),
          display: profile.metadata.display?.toLowerCase().includes(normalizedQuery),
        },
    ].some(Boolean);
  });
}
```

The key changes:
1. Updated schemas to match the backend implementation
2. Added proper type handling for the different social profile types
3. Updated the matching function to handle the new schema structure
4. Added proper type guards for checking profile types and metadata
5. Simplified the response handling in the API function

This should now correctly match the backend implementation and provide proper type safety throughout the application.

---

_**User**_

@XMTP how do i implement consent

---

_**Assistant**_

Based on the XMTP documentation, I'll help you implement consent functionality. Here's how we can implement it:

```typescript:features/consent/consent.api.ts
import { z } from "zod";

const ConsentStateSchema = z.enum(["allowed", "denied", "unknown"]);
export type ConsentState = z.infer<typeof ConsentStateSchema>;

const ConsentProofPayloadSchema = z.object({
  signature: z.string(), // hex format
  timestamp: z.number(), // unix timestamp
  payloadVersion: z.number(),
});

export type ConsentProofPayload = z.infer<typeof ConsentProofPayloadSchema>;
```

```typescript:features/consent/use-consent.ts
import { useXmtpClient } from "@/features/xmtp/use-xmtp-client";
import { logger } from "@/utils/logger";

export function useConsent() {
  const { client } = useXmtpClient();

  const allowContact = async (args: { address: string }) => {
    if (!client) return;

    try {
      await client.contacts.allow([args.address]);
      logger.debug(`Allowed contact for address: ${args.address}`);
    } catch (error) {
      logger.error(`Failed to allow contact: ${error}`);
      throw error;
    }
  };

  const denyContact = async (args: { address: string }) => {
    if (!client) return;

    try {
      await client.contacts.deny([args.address]);
      logger.debug(`Denied contact for address: ${args.address}`);
    } catch (error) {
      logger.error(`Failed to deny contact: ${error}`);
      throw error;
    }
  };

  const getConsentState = async (args: { address: string }) => {
    if (!client) return "unknown";

    try {
      const state = await client.contacts.consentState(args.address);
      logger.debug(`Got consent state for address ${args.address}: ${state}`);
      return state;
    } catch (error) {
      logger.error(`Failed to get consent state: ${error}`);
      throw error;
    }
  };

  const refreshConsentList = async () => {
    if (!client) return;

    try {
      await client.contacts.refreshConsentList();
      logger.debug("Refreshed consent list");
    } catch (error) {
      logger.error(`Failed to refresh consent list: ${error}`);
      throw error;
    }
  };

  const streamConsentList = async () => {
    if (!client) return;

    try {
      const stream = await client.contacts.streamConsentList();
      logger.debug("Started streaming consent list");
      return stream;
    } catch (error) {
      logger.error(`Failed to stream consent list: ${error}`);
      throw error;
    }
  };

  return {
    allowContact,
    denyContact,
    getConsentState,
    refreshConsentList,
    streamConsentList,
  };
}
```

```typescript:features/consent/use-subscribe.ts
import { useXmtpClient } from "@/features/xmtp/use-xmtp-client";
import { logger } from "@/utils/logger";
import { ConsentProofPayload } from "./consent.api";

export function useSubscribe() {
  const { client } = useXmtpClient();

  const subscribe = async (args: { 
    publisherAddress: string;
    consentProof: ConsentProofPayload;
  }) => {
    if (!client) return;

    try {
      // Create new conversation with consent proof
      const conversation = await client.conversations.newConversation(
        args.publisherAddress,
        {}, // Empty context
        args.consentProof
      );

      logger.debug(
        `Created conversation with consent proof for publisher: ${args.publisherAddress}`
      );

      return conversation;
    } catch (error) {
      logger.error(`Failed to subscribe to publisher: ${error}`);
      throw error;
    }
  };

  const requestConsentSignature = async (args: { publisherAddress: string }) => {
    if (!client) return;

    try {
      const timestamp = Date.now();
      const message = `XMTP : Grant inbox consent to sender\n\nCurrent Time: ${new Date(
        timestamp
      ).toISOString()}\nFrom Address: ${
        args.publisherAddress
      }\n\nFor more info: https://xmtp.org/signatures/`;

      // Request wallet signature
      const signature = await client.signer.signMessage(message);

      logger.debug(
        `Got consent signature for publisher: ${args.publisherAddress}`
      );

      return {
        signature,
        timestamp,
        payloadVersion: 1,
      } satisfies ConsentProofPayload;
    } catch (error) {
      logger.error(`Failed to get consent signature: ${error}`);
      throw error;
    }
  };

  return {
    subscribe,
    requestConsentSignature,
  };
}
```

This implementation provides:

1. A consent management system with:
   - Allow/deny contacts
   - Get consent state
   - Refresh consent list
   - Stream consent updates

2. A subscription system that:
   - Requests consent signatures from users
   - Creates conversations with consent proofs
   - Follows XMTP's consent proof format

To use these hooks:

```typescript
function SubscribeButton({ publisherAddress }: { publisherAddress: string }) {
  const { subscribe, requestConsentSignature } = useSubscribe();
  
  const handleSubscribe = async () => {
    // Get consent signature from user
    const consentProof = await requestConsentSignature({ 
      publisherAddress 
    });
    
    // Subscribe with consent proof
    await subscribe({
      publisherAddress,
      consentProof,
    });
  };

  return <button onClick={handleSubscribe}>Subscribe</button>;
}
```

```typescript
function ConsentManager({ contactAddress }: { contactAddress: string }) {
  const { allowContact, denyContact, getConsentState } = useConsent();
  
  return (
    <div>
      <button onClick={() => allowContact({ address: contactAddress })}>
        Allow
      </button>
      <button onClick={() => denyContact({ address: contactAddress })}>
        Block
      </button>
    </div>
  );
}
```

This implementation follows XMTP's best practices for consent management and subscription handling, including proper error handling and logging.

---



---

