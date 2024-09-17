import { useGroupConsent } from "@hooks/useGroupConsent";
import { translate } from "@i18n";
import { dangerColor, primaryColor } from "@styles/colors";
import { FC, useMemo } from "react";
import { useColorScheme } from "react-native";

import TableView, {
  TableViewItemType,
} from "../components/TableView/TableView";

interface GroupScreenConsentTableProps {
  topic: string;
}

export const GroupScreenConsentTable: FC<GroupScreenConsentTableProps> = ({
  topic,
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
          allowGroup({
            includeAddedBy: false,
            includeCreator: false,
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
          blockGroup({
            includeAddedBy: false,
            includeCreator: false,
          });
        },
      });
    }

    return items;
  }, [consent, allowGroup, blockGroup, colorScheme]);

  return (
    <TableView
      items={consentTableViewItems}
      title={translate("actions_title")}
    />
  );
};
