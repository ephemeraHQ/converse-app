import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ScrollView, StyleSheet, useColorScheme } from "react-native";

import TableView from "../components/TableView/TableView";
import { useAccountsList } from "../data/store/accountsStore";
import { backgroundColor, primaryColor } from "../utils/colors";
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
        }))}
      />
      <TableView
        items={[
          {
            id: "add",
            title: "Add an account",
            titleColor: primaryColor(colorScheme),
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
