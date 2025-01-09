import { showActionSheetWithOptions } from "@/components/StateHandlers/ActionSheetStateHandler";
import { useChatStore, useCurrentAccount } from "@/data/store/accountsStore";
import { useSelect } from "@/data/store/storeHelpers";
import { translate } from "@/i18n";
import { getGroupQueryData } from "@/queries/useGroupQuery";
import { actionSheetColors } from "@/styles/colors";
import { useAppTheme } from "@/theme/useAppTheme";
import { saveTopicsData } from "@/utils/api";
import { consentToInboxIdsOnProtocolByAccount } from "@/utils/xmtpRN/contacts";
import { ConversationTopic } from "@xmtp/react-native-sdk";
import { useCallback } from "react";

export const useHandleDeleteGroup = (args: {
  groupTopic: ConversationTopic;
}) => {
  const { groupTopic } = args;
  const currentAccount = useCurrentAccount()!;
  const { theme } = useAppTheme();
  const colorScheme = theme.isDark ? "dark" : "light";
  const { setTopicsData } = useChatStore(useSelect(["setTopicsData"]));

  return useCallback(() => {
    const group = getGroupQueryData({
      account: currentAccount,
      topic: groupTopic,
    });

    if (!group) {
      throw new Error("Group not found");
    }

    const options = [
      translate("delete"),
      translate("delete_and_block"),
      translate("cancel"),
    ];

    const title = `${translate("delete_chat_with")} ${group.name}?`;

    const actions = [
      () => {
        saveTopicsData(currentAccount, {
          [groupTopic]: {
            status: "deleted",
            timestamp: new Date().getTime(),
          },
        });
      },
      async () => {
        saveTopicsData(currentAccount, {
          [groupTopic]: { status: "deleted" },
        });
        setTopicsData({
          [groupTopic]: {
            status: "deleted",
            timestamp: new Date().getTime(),
          },
        });
        await group.updateConsent("denied");
        await consentToInboxIdsOnProtocolByAccount({
          account: currentAccount,
          inboxIds: [group.addedByInboxId],
          consent: "deny",
        });
      },
    ];
    // TODO: Implement
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
  }, [colorScheme, currentAccount, setTopicsData, groupTopic]);
};
