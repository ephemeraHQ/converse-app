import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Platform, useColorScheme } from "react-native";

import { backgroundColor, headerTitleStyle } from "../../../utils/colors";
import { isDesktop } from "../../../utils/device";
import AccountsNav from "../AccountsNav";
import ConversationListNav from "../ConversationListNav";
import ConversationRequestsListNav from "../ConversationRequestsListNav";

export type NavigationParamList = {
  Accounts: undefined;
  Chats: undefined;
  ChatsRequests: undefined;
};

export const NativeStack = createNativeStackNavigator<NavigationParamList>();

export const navigationAnimation = Platform.OS === "ios" ? "default" : "none";

export default function DrawerLeftStackNavigation() {
  const colorScheme = useColorScheme();
  return (
    <NavigationContainer
      independent
      initialState={
        Platform.OS === "ios"
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
    >
      <NativeStack.Navigator screenOptions={{ gestureEnabled: !isDesktop }}>
        <NativeStack.Group
          screenOptions={{
            headerStyle: {
              backgroundColor: backgroundColor(colorScheme),
            },
            headerTitleStyle: headerTitleStyle(colorScheme),
            headerShadowVisible: Platform.OS !== "android",
          }}
        >
          {AccountsNav()}
          {ConversationListNav()}
          {ConversationRequestsListNav()}
        </NativeStack.Group>
      </NativeStack.Navigator>
    </NavigationContainer>
  );
}
