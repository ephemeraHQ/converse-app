import { Platform } from "react-native";

import Accounts from "../Accounts/Accounts";
import AccountsAndroid from "../Accounts/AccountsAndroid";
import { NativeStack } from "./Navigation";

export default function AccountsNav() {
  return (
    <NativeStack.Screen
      name="Accounts"
      component={Platform.OS === "web" ? AccountsAndroid : Accounts}
      options={{
        headerTitle: "Accounts",
        headerLargeTitle: true,
        headerShadowVisible: false,
      }}
    />
  );
}
