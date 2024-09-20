import { useGroupConsent } from "@hooks/useGroupConsent";
import { translate } from "@i18n";
import { dangerColor, primaryColor } from "@styles/colors";
import { groupRemoveRestoreHandler } from "@utils/groupUtils/groupActionHandlers";
import { FC, useMemo } from "react";
import { useColorScheme } from "react-native";

import TableView, {
  TableViewItemType,
} from "../components/TableView/TableView";

interface GroupScreenConsentTableProps {
  topic: string;
  groupName?: string;
}

export const GroupScreenConsentTable: FC<GroupScreenConsentTableProps> = ({
  topic,
  groupName,
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
        action: () => {
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
        action: () => {
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
  }, [consent, allowGroup, blockGroup, colorScheme, groupName]);

  return (
    <TableView
      items={consentTableViewItems}
      title={translate("actions_title")}
    />
  );
};
