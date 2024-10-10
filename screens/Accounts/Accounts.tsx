import { NativeStackScreenProps } from "@react-navigation/native-stack";
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
  useAccountsList,
  useAccountsStore,
  useErroredAccountsMap,
} from "../../data/store/accountsStore";
import { useOnboardingStore } from "../../data/store/onboardingStore";
import { shortAddress, useAccountsProfiles } from "../../utils/str";
import { NavigationParamList } from "../Navigation/Navigation";

export default function Accounts({
  navigation,
  route,
}: NativeStackScreenProps<NavigationParamList, "Accounts">) {
  const styles = useStyles();
  const accounts = useAccountsList();
  const erroredAccounts = useErroredAccountsMap();
  const accountsProfiles = useAccountsProfiles();
  const setCurrentAccount = useAccountsStore((s) => s.setCurrentAccount);
  const setAddingNewAccount = useOnboardingStore((s) => s.setAddingNewAccount);
  const colorScheme = useColorScheme();
  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      alwaysBounceVertical={false}
      style={styles.accounts}
    >
      <TableView
        items={accounts.map((a) => ({
          id: a,
          title: accountsProfiles[a] || shortAddress(a),
          action: () => {
            setCurrentAccount(a, false);
            navigation.push("Chats");
          },
          rightView: (
            <View style={{ flexDirection: "row" }}>
              {erroredAccounts[a] && (
                <TableViewPicto
                  symbol="exclamationmark.triangle"
                  color={dangerColor(colorScheme)}
                />
              )}
              <AccountSettingsButton account={a} navigation={navigation} />
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
            title: "Add an account",
            titleColor: primaryColor(colorScheme),
            action: () => {
              setAddingNewAccount(true);
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
