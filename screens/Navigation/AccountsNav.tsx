import { Platform } from "react-native";

import { NativeStack } from "./Navigation";
import Accounts from "../Accounts/Accounts";
import AccountsAndroid from "../Accounts/AccountsAndroid";

export default function AccountsNav() {
  return (
    <NativeStack.Screen
      name="Accounts"
      options={{
        headerTitle: "Accounts",
        headerLargeTitle: true,
        headerShadowVisible: false,
      }}
    >
      {({ route, navigation }) => {
        if (Platform.OS === "web") {
          return <AccountsAndroid navigation={navigation} />;
        } else {
          return <Accounts navigation={navigation} route={route} />;
        }
      }}
    </NativeStack.Screen>
  );
}
