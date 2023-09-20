import Accounts from "../Accounts";
import { NativeStack } from "./Navigation";

export default function AccountsNav() {
  return (
    <NativeStack.Screen
      name="Accounts"
      component={Accounts}
      options={{
        headerTitle: "Accounts",
        headerLargeTitle: true,
        headerShadowVisible: false,
      }}
    />
  );
}
