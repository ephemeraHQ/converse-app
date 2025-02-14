## SpecStory

## Refactoring Code for ETH Address Profile Socials (2/14/2025, 9:04:47 AM)

_**User**_

change the name of some stuff. because here we're getting profileSocials for a specific ethAddress: string. so remove query, change some var and function name etc...

---

_**Assistant**_

I'll help modify the code to better reflect that we're getting profile socials for a specific ETH address. Here are the changes:

```typescript:utils/api/api-profiles/api-profiles-socials.ts
// ... existing code for schemas ...

// Change name to reflect ETH address lookup
const ProfileSocialsResponseSchema = z.object({
  socialProfiles: z.array(SocialProfileSchema),
});

type ISocialProfile = z.infer<typeof SocialProfileSchema>;

// Rename function and parameters to reflect ETH address lookup
export async function getProfileSocialsForCurrentAccount({
  ethAddress,
}: {
  ethAddress: string;
}) {
  const currentAccount = getCurrentAccount()!;

  try {
    const { data } = await api.get("/api/profiles/search", {
      headers: await getXmtpApiHeaders(currentAccount),
      params: { ethAddress },
    });

    const parseResult = ProfileSocialsResponseSchema.safeParse(data);

    if (!parseResult.success) {
      throw new ApiError(
        `[API PROFILES] getProfileSocialsForCurrentAccount parse error for ethAddress: ${ethAddress}`,
        parseResult.error
      );
    }

    return parseResult.data.socialProfiles;
  } catch (error) {
    throw new ApiError(
      `[API PROFILES] getProfileSocialsForCurrentAccount failed for ethAddress: ${ethAddress}`,
      error
    );
  }
}

export type { ISocialProfile };
```

Key changes made:
1. Renamed `ProfileSearchResponseSchema` to `ProfileSocialsResponseSchema` to better reflect its purpose
2. Renamed the main function from `searchProfilesForCurrentAccount` to `getProfileSocialsForCurrentAccount`
3. Changed the parameter from `query` to `ethAddress` to be more specific about what we're looking up
4. Updated error messages to reference `ethAddress` instead of `query`
5. Updated the params object to use `ethAddress` instead of `query`

The schema definitions remain unchanged since they correctly define the structure of the social profiles.

---



---

