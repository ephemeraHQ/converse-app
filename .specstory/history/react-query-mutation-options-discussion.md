## SpecStory

## React Query Mutation Options Discussion (1/22/2025, 12:50:04 PM)

_**User**_

does react-query has a mutationOptions like they have a queryOptions?

---

_**Assistant**_

Yes, React Query has `mutationOptions` similar to `queryOptions`! This allows you to extract and reuse mutation options across your application. Following the code style guide and the current file structure, here's how you could refactor the `useBlockGroupMutation`:

```typescript:queries/block-group.mutation.ts
import { updateConversationInConversationsQueryData } from "@/queries/use-conversations-query";
import { captureError } from "@/utils/capture-error";
import { getV3IdFromTopic } from "@utils/groupUtils/groupId";
import logger from "@utils/logger";
import { updateConsentForGroupsForAccount } from "@/features/consent/update-consent-for-groups-for-account";
import type { ConversationTopic } from "@xmtp/react-native-sdk";
import { blockGroupMutationKey } from "./MutationKeys";
import {
  getGroupConsentQueryData,
  setGroupConsentQueryData,
} from "../features/consent/use-group-consent.query";
import { MutationOptions } from "@tanstack/react-query";

type IBlockGroupMutationArgs = {
  account: string;
  topic: ConversationTopic;
};

export function getBlockGroupMutationOptions({ 
  account, 
  topic 
}: IBlockGroupMutationArgs): MutationOptions<string | void, Error, void, { previousConsent: string | undefined }> {
  return {
    mutationKey: blockGroupMutationKey(account, topic!),
    mutationFn: async () => {
      if (!topic || !account) {
        return;
      }
      await updateConsentForGroupsForAccount({
        account,
        groupIds: [getV3IdFromTopic(topic)],
        consent: "deny",
      });
      return "denied";
    },
    onMutate: async () => {
      const previousConsent = getGroupConsentQueryData(account, topic!);
      setGroupConsentQueryData(account, topic!, "denied");
      updateConversationInConversationsQueryData({
        account,
        topic: topic!,
        conversationUpdate: {
          state: "denied",
        },
      });
      return { previousConsent };
    },
    onError: (error, _variables, context) => {
      captureError(error);

      if (!context) {
        return;
      }

      setGroupConsentQueryData(
        account,
        topic!,
        context.previousConsent || "unknown"
      );
      updateConversationInConversationsQueryData({
        account,
        topic: topic!,
        conversationUpdate: {
          state: context.previousConsent,
        },
      });
    },
    onSuccess: () => {
      logger.debug("onSuccess useBlockGroupMutation");
    },
  };
}

export function useBlockGroupMutation({ account, topic }: IBlockGroupMutationArgs) {
  return useMutation(getBlockGroupMutationOptions({ account, topic }));
}
```

Key changes made:
1. Created a separate `getBlockGroupMutationOptions` function that returns the mutation options
2. Used object parameters following the style guide
3. Added proper TypeScript types for the mutation options
4. Simplified the hook to use the options function
5. Renamed the file to use kebab-case as per style guide

This pattern makes the mutation options reusable and testable independently of the hook, while maintaining all the existing functionality.

---



---

