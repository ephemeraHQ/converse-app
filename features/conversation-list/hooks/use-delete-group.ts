import { showActionSheetWithOptions } from "@/components/StateHandlers/ActionSheetStateHandler";
import { useCurrentAccount } from "@/data/store/accountsStore";
import { updateInboxIdsConsentForAccount } from "@/utils/xmtpRN/xmtp-consent/update-inbox-ids-consent-for-account";
import { translate } from "@/i18n";
import {
  getConversationMetadataQueryData,
  updateConversationMetadataQueryData,
} from "@/queries/conversation-metadata-query";
import { getGroupQueryData } from "@/queries/useGroupQuery";
import { actionSheetColors } from "@/styles/colors";
import { useAppTheme } from "@/theme/useAppTheme";
import { deleteTopic } from "@/utils/api/topics";
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
      deleteTopic({
        account: currentAccount,
        topic: groupTopic,
      }),
    onMutate: () => {
      const previousIsDeleted = getConversationMetadataQueryData({
        account: currentAccount,
        topic: groupTopic,
      })?.isDeleted;

      updateConversationMetadataQueryData({
        account: currentAccount,
        topic: groupTopic,
        updateData: { isDeleted: true },
      });

      return { previousIsDeleted };
    },
    onError: (error, _, context) => {
      updateConversationMetadataQueryData({
        account: currentAccount,
        topic: groupTopic,
        updateData: { isDeleted: context?.previousIsDeleted },
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
