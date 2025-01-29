import { SafeAreaView, Text, View } from "react-native";
import { usePrivy } from "@privy-io/expo";
import { getConfig } from "@/config";
import { UserScreen } from "./UserScreen";
import { LoginScreen } from "./LoginScreen";

export function Index() {
  const { user, isReady } = usePrivy();
  // console.log({
  //   isReady,
  //   privyUserId: user?.id,
  //   linkedAccounts: user?.linked_accounts,
  //   // privy user id: did:privy:cm6gxcd7e00gj12og1dli30yy
  //   // passkey credential id: yIB9obMD0tmREIXceJt9k3owMO4
  //   // address: 0x6169558FcbcD862D629A49444f3A3E8Ab50E5aFb
  //   linkedeAccounts: JSON.stringify(user?.linked_accounts, null, 2),
  // });
  if (getConfig().privy.appId.length !== 25) {
    return (
      <SafeAreaView>
        <View
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text>You have not set a valid `privyAppId` in app.json</Text>
        </View>
      </SafeAreaView>
    );
  }
  if (!getConfig().privy.clientId.startsWith("client-")) {
    return (
      <SafeAreaView>
        <View
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text>You have not set a valid `privyClientId` in app.json</Text>
        </View>
      </SafeAreaView>
    );
  }
  return !user ? <LoginScreen /> : <UserScreen />;
}
