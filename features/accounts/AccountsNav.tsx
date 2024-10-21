import Accounts from "@features/accounts/Accounts";
import AccountsAndroid from "@features/accounts/AccountsAndroid";
import { NativeStack } from "@screens/Navigation/Navigation";
import { Platform } from "react-native";

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
