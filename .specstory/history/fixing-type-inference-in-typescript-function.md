## SpecStory

## Fixing Type Inference in TypeScript Function (1/16/2025, 2:09:24 PM)

_**User**_

why does this return type infered is 

function getGroupQueryData(args: {
    account: string;
    topic: ConversationTopic;
}): Group<SupportedCodecsType> | Dm<SupportedCodecsType> | undefined

it should be only Group no? because of my "select" in queryOptions

---

_**Assistant**_

You're right - the return type should only be `GroupWithCodecsType | undefined` because of the `select` function in `getGroupQueryOptions`. The issue is that `queryClient.getQueryData()` doesn't automatically infer the transformed type from the query options' `select` function.

Let's fix this by adding an explicit type to `getQueryData`:

```typescript:queries/useGroupQuery.ts
export function getGroupQueryData(args: {
  account: string;
  topic: ConversationTopic;
}): GroupWithCodecsType | undefined {
  const { account, topic } = args;
  return queryClient.getQueryData<GroupWithCodecsType>(
    getGroupQueryOptions({
      account,
      topic,
    }).queryKey
  );
}
```

The changes:
1. Added return type annotation `: GroupWithCodecsType | undefined`
2. Added generic type parameter to `getQueryData<GroupWithCodecsType>`

This will ensure the return type matches what we expect after the `select` transformation in `getGroupQueryOptions`.

---

_**User**_

but shoultnd'T be automatic working with infereing if i use the queryOptions from react-query?

---

_**Assistant**_

Yes, you're right! The type inference should work automatically when using `queryOptions`. The issue might be related to how `getConversationQueryOptions` is typed.

Let's check the return type of `getGroupQueryOptions`:

```typescript:queries/useGroupQuery.ts
export function getGroupQueryOptions(args: {
  account: string;
  topic: ConversationTopic;
}) {
  const { account, topic } = args;
  return queryOptions({
    ...getConversationQueryOptions({
      account,
      topic,
    }),
    select: (data) => (isConversationGroup(data) ? data : null),
  });
}
```

The issue might be that TypeScript isn't properly inferring the type transformation from the `select` function. We can help TypeScript by adding explicit generic types to `queryOptions`:

```typescript:queries/useGroupQuery.ts
export function getGroupQueryOptions(args: {
  account: string;
  topic: ConversationTopic;
}) {
  const { account, topic } = args;
  return queryOptions<ConversationQueryData, GroupWithCodecsType | null>({
    ...getConversationQueryOptions({
      account,
      topic,
    }),
    select: (data) => (isConversationGroup(data) ? data : null),
  });
}
```

Now the type inference should work correctly throughout the chain, including in `getGroupQueryData`. The first generic type is the input type (`ConversationQueryData`), and the second is the transformed type after `select` (`GroupWithCodecsType | null`).

---

_**User**_

not working. any cleaner way?

---

_**Assistant**_



Yes, there's a cleaner way. Instead of adding explicit generics, we can use `satisfies` to ensure type safety while maintaining inference. Here's the cleaner approach:

```typescript:queries/useGroupQuery.ts
export function getGroupQueryOptions(args: {
  account: string;
  topic: ConversationTopic;
}) {
  const { account, topic } = args;
  return {
    ...getConversationQueryOptions({
      account,
      topic,
    }),
    select: (data: ConversationQueryData) => 
      isConversationGroup(data) ? data : null,
  } satisfies Parameters<typeof queryOptions>[0];
}
```

This approach should properly infer the return type throughout the chain while being more maintainable. The `satisfies` operator ensures type safety without losing inference, and typing the `data` parameter in the `select` function helps TypeScript understand the transformation flow.

---



---

