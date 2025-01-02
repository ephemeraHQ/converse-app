import { useGroupConsent } from "@hooks/useGroupConsent";
import { translate } from "@i18n";
import { dangerColor, primaryColor } from "@styles/colors";
import { groupRemoveRestoreHandler } from "@utils/groupUtils/groupActionHandlers";
import { FC, useMemo } from "react";
import { useColorScheme } from "react-native";

import TableView, {
  TableViewItemType,
} from "../components/TableView/TableView";
import type { ConversationTopic } from "@xmtp/react-native-sdk";
import { GroupWithCodecsType } from "@/utils/xmtpRN/client.types";

type GroupScreenConsentTableProps = {
  topic: ConversationTopic;
  group: GroupWithCodecsType | null | undefined;
};

export const GroupScreenConsentTable: FC<GroupScreenConsentTableProps> = ({
  topic,
  group,
}) => {
  const colorScheme = useColorScheme();
  const { consent, allowGroup, blockGroup } = useGroupConsent(topic);

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
            blockGroup
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
            blockGroup
          )((success: boolean) => {
            // If not successful, do nothing (user canceled)
          });
        },
      });
    }

    return items;
  }, [consent, allowGroup, blockGroup, colorScheme, group]);

  return (
    <TableView
      items={consentTableViewItems}
      title={translate("actions_title")}
    />
  );
};
