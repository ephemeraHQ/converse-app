import {
  backgroundColor,
  dangerColor,
  primaryColor,
  textSecondaryColor,
} from "@styles/colors";
import { ScrollView, StyleSheet, View, useColorScheme } from "react-native";

import AccountSettingsButton from "../../components/AccountSettingsButton";
import TableView from "../../components/TableView/TableView";
import { TableViewPicto } from "../../components/TableView/TableViewImage";
import {
  useInboxIdsList,
  useAccountsStore,
  useErroredAccountsMap,
} from "../../data/store/accountsStore";
import { useRouter } from "../../navigation/useNavigation";
import { useAccountsProfiles } from "@utils/useAccountsProfiles";
import { translate } from "@/i18n";

export default function Accounts() {
  const styles = useStyles();
  const erroredAccounts = useErroredAccountsMap();
  const inboxIds = useInboxIdsList();
  const accountsProfiles = useAccountsProfiles();
  const setCurrentInboxId = useAccountsStore((s) => s.setCurrentInboxId);
  const colorScheme = useColorScheme();

  const router = useRouter();

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      alwaysBounceVertical={false}
      style={styles.accounts}
    >
      <TableView
        items={inboxIds.map((inboxId, index) => ({
          id: inboxId,
          title: accountsProfiles[index],
          action: () => {
            setCurrentInboxId({ inboxId, createIfNew: false });
            router.navigate("Chats");
          },
          rightView: (
            <View style={{ flexDirection: "row" }}>
              {erroredAccounts[inboxId] && (
                <TableViewPicto
                  symbol="exclamationmark.triangle"
                  color={dangerColor(colorScheme)}
                />
              )}
              <AccountSettingsButton inboxId={inboxId} />
              <TableViewPicto
                symbol="chevron.right"
                color={textSecondaryColor(colorScheme)}
              />
            </View>
          ),
        }))}
      />
      <TableView
        items={[
          {
            id: "add",
            title: translate("add_an_account"),
            titleColor: primaryColor(colorScheme),
            action: () => {
              router.navigate("NewAccountNavigator");
            },
          },
        ]}
        style={{ margin: 0 }}
      />
    </ScrollView>
  );
}

const useStyles = () => {
  const colorScheme = useColorScheme();
  return StyleSheet.create({
    accounts: {
      backgroundColor: backgroundColor(colorScheme),
      paddingHorizontal: 16,
    },
  });
};
