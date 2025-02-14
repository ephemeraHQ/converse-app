## SpecStory

## Extracting Mutation Function for Code Clarity (1/22/2025, 1:01:30 PM)

_**User**_

extract the mutationFn

---

_**Assistant**_

I'll help you extract the mutationFn into a separate function. Here's how we can modify the code:

```typescript:features/consent/use-allow-group.mutation.ts
// ... existing code ...

async function allowGroup({
  includeAddedBy,
  includeCreator,
  group,
  account,
}: AllowGroupMutationVariables): Promise<"allowed"> {
  const groupTopic = group.topic;
  const groupCreator = await group.creatorInboxId();

  const inboxIdsToAllow: InboxId[] = [];
  if (includeAddedBy && group?.addedByInboxId) {
    inboxIdsToAllow.push(group.addedByInboxId);
  }

  if (includeCreator && groupCreator) {
    inboxIdsToAllow.push(groupCreator);
  }

  await Promise.all([
    updateConsentForGroupsForAccount({
      account,
      groupIds: [getV3IdFromTopic(groupTopic)],
      consent: "allow",
    }),
    ...(inboxIdsToAllow.length > 0
      ? [
          updateInboxIdsConsentForAccount({
            account,
            inboxIds: inboxIdsToAllow,
            consent: "allow",
          }),
        ]
      : []),
  ]);

  return "allowed";
}

export const getAllowGroupMutationOptions = (
  account: string,
  topic: ConversationTopic
): MutationOptions => {
  return {
    mutationKey: [MutationKeys.ALLOW_GROUP, account, topic],
    mutationFn: allowGroup,
    // ... existing code ...
  };
};

// ... existing code ...
```

I've extracted the mutationFn into a separate function called `allowGroup` that takes the same parameters and returns the same type. The function is placed before `getAllowGroupMutationOptions` and the `mutationFn` property now simply references this function. This improves code organization and makes the logic more reusable if needed.

---



---

