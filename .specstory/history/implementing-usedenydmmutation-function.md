## SpecStory

## Implementing useDenyDmMutation Function (1/22/2025, 2:48:47 PM)

_**User**_

implment useDenyDmMutation from taking a look at @use-dm-consent-for-current-account.mutation.tsx 

---

_**Assistant**_

I'll help you implement `useDenyDmMutation` based on the `useDmConsentForCurrentAccount` mutation. This will be a specialized version that only handles the "deny" consent case.

```typescript:features/consent/use-deny-dm.mutation.ts
import {
  getCurrentAccount,
  useCurrentAccount,
} from "@/data/store/accountsStore";
import { getConversationQueryData } from "@/queries/useConversationQuery";
import { updateConversationInUnknownConsentConversationsQueryData } from "@/queries/unknown-consent-conversations-query";
import { updateConversationInConversationsQueryData } from "@/queries/use-conversations-query";
import { getDmQueryData, setDmQueryData } from "@/queries/useDmQuery";
import { updateObjectAndMethods } from "@/utils/update-object-and-methods";
import { DmWithCodecsType } from "@/utils/xmtpRN/client.types";
import { useMutation } from "@tanstack/react-query";
import {
  ConversationId,
  ConversationTopic,
  InboxId,
} from "@xmtp/react-native-sdk";
import { updateConsentForGroupsForAccount } from "./update-consent-for-groups-for-account";
import { updateInboxIdsConsentForAccount } from "./update-inbox-ids-consent-for-account";

export function useDenyDmMutation() {
  const currentAccount = useCurrentAccount()!;

  return useMutation({
    mutationFn: async (args: {
      peerInboxId: InboxId;
      conversationId: ConversationId;
      topic: ConversationTopic;
    }) => {
      const { peerInboxId, conversationId } = args;
      if (!peerInboxId) {
        throw new Error("Peer inbox id not found");
      }
      const currentAccount = getCurrentAccount()!;
      await Promise.all([
        updateConsentForGroupsForAccount({
          account: currentAccount,
          groupIds: [conversationId],
          consent: "deny",
        }),
        updateInboxIdsConsentForAccount({
          account: currentAccount,
          inboxIds: [peerInboxId],
          consent: "deny",
        }),
      ]);
    },
    onMutate: ({ topic }) => {
      const conversation = getConversationQueryData({
        account: currentAccount,
        topic,
      });
      if (conversation) {
        const updatedDm = updateObjectAndMethods(conversation, {
          state: "denied",
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
            state: "denied",
          },
        });

        updateConversationInUnknownConsentConversationsQueryData({
          account: currentAccount,
          topic,
          conversationUpdate: {
            state: "denied",
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

        updateConversationInUnknownConsentConversationsQueryData({
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

This implementation is similar to `useDmConsentForCurrentAccount` but with these key differences:

1. The function is renamed to `useDenyDmMutation`
2. Removed the `consent` parameter from the mutation args since this mutation specifically handles the "deny" case
3. Hardcoded the consent value to "deny" in the `mutationFn`
4. Simplified the state updates in `onMutate` to always use "denied" instead of checking the consent value
5. The error handling remains the same to properly restore the previous state if something goes wrong

The mutation can be used with just the required parameters for denying a DM:
- `peerInboxId`
- `conversationId`
- `topic`

---

_**User**_

now do useAllowDmMutation

---

_**Assistant**_

I'll create `useAllowDmMutation` following the same pattern but specifically for the "allow" consent case.

```typescript:features/consent/use-allow-dm.mutation.ts
import {
  getCurrentAccount,
  useCurrentAccount,
} from "@/data/store/accountsStore";
import { getConversationQueryData } from "@/queries/useConversationQuery";
import { updateConversationInUnknownConsentConversationsQueryData } from "@/queries/unknown-consent-conversations-query";
import { updateConversationInConversationsQueryData } from "@/queries/use-conversations-query";
import { getDmQueryData, setDmQueryData } from "@/queries/useDmQuery";
import { updateObjectAndMethods } from "@/utils/update-object-and-methods";
import { DmWithCodecsType } from "@/utils/xmtpRN/client.types";
import { useMutation } from "@tanstack/react-query";
import {
  ConversationId,
  ConversationTopic,
  InboxId,
} from "@xmtp/react-native-sdk";
import { updateConsentForGroupsForAccount } from "./update-consent-for-groups-for-account";
import { updateInboxIdsConsentForAccount } from "./update-inbox-ids-consent-for-account";

export function useAllowDmMutation() {
  const currentAccount = useCurrentAccount()!;

  return useMutation({
    mutationFn: async (args: {
      peerInboxId: InboxId;
      conversationId: ConversationId;
      topic: ConversationTopic;
    }) => {
      const { peerInboxId, conversationId } = args;
      if (!peerInboxId) {
        throw new Error("Peer inbox id not found");
      }
      const currentAccount = getCurrentAccount()!;
      await Promise.all([
        updateConsentForGroupsForAccount({
          account: currentAccount,
          groupIds: [conversationId],
          consent: "allow",
        }),
        updateInboxIdsConsentForAccount({
          account: currentAccount,
          inboxIds: [peerInboxId],
          consent: "allow",
        }),
      ]);
    },
    onMutate: ({ topic }) => {
      const conversation = getConversationQueryData({
        account: currentAccount,
        topic,
      });
      if (conversation) {
        const updatedDm = updateObjectAndMethods(conversation, {
          state: "allowed",
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
            state: "allowed",
          },
        });

        updateConversationInUnknownConsentConversationsQueryData({
          account: currentAccount,
          topic,
          conversationUpdate: {
            state: "allowed",
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

        updateConversationInUnknownConsentConversationsQueryData({
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

This implementation is identical to `useDenyDmMutation` but with these differences:
1. The function is renamed to `useAllowDmMutation`
2. Hardcoded the consent value to "allow" in the `mutationFn`
3. Changed the state updates in `onMutate` to use "allowed" instead of "denied"

The mutation can be used with the same required parameters:
- `peerInboxId`
- `conversationId`
- `topic`

---



---

