## SpecStory

## Updating Zod Schema for User Response (2/12/2025, 3:40:56 PM)

_**User**_

replace getUser zod with this scehma

type IGetUserByPrivyUserIdResponse = {
  userId: string;
  inboxes: {
    inboxId: string;
    privyEthAddress: string;
  }[];
};

---

_**Assistant**_

I'll help update the Zod schema in the users.ts file. Here's how we should modify it:

```typescript:utils/api/users.ts
// ... existing imports ...

const InboxSchema = z.object({
  inboxId: z.string(),
  privyEthAddress: z.string(),
});

const GetUserByPrivyUserIdResponseSchema = z.object({
  userId: z.string(),
  inboxes: z.array(InboxSchema),
});

export type IGetUserByPrivyUserIdResponse = z.infer<typeof GetUserByPrivyUserIdResponseSchema>;

// ... existing code ...

export async function getUser(args: { privyId: string }) {
  apiLogger.debug(`[API USERS] getUser for privyId: ${args.privyId}`);
  const { privyId } = args;

  if (!privyId) {
    throw new Error("PrivyId is required");
  }

  const { data } = await oldApi.get(`/api/users/${privyId}`, {
    headers: await getXmtpApiHeaders(privyId),
  });

  const parseResult = GetUserByPrivyUserIdResponseSchema.safeParse(data);
  if (!parseResult.success) {
    apiLogger.error(
      "[API USERS] getUser parse error:",
      JSON.stringify(parseResult.error)
    );
    throw new Error("Failed to parse user data");
  }

  return parseResult.data;
}

// ... rest of existing code ...
```

I've made the following changes:
1. Removed the old schemas (ProfileSchema, DeviceSchema, DeviceIdentitySchema, UserSchema) since they're no longer needed
2. Added new schemas (InboxSchema and GetUserByPrivyUserIdResponseSchema) to match the new response type
3. Updated the getUser function to use the new schema for validation
4. Removed the old type exports that are no longer needed
5. Added export for the new response type inferred from the schema

The rest of the file remains unchanged. Let me know if you need any clarification or have questions!

---



---

