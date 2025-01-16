import { showActionSheetWithOptions } from "@/components/StateHandlers/ActionSheetStateHandler";
import { useCurrentAccount } from "@/data/store/accountsStore";
import { useDmConsent } from "@/features/consent/use-dm-consent";
import { usePreferredInboxName } from "@/hooks/usePreferredInboxName";
import { translate } from "@/i18n";
import {
  getConversationMetadataQueryData,
  updateConversationMetadataQueryData,
} from "@/queries/conversation-metadata-query";
import { useDmPeerInboxId } from "@/queries/useDmPeerInbox";
import { actionSheetColors } from "@/styles/colors";
import { useAppTheme } from "@/theme/useAppTheme";
import { deleteTopic } from "@/utils/api/topics";
import { captureErrorWithToast } from "@/utils/capture-error";
import { DmWithCodecsType } from "@/utils/xmtpRN/client.types";
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

  const { mutateAsync: updateDmConsentAsync } = useDmConsent({
    peerInboxId: peerInboxId!,
    conversationId: dm.id,
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
      const previousIsDeleted = getConversationMetadataQueryData({
        account: currentAccount,
        topic: dm.topic,
        context: "useDeleteDm",
      })?.isDeleted;

      updateConversationMetadataQueryData({
        account: currentAccount,
        topic: dm.topic,
        context: "useDeleteDm",
        updateData: { isDeleted: true },
      });

      return { previousIsDeleted };
    },
    onError: (error, _, context) => {
      updateConversationMetadataQueryData({
        account: currentAccount,
        topic: dm.topic,
        context: "useDeleteDm",
        updateData: { isDeleted: context?.previousIsDeleted },
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
            await updateDmConsentAsync({
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
  }, [colorScheme, preferredName, deleteDmAsync, updateDmConsentAsync]);
};
