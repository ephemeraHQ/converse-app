## SpecStory

## Fixing onError Context Typing in React Query (1/22/2025, 2:20:00 PM)

_**User**_

why does onError context is unknonw?

---

_**Assistant**_

The `context` parameter in `onError` is showing up as unknown because it's not properly typed based on the return type of the `onMutate` function. In React Query, the context type in `onError` is inferred from what `onMutate` returns.

Let's fix this by adding a proper context type to the mutation options:

```typescript:features/consent/use-allow-group.mutation.ts
// ... existing code ...

type AllowGroupMutationContext = {
  previousGroup: GroupWithCodecsType;
};

export const getAllowGroupMutationOptions = (
  account: string,
  topic: ConversationTopic
): MutationOptions<
  IAllowGroupReturnType,
  unknown,
  AllowGroupMutationVariables,
  AllowGroupMutationContext // Add the context type here
> => {
  return {
    mutationKey: [MutationKeys.ALLOW_GROUP, account, topic],
    mutationFn: allowGroup,
    onMutate: async (args): Promise<AllowGroupMutationContext> => {
      // ... existing onMutate code ...
    },
    onError: (_, variables, context: AllowGroupMutationContext) => {
      // ... existing onError code ...
    },
  };
};

// ... existing code ...
```

The changes:
1. Added a new type `AllowGroupMutationContext` to define the shape of the context object
2. Added the context type as the fourth generic parameter to `MutationOptions`
3. Explicitly typed the return of `onMutate` and the context parameter in `onError`

This will properly type the context parameter and provide better type safety and autocompletion.

---

_**User**_

but could i use somethign that infer the values? without specifying them?

---

_**Assistant**_

Yes! You can use TypeScript's `Awaited` and `ReturnType` utility types to infer the context type from the `onMutate` function. Here's how:

```typescript:features/consent/use-allow-group.mutation.ts
export const getAllowGroupMutationOptions = (
  account: string,
  topic: ConversationTopic
): MutationOptions<
  IAllowGroupReturnType,
  unknown,
  AllowGroupMutationVariables,
  Awaited<ReturnType<NonNullable<typeof getAllowGroupMutationOptions>[""]["onMutate"]>>
> => {
  return {
    // ... existing code ...
  };
};
```

However, this creates a circular type reference since we're trying to reference the return type of `onMutate` within its own options definition. 

A cleaner approach would be to extract the `onMutate` function and infer from it:

```typescript:features/consent/use-allow-group.mutation.ts
// ... existing code ...

const onMutate = async (args: AllowGroupMutationVariables) => {
  const { account, group } = args;

  const previousGroup = getGroupQueryData({ account, topic: group.topic });

  if (!previousGroup) {
    throw new Error("Previous group not found");
  }

  const updatedGroup = updateObjectAndMethods(previousGroup, {
    state: "allowed",
  });

  setGroupQueryData({ account, topic: group.topic, group: updatedGroup });

  removeConversationFromUnknownConsentConversationsQueryData({
    account,
    topic: group.topic,
  });

  addConversationToConversationsQuery({
    account,
    conversation: group,
  });

  return { previousGroup };
};

export const getAllowGroupMutationOptions = (
  account: string,
  topic: ConversationTopic
): MutationOptions<
  IAllowGroupReturnType,
  unknown,
  AllowGroupMutationVariables,
  Awaited<ReturnType<typeof onMutate>>
> => {
  return {
    mutationKey: [MutationKeys.ALLOW_GROUP, account, topic],
    mutationFn: allowGroup,
    onMutate,
    onError: (_, variables, context) => { // context will be properly typed now
      if (!context) {
        return;
      }
      // ... rest of onError code ...
    },
  };
};

// ... existing code ...
```

This approach:
1. Extracts the `onMutate` function
2. Uses `Awaited<ReturnType<typeof onMutate>>` to infer the context type
3. Keeps the code DRY and type-safe
4. TypeScript will now properly infer that `context` in `onError` has a `previousGroup` property of type `GroupWithCodecsType`

---



---

