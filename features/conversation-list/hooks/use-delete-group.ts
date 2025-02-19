import { showActionSheetWithOptions } from "@/components/StateHandlers/ActionSheetStateHandler";
import { updateInboxIdsConsentForAccount } from "@/features/consent/update-inbox-ids-consent-for-account";
import { deleteConversation } from "@/features/conversation/conversation-metadata/conversation-metadata.api";
import {
  getConversationMetadataQueryData,
  updateConversationMetadataQueryData,
} from "@/features/conversation/conversation-metadata/conversation-metadata.query";
import { useCurrentAccount } from "@/features/multi-inbox/multi-inbox.store";
import { translate } from "@/i18n";
import { getGroupQueryData } from "@/queries/useGroupQuery";
import { actionSheetColors } from "@/styles/colors";
import { useAppTheme } from "@/theme/useAppTheme";
import { captureErrorWithToast } from "@/utils/capture-error";
import { useMutation } from "@tanstack/react-query";
import { ConversationTopic } from "@xmtp/react-native-sdk";
import { useCallback } from "react";

export const useDeleteGroup = (args: { groupTopic: ConversationTopic }) => {
  const { groupTopic } = args;
  const currentAccount = useCurrentAccount()!;
  const { theme } = useAppTheme();
  const colorScheme = theme.isDark ? "dark" : "light";

  const { mutateAsync: deleteGroupAsync } = useMutation({
    mutationFn: () =>
      deleteConversation({
        account: currentAccount,
        topic: groupTopic,
      }),
    onMutate: () => {
      const previousDeleted = getConversationMetadataQueryData({
        account: currentAccount,
        topic: groupTopic,
      })?.deleted;

      updateConversationMetadataQueryData({
        account: currentAccount,
        topic: groupTopic,
        updateData: { deleted: true },
      });

      return { previousDeleted };
    },
    onError: (error, _, context) => {
      updateConversationMetadataQueryData({
        account: currentAccount,
        topic: groupTopic,
        updateData: { deleted: context?.previousDeleted },
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
            await updateInboxIdsConsentForAccount({
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
        label: translate("Cancel"),
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
