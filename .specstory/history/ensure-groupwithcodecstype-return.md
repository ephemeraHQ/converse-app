## SpecStory

## Ensure GroupWithCodecsType Return (1/16/2025, 2:12:47 PM)

_**User**_

I want to force this to return a GRoupcodec not "ConversationQueryData" from "getConversationQueryOptions"

---

_**Assistant**_

I'll help modify the code to ensure it returns a GroupWithCodecsType instead of ConversationQueryData. Here are the necessary changes:

```typescript:queries/useGroupQuery.ts
// ... existing code ...

export function getGroupQueryOptions(args: {
  account: string;
  topic: ConversationTopic;
}) {
  const { account, topic } = args;
  return queryOptions<GroupWithCodecsType>({
    ...getConversationQueryOptions({
      account,
      topic,
    }),
    select: (data): GroupWithCodecsType => {
      if (!isConversationGroup(data)) {
        throw new Error('Expected group conversation but received different type');
      }
      return data;
    },
  });
}

export function updateGroupQueryData(args: {
  account: string;
  topic: ConversationTopic;
  updates: Partial<GroupWithCodecsType>;
}) {
  queryClient.setQueryData<GroupWithCodecsType>(
    getGroupQueryOptions(args).queryKey,
    (previousGroup) => {
      if (!previousGroup) {
        return undefined;
      }
      return updateObjectAndMethods(previousGroup, args.updates);
    }
  );
}
```

Key changes made:
1. Added explicit type `GroupWithCodecsType` to `queryOptions`
2. Modified the select function to throw an error instead of returning null when the data isn't a group
3. Updated the `updates` type in `updateGroupQueryData` to use `Partial<GroupWithCodecsType>` instead of `Partial<ConversationQueryData>`
4. Added type assertion for `setQueryData` to ensure type safety

This will ensure that the query always returns a GroupWithCodecsType or throws an error if the conversation isn't a group.

---

_**User**_

