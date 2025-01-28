import { useGroupConsentForCurrentAccount } from "@/features/consent/use-group-consent-for-current-account";
import { GroupWithCodecsType } from "@/utils/xmtpRN/xmtp-client/xmtp-client.types";
import { translate } from "@i18n";
import { dangerColor, primaryColor } from "@styles/colors";
import { groupRemoveRestoreHandler } from "@utils/groupUtils/groupActionHandlers";
import type { ConversationTopic } from "@xmtp/react-native-sdk";
import { FC, useMemo } from "react";
import { useColorScheme } from "react-native";
import TableView, {
  TableViewItemType,
} from "../components/TableView/TableView";

type GroupScreenConsentTableProps = {
  topic: ConversationTopic;
  group: GroupWithCodecsType | null | undefined;
};

export const GroupScreenConsentTable: FC<GroupScreenConsentTableProps> = ({
  topic,
  group,
}) => {
  const colorScheme = useColorScheme();
  const { consent, allowGroup, denyGroup } =
    useGroupConsentForCurrentAccount(topic);

  const consentTableViewItems = useMemo(() => {
    const items: TableViewItemType[] = [];

    if (consent === "denied") {
      items.push({
        id: "restore_group",
        title: translate("restore_group"),
        titleColor: primaryColor(colorScheme),
        action: async () => {
          const groupName = await group?.groupName();
          groupRemoveRestoreHandler(
            consent,
            colorScheme,
            groupName,
            allowGroup,
            denyGroup
          )((success: boolean) => {
            // If not successful, do nothing (user canceled)
          });
        },
      });
    } else {
      // consent is "allowed", "unknown" or undefined
      items.push({
        id: "remove_group",
        title: translate("remove_group"),
        titleColor: dangerColor(colorScheme),
        action: async () => {
          const groupName = await group?.groupName();
          groupRemoveRestoreHandler(
            consent,
            colorScheme,
            groupName,
            allowGroup,
            denyGroup
          )((success: boolean) => {
            // If not successful, do nothing (user canceled)
          });
        },
      });
    }

    return items;
  }, [consent, allowGroup, denyGroup, colorScheme, group]);

  return (
    <TableView
      items={consentTableViewItems}
      title={translate("actions_title")}
    />
  );
};
