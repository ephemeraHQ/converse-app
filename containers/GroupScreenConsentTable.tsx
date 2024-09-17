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
  groupName: string;
}

export const GroupScreenConsentTable: FC<GroupScreenConsentTableProps> = ({
  topic,
  groupName,
}) => {
  const colorScheme = useColorScheme();
  const { consent, allowGroup, blockGroup } = useGroupConsent(topic);

  const consentTableViewItems = useMemo(() => {
    const items: TableViewItemType[] = [];
    if (consent !== "allowed") {
      items.push({
        id: "restore_group",
        title: translate("restore_group"),
        titleColor: primaryColor(colorScheme),
        action: () => {
          const handleAction = groupRemoveRestoreHandler(
            "denied",
            colorScheme,
            groupName,
            allowGroup,
            blockGroup
          );
          handleAction(() => {
            // User canceled, no op
          });
        },
      });
    }
    if (consent !== "denied") {
      items.push({
        id: "remove_group",
        title: translate("remove_group"),
        titleColor: dangerColor(colorScheme),
        action: () => {
          const handleAction = groupRemoveRestoreHandler(
            "allowed",
            colorScheme,
            groupName,
            allowGroup,
            blockGroup
          );
          handleAction(() => {
            // User canceled, no op
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
