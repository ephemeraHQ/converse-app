import { showActionSheetWithOptions } from "@components/StateHandlers/ActionSheetStateHandler";
import { TableViewPicto } from "@components/TableView/TableViewImage";
import { useCurrentAccount } from "@data/store/accountsStore";
import { useGroupPendingRequests } from "@hooks/useGroupPendingRequests";
import { usePreferredNames } from "@hooks/usePreferredNames";
import { translate } from "@i18n";
import { useAddToGroupMutation } from "@queries/useAddToGroupMutation";
import { invalidatePendingJoinRequestsQuery } from "@queries/usePendingRequestsQuery";
import { actionSheetColors, textSecondaryColor } from "@styles/colors";
import { updateGroupJoinRequestStatus } from "@utils/api";
import { FC, useMemo } from "react";
import { StyleSheet, Text, useColorScheme, View } from "react-native";

import TableView, {
  TableViewItemType,
} from "../components/TableView/TableView";
import type { ConversationTopic } from "@xmtp/react-native-sdk";

type GroupPendingRequestsTableProps = {
  topic: ConversationTopic;
};

export const GroupPendingRequestsTable: FC<GroupPendingRequestsTableProps> = ({
  topic,
}) => {
  const colorScheme = useColorScheme();
  const currentAccount = useCurrentAccount() as string;
  const styles = useStyles();
  const requests = useGroupPendingRequests(topic);

  const addresses = useMemo(() => requests.map((a) => a[0]), [requests]);
  const preferredNames = usePreferredNames(addresses);
  const { mutateAsync: addToGroup } = useAddToGroupMutation(
    currentAccount,
    topic
  );

  const tableViewItems = useMemo(() => {
    const items: TableViewItemType[] = [];
    requests.forEach((a, id) => {
      const address = a[0];
      const request = a[1];
      const preferredName = preferredNames[id];
      items.push({
        id: address,
        title: preferredName,
        action: () => {
          const options = [
            translate("approve"),
            translate("deny"),
            translate("cancel"),
          ];
          const title = translate("approve_member_to_this_group", {
            name: preferredName,
          });
          showActionSheetWithOptions(
            {
              ...actionSheetColors(colorScheme),
              options,
              destructiveButtonIndex: 1,
              cancelButtonIndex: 2,
              title,
            },
            async (selectedIndex?: number) => {
              switch (selectedIndex) {
                case 0:
                  // approve
                  await addToGroup([address]);
                  await updateGroupJoinRequestStatus(
                    currentAccount,
                    request.id,
                    "ACCEPTED"
                  );
                  invalidatePendingJoinRequestsQuery(currentAccount);
                  break;
                case 1:
                  // deny
                  await updateGroupJoinRequestStatus(
                    currentAccount,
                    request.id,
                    "REJECTED"
                  );
                  break;
                default:
              }
            }
          );
        },
        rightView: (
          <View style={styles.tableViewRight}>
            <Text style={styles.adminText}>{translate("pending")}</Text>
            <TableViewPicto
              symbol="chevron.right"
              color={textSecondaryColor(colorScheme)}
            />
          </View>
        ),
      });
    });
    return items;
  }, [
    addToGroup,
    colorScheme,
    currentAccount,
    preferredNames,
    requests,
    styles.adminText,
    styles.tableViewRight,
  ]);

  if (requests.length === 0) {
    return null;
  }

  return (
    <TableView
      items={tableViewItems}
      title={translate("membership_requests_title")}
    />
  );
};

const useStyles = () => {
  const colorScheme = useColorScheme();

  return StyleSheet.create({
    tableViewRight: {
      flexDirection: "row",
      alignItems: "center",
    },
    adminText: {
      fontSize: 17,
      color: textSecondaryColor(colorScheme),
    },
  });
};
