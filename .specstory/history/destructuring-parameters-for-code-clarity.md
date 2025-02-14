## SpecStory

## Destructuring Parameters for Code Clarity (1/21/2025, 4:50:35 PM)

_**User**_

extract all from args and then use the variables

---

_**Assistant**_

I'll help you destructure the args parameter at the top level of each function according to the style guide. Here's the modified code:

```typescript:features/consent/use-dm-consent-for-current-account.tsx
// ... existing code ...

export function useDmConsentForCurrentAccount() {
  const currentAccount = useCurrentAccount()!;

  return useMutation({
    mutationFn: async ({
      consent,
      peerInboxId,
      conversationId,
      topic,
    }: {
      consent: "allow" | "deny";
      peerInboxId: InboxId;
      conversationId: ConversationId;
      topic: ConversationTopic;
    }) => {
      if (!peerInboxId) {
        throw new Error("Peer inbox id not found");
      }
      const currentAccount = getCurrentAccount()!;
      await Promise.all([
        updateConsentForGroupsForAccount({
          account: currentAccount,
          groupIds: [conversationId],
          consent,
        }),
        updateInboxIdsConsentForAccount({
          account: currentAccount,
          inboxIds: [peerInboxId],
          consent,
        }),
      ]);
    },
    onMutate: ({ consent, topic }: {
      consent: "allow" | "deny";
      topic: ConversationTopic;
    }) => {
      const conversation = getConversationQueryData({
        account: currentAccount,
        topic,
      });
      if (conversation) {
        const updatedDm = updateObjectAndMethods(conversation, {
          state: consent === "allow" ? "allowed" : "denied",
        });

        setDmQueryData({
          account: currentAccount,
          peer: topic,
          dm: updatedDm as DmWithCodecsType,
        });

        updateConversationInConversationsQueryData({
          account: currentAccount,
          topic,
          conversationUpdate: {
            state: consent === "allow" ? "allowed" : "denied",
          },
        });
        return { previousDmConsent: conversation.state };
      }
    },
    onError: (error, { topic }, context) => {
      const { previousDmConsent } = context || {};
      if (previousDmConsent) {
        const dm = getDmQueryData({
          account: currentAccount,
          peer: topic,
        });
        if (!dm) {
          return;
        }
        const updatedDm = updateObjectAndMethods(dm, {
          state: previousDmConsent,
        });
        setDmQueryData({
          account: currentAccount,
          peer: topic,
          dm: updatedDm,
        });
        updateConversationInConversationsQueryData({
          account: currentAccount,
          topic,
          conversationUpdate: {
            state: previousDmConsent,
          },
        });
      }
    },
  });
}
```

The changes include:
1. Destructured the args parameter in `mutationFn` to directly access `consent`, `peerInboxId`, `conversationId`, and `topic`
2. Destructured the args parameter in `onMutate` to directly access `consent` and `topic`
3. Destructured the variables parameter in `onError` to directly access `topic`

These changes follow the style guide's recommendation for top-level destructuring, making it clearer which properties are being used and improving code readability.

---



---

