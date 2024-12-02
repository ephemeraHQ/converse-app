import { showActionSheetWithOptions } from "@/components/StateHandlers/ActionSheetStateHandler";
import { useChatStore, useCurrentAccount } from "@/data/store/accountsStore";
import { useSelect } from "@/data/store/storeHelpers";
import { translate } from "@/i18n";
import { actionSheetColors } from "@/styles/colors";
import { useAppTheme } from "@/theme/useAppTheme";
import { saveTopicsData } from "@/utils/api";
import { DmWithCodecsType } from "@/utils/xmtpRN/client";
import { consentToInboxIdsOnProtocolByAccount } from "@/utils/xmtpRN/contacts";
import { useCallback } from "react";

type UseHandleDeleteDmProps = {
  topic: string;
  preferredName: string;
  conversation: DmWithCodecsType;
};

export const useHandleDeleteDm = ({
  topic,
  preferredName,
  conversation,
}: UseHandleDeleteDmProps) => {
  const currentAccount = useCurrentAccount()!;
  const { theme } = useAppTheme();
  const colorScheme = theme.isDark ? "dark" : "light";
  const { setTopicsData } = useChatStore(useSelect(["setTopicsData"]));
  return useCallback(() => {
    const options = [
      translate("delete"),
      translate("delete_and_block"),
      translate("cancel"),
    ];
    const title = `${translate("delete_chat_with")} ${preferredName}?`;
    const actions = [
      () => {
        saveTopicsData(currentAccount, {
          [topic]: {
            status: "deleted",
            timestamp: new Date().getTime(),
          },
        }),
          setTopicsData({
            [topic]: {
              status: "deleted",
              timestamp: new Date().getTime(),
            },
          });
      },
      async () => {
        saveTopicsData(currentAccount, {
          [topic]: { status: "deleted" },
        });
        setTopicsData({
          [topic]: {
            status: "deleted",
            timestamp: new Date().getTime(),
          },
        });
        await conversation.updateConsent("denied");
        const peerInboxId = await conversation.peerInboxId();
        await consentToInboxIdsOnProtocolByAccount({
          account: currentAccount,
          inboxIds: [peerInboxId],
          consent: "deny",
        });
      },
    ];

    showActionSheetWithOptions(
      {
        options,
        cancelButtonIndex: options.length - 1,
        destructiveButtonIndex: [0, 1],
        title,
        ...actionSheetColors(colorScheme),
      },
      async (selectedIndex?: number) => {
        if (selectedIndex !== undefined && selectedIndex < actions.length) {
          actions[selectedIndex]();
        }
      }
    );
  }, [
    colorScheme,
    conversation,
    currentAccount,
    preferredName,
    setTopicsData,
    topic,
  ]);
};
