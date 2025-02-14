## SpecStory

## Refactoring Group Deletion Hook (1/13/2025, 3:27:20 PM)

_**User**_

refactor like we did for @use-delete-dm.ts 

---

_**Assistant**_

I'll help refactor the `useHandleDeleteGroup` hook to follow a similar pattern as `useDeleteDm`. The main changes will be:
1. Adding a mutation for the delete action
2. Structuring the actions in a more organized way
3. Adding error handling with `captureErrorWithToast`

Here's the refactored code:

```typescript:features/conversation-list/hooks/useHandleDeleteGroup.ts
import { showActionSheetWithOptions } from "@/components/StateHandlers/ActionSheetStateHandler";
import { useCurrentAccount } from "@/data/store/accountsStore";
import { translate } from "@/i18n";
import { getGroupQueryData } from "@/queries/useGroupQuery";
import { actionSheetColors } from "@/styles/colors";
import { useAppTheme } from "@/theme/useAppTheme";
import { consentToInboxIdsOnProtocolByAccount } from "@/utils/xmtpRN/contacts";
import { captureErrorWithToast } from "@/utils/capture-error";
import { ConversationTopic } from "@xmtp/react-native-sdk";
import { useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import { setConversationDataQueryData } from "@/queries/use-conversation-data-query";

export const useHandleDeleteGroup = (args: {
  groupTopic: ConversationTopic;
}) => {
  const { groupTopic } = args;
  const currentAccount = useCurrentAccount()!;
  const { theme } = useAppTheme();
  const colorScheme = theme.isDark ? "dark" : "light";

  const { mutateAsync: deleteGroupAsync } = useMutation({
    mutationFn: () => {
      setConversationDataQueryData({
        account: currentAccount,
        topic: groupTopic,
        data: { status: "deleted" },
      });
      return Promise.resolve();
    },
    onError: (error) => {
      captureErrorWithToast(error);
      setConversationDataQueryData({
        account: currentAccount,
        topic: groupTopic,
        data: { status: "active" },
      });
    },
  });

  return useCallback(() => {
    const group = getGroupQueryData({
      account: currentAccount,
      topic: groupTopic,
    });

    if (!group) {
      throw new Error("Group not found");
    }

    const title = `${translate("delete_chat_with")} ${group.name}?`;

    const actions = [
      {
        label: translate("delete"),
        action: async () => {
          try {
            await deleteGroupAsync();
          } catch (error) {
            captureErrorWithToast(error);
          }
        },
      },
      {
        label: translate("delete_and_block"),
        action: async () => {
          try {
            await deleteGroupAsync();
            await group.updateConsent("denied");
            await consentToInboxIdsOnProtocolByAccount({
              account: currentAccount,
              inboxIds: [group.addedByInboxId],
              consent: "deny",
            });
          } catch (error) {
            captureErrorWithToast(error);
          }
        },
      },
      {
        label: translate("cancel"),
        action: () => {},
      },
    ];

    showActionSheetWithOptions(
      {
        options: actions.map((a) => a.label),
        cancelButtonIndex: actions.length - 1,
        destructiveButtonIndex: [0, 1],
        title,
        ...actionSheetColors(colorScheme),
      },
      async (selectedIndex?: number) => {
        if (selectedIndex !== undefined) {
          await actions[selectedIndex].action();
        }
      }
    );
  }, [colorScheme, currentAccount, groupTopic, deleteGroupAsync]);
};
```

Key changes made:
1. Removed direct dependency on `useChatStore` and replaced it with `setConversationDataQueryData`
2. Added a mutation for handling the delete action with proper error handling
3. Restructured the actions array to match the pattern used in `useDeleteDm`
4. Added try/catch blocks with `captureErrorWithToast` for error handling
5. Simplified the dependencies array in `useCallback`

The functionality remains the same, but the code is now more consistent with the project's patterns and has better error handling.

---



---

