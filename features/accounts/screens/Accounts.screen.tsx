import TableView from "@components/TableView/TableView";
import { TableViewPicto } from "@components/TableView/TableViewImage";
import { useOnboardingStore } from "@data/store/onboardingStore";
import {
  useAccountsList,
  useAccountsStore,
  useErroredAccountsMap,
} from "@features/accounts/accounts.store";
import AccountSettingsButton from "@features/accounts/components/AccountSettingsButton";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { NavigationParamList } from "@screens/Navigation/Navigation";
import {
  backgroundColor,
  dangerColor,
  primaryColor,
  textSecondaryColor,
} from "@styles/colors";
import { shortAddress, useAccountsProfiles } from "@utils/str";
import { ScrollView, StyleSheet, View, useColorScheme } from "react-native";

export default function AccountsScreen({
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
