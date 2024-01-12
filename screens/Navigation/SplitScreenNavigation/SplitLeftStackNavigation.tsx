import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Platform, useColorScheme } from "react-native";

import { isDesktop } from "../../../utils/device";
import { converseNavigations } from "../../../utils/navigation";
import AccountsNav from "../AccountsNav";
import ConversationListNav from "../ConversationListNav";
import ConversationRequestsListNav from "../ConversationRequestsListNav";
import ConverseMatchMakerNav from "../ConverseMatchMakerNav";
import { stackGroupScreenOptions } from "../navHelpers";

export type NavigationParamList = {
  Accounts: undefined;
  Chats: undefined;
  ChatsRequests: undefined;
  ConverseMatchMaker: undefined;
};

export const NativeStack = createNativeStackNavigator<NavigationParamList>();

export const navigationAnimation = Platform.OS === "ios" ? "default" : "none";

export default function SplitLeftStackNavigation() {
  const colorScheme = useColorScheme();
  return (
    <NavigationContainer
      independent
      initialState={
        Platform.OS === "ios" || Platform.OS === "web"
          ? {
              // On iOS, the Accounts switcher is available through a back button
              index: 1,
              routes: [
                {
                  name: "Accounts",
                },
                {
                  name: "Chats",
                },
              ],
              type: "stack",
            }
          : {
              // On Android, the Accounts switcher is available through the drawer
              index: 0,
              routes: [
                {
                  name: "Chats",
                },
              ],
              type: "stack",
            }
      }
      ref={(r) => {
        converseNavigations["splitLeftStack"] = r;
      }}
      onUnhandledAction={() => {
        // Since we're handling multiple navigators,
        // let's silence errors when the action
        // is not meant for this one
      }}
    >
      <NativeStack.Navigator screenOptions={{ gestureEnabled: !isDesktop }}>
        <NativeStack.Group screenOptions={stackGroupScreenOptions(colorScheme)}>
          {AccountsNav()}
          {ConversationListNav()}
          {ConversationRequestsListNav()}
          {ConverseMatchMakerNav()}
        </NativeStack.Group>
      </NativeStack.Navigator>
    </NavigationContainer>
  );
}
