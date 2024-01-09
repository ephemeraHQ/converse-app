import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ScrollView, StyleSheet, View, useColorScheme } from "react-native";

import AccountSettingsButton from "../../components/AccountSettingsButton";
import TableView from "../../components/TableView/TableView";
import { TableViewPicto } from "../../components/TableView/TableViewImage";
import {
  useAccountsList,
  useAccountsStore,
} from "../../data/store/accountsStore";
import { useOnboardingStore } from "../../data/store/onboardingStore";
import {
  backgroundColor,
  primaryColor,
  textSecondaryColor,
} from "../../utils/colors";
import useDisconnect from "../../utils/onboarding/disconnect";
import { shortAddress, useAccountsProfiles } from "../../utils/str";
import { NavigationParamList } from "../Navigation/Navigation";

export default function Accounts({
  navigation,
  route,
}: NativeStackScreenProps<NavigationParamList, "Accounts">) {
  const styles = useStyles();
  const accounts = useAccountsList();
  const accountsProfiles = useAccountsProfiles();
  const setCurrentAccount = useAccountsStore((s) => s.setCurrentAccount);
  const setAddingNewAccount = useOnboardingStore((s) => s.setAddingNewAccount);
  const colorScheme = useColorScheme();
  const disconnectWallet = useDisconnect();
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
              <AccountSettingsButton navigation={navigation} account={a} />
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
            action: async () => {
              try {
                await disconnectWallet();
              } catch (e) {
                console.error(e);
              }
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
