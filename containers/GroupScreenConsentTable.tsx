import { useGroupConsent } from "@hooks/useGroupConsent";
import { translate } from "@i18n/translate";
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
        id: "allow_group",
        title: translate("allow_group"),
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
        id: "block_group",
        title: translate("block_group"),
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
      title={translate("consent_title")}
    />
  );
};
