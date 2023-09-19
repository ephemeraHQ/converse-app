import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ScrollView, StyleSheet, View, useColorScheme } from "react-native";

import TableView from "../components/TableView/TableView";
import { TableViewPicto } from "../components/TableView/TableViewImage";
import { useAccountsList, useAccountsStore } from "../data/store/accountsStore";
import { useOnboardingStore } from "../data/store/onboardingStore";
import {
  backgroundColor,
  primaryColor,
  textSecondaryColor,
} from "../utils/colors";
import { getReadableProfile } from "../utils/str";
import { NavigationParamList } from "./Main";

// initialState={{
//   index: 1,
//   routes: [
//     {
//       name: "Accounts",
//     },
//     {
//       name: "Messages",
//     },
//   ],
//   type: "stack",
// }}

export default function Accounts({
  navigation,
  route,
}: NativeStackScreenProps<NavigationParamList, "Accounts">) {
  const styles = useStyles();
  const accounts = useAccountsList();
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
          title: getReadableProfile(a, a),
          action: () => {
            setCurrentAccount(a);
            navigation.push("Chats");
          },
          rightView: (
            <View style={{ flexDirection: "row" }}>
              <TableViewPicto
                symbol="info.circle"
                color={primaryColor(colorScheme)}
                onPress={() => {
                  console.log("pressed");
                }}
              />
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
