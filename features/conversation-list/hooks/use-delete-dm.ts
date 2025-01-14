import { showActionSheetWithOptions } from "@/components/StateHandlers/ActionSheetStateHandler";
import { useCurrentAccount } from "@/data/store/accountsStore";
import { usePreferredInboxName } from "@/hooks/usePreferredInboxName";
import { translate } from "@/i18n";
import {
  getConversationDataQueryData,
  setConversationDataQueryData,
} from "@/queries/use-conversation-data-query";
import { useDmPeerInboxId } from "@/queries/useDmPeerInbox";
import { actionSheetColors } from "@/styles/colors";
import { useAppTheme } from "@/theme/useAppTheme";
import { deleteTopic } from "@/utils/api/topics";
import { captureErrorWithToast } from "@/utils/capture-error";
import { DmWithCodecsType } from "@/utils/xmtpRN/client.types";
import { consentToInboxIdsOnProtocolByAccount } from "@/utils/xmtpRN/contacts";
import { useMutation } from "@tanstack/react-query";
import { useCallback } from "react";

export const useDeleteDm = (dm: DmWithCodecsType) => {
  const { theme } = useAppTheme();
  const colorScheme = theme.isDark ? "dark" : "light";

  const currentAccount = useCurrentAccount()!;

  const { data: peerInboxId } = useDmPeerInboxId({
    account: currentAccount,
    topic: dm.topic,
  });

  const preferredName = usePreferredInboxName(peerInboxId);

  const { mutateAsync: deleteDmAsync } = useMutation({
    mutationFn: () =>
      deleteTopic({
        account: currentAccount,
        topic: dm.topic,
      }),
    onMutate: () => {
      const previousIsDeleted = getConversationDataQueryData({
        account: currentAccount,
        topic: dm.topic,
        context: "useDeleteDm",
      })?.isDeleted;

      setConversationDataQueryData({
        account: currentAccount,
        topic: dm.topic,
        context: "useDeleteDm",
        data: { isDeleted: true },
      });

      return { previousIsDeleted };
    },
    onError: (error, _, context) => {
      setConversationDataQueryData({
        account: currentAccount,
        topic: dm.topic,
        context: "useDeleteDm",
        data: { isDeleted: context?.previousIsDeleted },
      });
    },
  });

  return useCallback(() => {
    const title = `${translate("delete_chat_with")} ${preferredName}?`;

    const actions = [
      {
        label: translate("delete"),
        action: async () => {
          try {
            await deleteDmAsync();
          } catch (error) {
            captureErrorWithToast(error);
          }
        },
      },
      {
        label: translate("delete_and_block"),
        action: async () => {
          try {
            await deleteDmAsync();
            await dm.updateConsent("denied");
            const peerInboxId = await dm.peerInboxId();
            await consentToInboxIdsOnProtocolByAccount({
              account: currentAccount,
              inboxIds: [peerInboxId],
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
  }, [colorScheme, dm, currentAccount, preferredName, deleteDmAsync]);
};
