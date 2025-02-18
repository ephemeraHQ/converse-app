import { showActionSheetWithOptions } from "@/components/StateHandlers/ActionSheetStateHandler";
import { useCurrentAccount } from "@/features/multi-inbox/multi-inbox.store";
import { useDenyDmMutation } from "@/features/consent/use-deny-dm.mutation";

import { translate } from "@/i18n";
import {
  getConversationMetadataQueryData,
  updateConversationMetadataQueryData,
} from "@/queries/conversation-metadata-query";
import { getConversationQueryOptions } from "@/queries/conversation-query";
import { useDmPeerInboxIdQuery } from "@/queries/use-dm-peer-inbox-id-query";
import { actionSheetColors } from "@/styles/colors";
import { useAppTheme } from "@/theme/useAppTheme";
import { deleteTopic } from "@/utils/api/topics";
import { captureErrorWithToast } from "@/utils/capture-error";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ConversationTopic } from "@xmtp/react-native-sdk";
import { useCallback } from "react";

export const useDeleteDm = ({ topic }: { topic: ConversationTopic }) => {
  const { theme } = useAppTheme();
  const colorScheme = theme.isDark ? "dark" : "light";

  const currentAccount = useCurrentAccount()!;

  const { data: conversationId } = useQuery({
    ...getConversationQueryOptions({
      account: currentAccount,
      topic,
    }),
    select: (conversation) => conversation?.id,
  });

  const { data: peerInboxId } = useDmPeerInboxIdQuery({
    account: currentAccount,
    topic,
    caller: "useDeleteDm",
  });

  const { mutateAsync: denyDmConsentAsync } = useDenyDmMutation();

  const { data: preferredName } = useInboxName({
    inboxId: peerInboxId!,
  });

  const { mutateAsync: deleteDmAsync } = useMutation({
    mutationFn: () =>
      deleteTopic({
        topic,
      }),
    onMutate: () => {
      const previousIsDeleted = getConversationMetadataQueryData({
        account: currentAccount,
        topic,
      })?.isDeleted;

      updateConversationMetadataQueryData({
        account: currentAccount,
        topic,
        updateData: { isDeleted: true },
      });

      return { previousIsDeleted };
    },
    onError: (error, _, context) => {
      updateConversationMetadataQueryData({
        account: currentAccount,
        topic,
        updateData: { isDeleted: context?.previousIsDeleted },
      });
    },
  });

  return useCallback(() => {
    const title = `${translate("delete_chat_with")} ${preferredName}?`;

    if (!conversationId) {
      throw new Error("Conversation not found in useDeleteDm");
    }

    if (!peerInboxId) {
      throw new Error("Peer inbox id not found in useDeleteDm");
    }

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
            await denyDmConsentAsync({
              peerInboxId: peerInboxId,
              conversationId,
              topic,
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
  }, [
    colorScheme,
    preferredName,
    deleteDmAsync,
    denyDmConsentAsync,
    peerInboxId,
    conversationId,
    topic,
  ]);
};
