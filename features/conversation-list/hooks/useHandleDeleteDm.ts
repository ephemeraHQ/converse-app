import { showActionSheetWithOptions } from "@/components/StateHandlers/ActionSheetStateHandler";
import { useChatStore, useCurrentAccount } from "@/data/store/accountsStore";
import { useSelect } from "@/data/store/storeHelpers";
import { usePreferredInboxName } from "@/hooks/usePreferredInboxName";
import { translate } from "@/i18n";
import { useDmPeerInboxId } from "@/queries/useDmPeerInbox";
import { actionSheetColors } from "@/styles/colors";
import { useAppTheme } from "@/theme/useAppTheme";
import { saveTopicsData } from "@/utils/api";
import { DmWithCodecsType } from "@/utils/xmtpRN/client.types";
import { consentToInboxIdsOnProtocolByAccount } from "@/utils/xmtpRN/contacts";
import { useCallback } from "react";

// TODO: Refactor to only pass topic or peerInboxId when we finish account refactor
export const useHandleDeleteDm = (dm: DmWithCodecsType) => {
  const { theme } = useAppTheme();
  const colorScheme = theme.isDark ? "dark" : "light";

  const { setTopicsData } = useChatStore(useSelect(["setTopicsData"]));

  const currentAccount = useCurrentAccount()!;

  const { data: peerInboxId } = useDmPeerInboxId({
    account: currentAccount,
    topic: dm.topic,
  });

  const preferredName = usePreferredInboxName(peerInboxId);

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
          [dm.topic]: {
            status: "deleted",
            timestamp: new Date().getTime(),
          },
        }),
          setTopicsData({
            [dm.topic]: {
              status: "deleted",
              timestamp: new Date().getTime(),
            },
          });
      },
      async () => {
        saveTopicsData(currentAccount, {
          [dm.topic]: { status: "deleted" },
        });
        setTopicsData({
          [dm.topic]: {
            status: "deleted",
            timestamp: new Date().getTime(),
          },
        });
        await dm.updateConsent("denied");
        const peerInboxId = await dm.peerInboxId();
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
  }, [colorScheme, dm, currentAccount, preferredName, setTopicsData]);
};
