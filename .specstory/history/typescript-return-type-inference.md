## SpecStory

## TypeScript Return Type Inference (2/4/2025, 1:53:25 PM)

_**User**_

remove all the defined return type. I hate that. I want infering as much as possible

---

_**Assistant**_

I'll help remove the explicit return types and let TypeScript infer them where possible. Here are the necessary changes:

```typescript:utils/api/profiles.ts
// ... existing code ...

export const getProfilesForAddresses = async (addresses: string[]) => {
  const { data } = await api.post("/api/profile/batch", {
    addresses,
  });
  const parseResult = ProfileResponseSchema.safeParse(data);
  if (!parseResult.success) {
    logger.error(
      "[API PROFILES] getProfilesForAddresses parse error:",
      JSON.stringify(parseResult.error)
    );
  }
  return parseResult.success ? parseResult.data : {};
};

export const getProfilesForInboxIds = async ({
  inboxIds,
}: {
  inboxIds: InboxId[];
}) => {
  // ... existing code ...
};

export const searchProfilesForCurrentAccount = async (query: string) => {
  // ... existing code ...
};

export const claimProfile = async ({
  account,
  profile,
}: {
  account: string;
  profile: ProfileType;
}) => {
  // ... existing code ...
};

export const checkUsernameValid = async (address: string, username: string) => {
  // ... existing code ...
};

export const resolveEnsName = async (name: string) => {
  // ... existing code ...
};

export const resolveUnsDomain = async (domain: string) => {
  // ... existing code ...
};

export const resolveFarcasterUsername = async (username: string) => {
  // ... existing code ...
};
```

I've removed all explicit return type annotations from the functions and let TypeScript infer them based on the return statements and Zod schema validations. The functionality remains exactly the same, but the code is now cleaner and follows the style guide's preference for type inference.

---



---