For the code present, we get this error:
```
No overload matches this call.
  Overload 1 of 3, '(options: DefinedInitialDataOptions<GroupWithCodecsType | null, Error, GroupWithCodecsType | null, QueryKey>): UseQueryOptions<...> & ... 1 more ... & { ...; }', gave the following error.
    Argument of type '{ select: (data: GroupWithCodecsType | null) => GroupWithCodecsType | null; queryKey: QueryKey & { [dataTagSymbol]: Conversation<...>; [dataTagErrorSymbol]: unique symbol; }; ... 27 more ...; queryFn?: QueryFunction<...> | undefined; }' is not assignable to parameter of type 'DefinedInitialDataOptions<GroupWithCodecsType | null, Error, GroupWithCodecsType | null, QueryKey>'.
      Type '{ select: (data: GroupWithCodecsType | null) => GroupWithCodecsType | null; queryKey: QueryKey & { [dataTagSymbol]: Conversation<...>; [dataTagErrorSymbol]: unique symbol; }; ... 27 more ...; queryFn?: QueryFunction<...> | undefined; }' is not assignable to type 'UseQueryOptions<GroupWithCodecsType | null, Error, GroupWithCodecsType | null, QueryKey>'.
        Types of property 'enabled' are incompatible.
          Type 'Enabled<Conversation<SupportedCodecsType>, Error, Conversation<SupportedCodecsType>, QueryKey> | undefined' is not assignable to type 'Enabled<GroupWithCodecsType | null, Error, GroupWithCodecsType | null, QueryKey> | undefined'.
            Type '(query: Query<Conversation<SupportedCodecsType>, Error, Conversation<SupportedCodecsType>, QueryKey>) => boolean' is not assignable to type 'Enabled<GroupWithCodecsType | null, Error, GroupWithCodecsType | null, QueryKey> | undefined'.
              Type '(query: Query<Conversation<SupportedCodecsType>, Error, Conversation<SupportedCodecsType>, QueryKey>) => boolean' is not assignable to type '(query: Query<GroupWithCodecsType | null, Error, GroupWithCodecsType | null, QueryKey>) => boolean'.
                Types of parameters 'query' and 'query' are incompatible.
                  Type 'Query<GroupWithCodecsType | null, Error, GroupWithCodecsType | null, QueryKey>' is not assignable to type 'Query<Conversation<SupportedCodecsType>, Error, Conversation<SupportedCodecsType>, QueryKey>'.
                    The types of 'options.queryFn' are incompatible between these types.
                      Type 'unique symbol | QueryFunction<GroupWithCodecsType | null, QueryKey, never> | undefined' is not assignable to type 'unique symbol | QueryFunction<Conversation<SupportedCodecsType>, QueryKey, never> | undefined'.
                        Type 'QueryFunction<GroupWithCodecsType | null, QueryKey, never>' is not assignable to type 'unique symbol | QueryFunction<Conversation<SupportedCodecsType>, QueryKey, never> | undefined'.
                          Type 'QueryFunction<GroupWithCodecsType | null, QueryKey, never>' is not assignable to type 'QueryFunction<Conversation<SupportedCodecsType>, QueryKey, never>'.
                            Type 'GroupWithCodecsType | null' is not assignable to type 'Conversation<SupportedCodecsType>'.
  Overload 2 of 3, '(options: UnusedSkipTokenOptions<GroupWithCodecsType | null, Error, GroupWithCodecsType | null, QueryKey>): OmitKeyof<...> & ... 1 more ... & { ...; }', gave the following error.
    Argument of type '{ select: (data: GroupWithCodecsType | null) => GroupWithCodecsType | null; queryKey: QueryKey & { [dataTagSymbol]: Conversation<...>; [dataTagErrorSymbol]: unique symbol; }; ... 27 more ...; queryFn?: QueryFunction<...> | undefined; }' is not assignable to parameter of type 'UnusedSkipTokenOptions<GroupWithCodecsType | null, Error, GroupWithCodecsType | null, QueryKey>'.
      Type '{ select: (data: GroupWithCodecsType | null) => GroupWithCodecsType | null; queryKey: QueryKey & { [dataTagSymbol]: Conversation<...>; [dataTagErrorSymbol]: unique symbol; }; ... 27 more ...; queryFn?: QueryFunction<...> | undefined; }' is not assignable to type 'OmitKeyof<UseQueryOptions<GroupWithCodecsType | null, Error, GroupWithCodecsType | null, QueryKey>, "queryFn">'.
        Types of property 'enabled' are incompatible.
          Type 'Enabled<Conversation<SupportedCodecsType>, Error, Conversation<SupportedCodecsType>, QueryKey> | undefined' is not assignable to type 'Enabled<GroupWithCodecsType | null, Error, GroupWithCodecsType | null, QueryKey> | undefined'.
  Overload 3 of 3, '(options: UndefinedInitialDataOptions<GroupWithCodecsType | null, Error, GroupWithCodecsType | null, QueryKey>): UseQueryOptions<...> & ... 1 more ... & { ...; }', gave the following error.
    Argument of type '{ select: (data: GroupWithCodecsType | null) => GroupWithCodecsType | null; queryKey: QueryKey & { [dataTagSymbol]: Conversation<...>; [dataTagErrorSymbol]: unique symbol; }; ... 27 more ...; queryFn?: QueryFunction<...> | undefined; }' is not assignable to parameter of type 'UndefinedInitialDataOptions<GroupWithCodecsType | null, Error, GroupWithCodecsType | null, QueryKey>'.
      Type '{ select: (data: GroupWithCodecsType | null) => GroupWithCodecsType | null; queryKey: QueryKey & { [dataTagSymbol]: Conversation<...>; [dataTagErrorSymbol]: unique symbol; }; ... 27 more ...; queryFn?: QueryFunction<...> | undefined; }' is not assignable to type 'UseQueryOptions<GroupWithCodecsType | null, Error, GroupWithCodecsType | null, QueryKey>'.
        Types of property 'enabled' are incompatible.
          Type 'Enabled<Conversation<SupportedCodecsType>, Error, Conversation<SupportedCodecsType>, QueryKey> | undefined' is not assignable to type 'Enabled<GroupWithCodecsType | null, Error, GroupWithCodecsType | null, QueryKey> | undefined'.
```
How can I resolve this? If you propose a fix, please make it concise.

---

_**Assistant**_

The issue is with type compatibility between the base conversation query and group query. Here's the fix:

```typescript:queries/useGroupQuery.ts
export function getGroupQueryOptions(args: {
  account: string;
  topic: ConversationTopic;
}) {
  const { account, topic } = args;
  const baseOptions = getConversationQueryOptions({
    account,
    topic,
  });
  
  return queryOptions({
    queryKey: baseOptions.queryKey,
    queryFn: baseOptions.queryFn,
    select: (data) => {
      if (!data) return null;
      if (!isConversationGroup(data)) {
        throw new Error("Expected group conversation but received different type");
      }
      return data;
    },
  });
}
```

Instead of spreading the entire options object, we explicitly pass the required properties. This resolves the type compatibility issues while maintaining the same functionality.

---



---

