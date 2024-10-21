import AccountsAndroid from "@features/accounts/components/AccountsAndroid";
import AccountsScreen from "@features/accounts/screens/Accounts.screen";
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
          return <AccountsScreen navigation={navigation} route={route} />;
        }
      }}
    </NativeStack.Screen>
  );
}
