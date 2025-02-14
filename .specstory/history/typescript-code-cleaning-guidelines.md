## SpecStory

## TypeScript Code Cleaning Guidelines (2/18/2025, 12:13:33 PM)

_**User**_

remove emojis except the one for Bad and good examples like the green check and the "X"

---

_**Assistant**_

I'll help remove the emojis while keeping the ❌ and ✅ for examples. Here's the updated content:

```text:.cursorrules
General

- When I ask you to "clean" a file, **rewrite the content following the rules** and best practices below.
- **Do not make unnecessary structural changes**—preserve function parameter types inline unless explicitly stated otherwise.
- **Do not extract types** into external variables unless they are reused elsewhere.

---

Core Principles

- **Write concise, readable TypeScript code.**
- **Use functional programming patterns.**
- **Prioritize readability over compactness**—separate logical blocks with empty lines.
- **Use descriptive variable names** with auxiliary verbs (e.g., `isLoading`, `hasError`). Long names are fine if they improve clarity. Example: `useGroupMembersInfo`.
- **Don't nest functions inside other functions** unless explicitly instructed.
- **Add clear, concise comments** for non-obvious logic or unconventional implementation decisions.
  - Comments should be **above** the code they describe.
  - Preserve existing comments when refactoring unless the related code is removed.
- **Handle errors at the caller level**—only log errors if truly necessary and always rethrow them to the caller.
- **Minimize external hooks inside custom hooks** to prevent unnecessary re-renders. Use getter functions instead, especially in mutations.
- **Use Zod** for API response validation—define schemas and infer types from them.
- **Keep files small and focused**—place hooks and components in separate files unless they are small wrapper components.
- **Refactor components using the composable pattern** when optional props become excessive.

Logging

- **Use a logger instead of `console.log`**
- **Prefer `logger.debug`** and template literals for inline logging:

```ts
// ❌ Bad: Object-based logging
logger.debug("[buildXmtpClient] Starting to build XMTP client", { address, inboxId });

// ✅ Good: Inline template literal logging
logger.debug(`[buildXmtpClient] Starting to build XMTP client with address: ${address} and inboxId: ${inboxId}`);
```

---

TypeScript

- **Use `type` over `interface`** (prefix types with `I`, e.g., `IMyItem`).
- **Never use `any`.**
- **Avoid enums**—use maps or string literals instead.
- **Prefer type inference** over explicit typing whenever possible.
- **Use type assertions (`satisfies`)** on return objects over function return type annotations if inference isn't working well.

---

Function Parameters

Guidelines

- **Use the `function` keyword** for pure functions.
- **Prefer object parameters**:

  ```ts
  function getMetadataOptions(args: { account: string; topic: string }) { ... }
  ```

  over

  ```ts
  function getMetadataOptions(account: string, topic: string) { ... }
  ```

- **Destructure parameters at the top of the function body.**
- **Do not create external types for function parameters** unless they are used outside the function.

Examples

❌ Bad: Extracting types unnecessarily

```ts
type MetadataOptions = { account: string; topic: string };

function getMetadataOptions(args: MetadataOptions) {
const { account, topic } = args;
}
```

✅ Good: Keeping types inline

```ts
function getMetadataOptions(args: { account: string; topic: string }) {
const { account, topic } = args;
}
```

---

React Query Principles

Query Key Management

- **All query keys must be defined in `QueryKeys.ts`**
- **Follow naming pattern**: `<entity>QueryKey`
- **Always use query key factories**

```ts
export const conversationsQueryKey = (account: string) => [
QueryKeys.CONVERSATIONS,
account?.toLowerCase(),
];
```

---

Query Options Encapsulation

- **Use `queryOptions` helper for type safety.**
- **Encapsulate query options for reusability.**
- **Avoid conditional query keys**—instead, use `enabled`.

```ts
queryKey: enabled ? queryKeyFactory(args) : ["profile"], // ❌ Bad
queryKey: queryKeyFactory(args), // ✅ Good
```

---

Mutation Patterns

- **Use optimistic updates & error rollbacks.**
- **Keep query cache consistent.**
- **Use service functions for API calls.**

```ts
const { mutateAsync: pinConversationAsync } = useMutation({
mutationFn: () => pinTopicService({ account, topic }),
onMutate: async () => {
const previousData = getConversationMetadataQueryData({ account, topic });
updateConversationMetadataOptimistically({ isPinned: true });
return { previousData };
},
onError: (error, variables, context) => {
logger.error(`Failed to pin conversation: ${error}`);
rollbackConversationMetadata(context.previousData);
},
onSettled: () => {
queryClient.invalidateQueries({
queryKey: conversationMetadataQueryKey(account, topic),
});
},
});
```

---

Cache Management

- **Use atomic updates with `queryClient` methods.**
- **Retrieve query keys through query options.**
- **Use built-in type inference instead of manual assertions.**

```ts
// ✅ Good: Query options
const options = getConversationsQueryOptions({ account });
queryClient.getQueryData(options.queryKey);

// ❌ Bad: Direct query key usage
queryClient.getQueryData(conversationsQueryKey(account));
```

---

Error Handling

Guidelines

- **Use the `captureError` function** to capture errors.
- **Enhance error objects** by adding contextual information.

```ts
try {
// Some API call
} catch (error) {
captureError(error, { context: "Fetching user data" });
}
```

---
```

---



---

