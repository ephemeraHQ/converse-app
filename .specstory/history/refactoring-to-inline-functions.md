## SpecStory

## Refactoring to Inline Functions (12/18/2024, 10:56:20 AM)

_**User**_

put all the functions inline like the onMutate, etc... 

---

_**Assistant**_

I'll help you refactor the code to have inline functions within the `getAllowGroupMutationOptions`. Here's the modified version:

```typescript:queries/useAllowGroupMutation.ts
// ... existing imports ...

export const getAllowGroupMutationOptions = (
  account: string,
  topic: ConversationTopic
): IUseAllowGroupMutationOptions => {
  return {
    mutationKey: [MutationKeys.ALLOW_GROUP, account, topic],
    mutationFn: async (args: AllowGroupMutationVariables) => {
      const { includeAddedBy, includeCreator, group, account } = args;

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
        consentToGroupsOnProtocolByAccount({
          account,
          groupIds: [getV3IdFromTopic(groupTopic)],
          consent: "allow",
        }),
        ...(inboxIdsToAllow.length > 0
          ? [
              consentToInboxIdsOnProtocolByAccount({
                account,
                inboxIds: inboxIdsToAllow,
                consent: "allow",
              }),
            ]
          : []),
      ]);

      return "allowed";
    },
    onMutate: (args: AllowGroupMutationVariables) => {
      const { account, group } = args;
      const topic = group.topic;

      const previousConsent = getGroupConsentQueryData(account, topic);

      updateConversationInConversationListQuery({
        account,
        topic,
        conversationUpdate: {
          state: "allowed",
        },
      });

      return {
        previousConsent: previousConsent ?? undefined,
      };
    },
    onError: (
      error: unknown,
      variables: AllowGroupMutationVariables,
      context?: {
        previousConsent: ConsentState | undefined;
      }
    ) => {
      const { account, group } = variables;
      const topic = group.topic;
      
      captureError(error);
      if (!context) {
        return;
      }

      if (context.previousConsent) {
        setGroupConsentQueryData(account, topic, context.previousConsent);
      }
    },
  };
};

// ... rest of the file remains the same ...
```

The changes made:
1. Removed the standalone functions `allowGroupMutationFn`, `onMutateAllowGroupMutation`, and `onErrorAllowGroupMutation`
2. Moved their implementations directly into the `getAllowGroupMutationOptions` object as inline functions
3. The functionality remains exactly the same, but the code is now more consolidated within the options object

The types and other exports remain unchanged since they're still needed for the rest of the functionality.

---



---

