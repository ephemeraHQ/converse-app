import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { memo } from "react";
import { Platform, useColorScheme } from "react-native";

import { ScreenHeaderModalCloseButton } from "../../../components/Screen/ScreenHeaderModalCloseButton";
import { useRouter } from "../../../navigation/useNavigation";
import { isDesktop } from "../../../utils/device";
import { converseNavigations } from "../../../utils/navigation";
import Accounts from "../../Accounts/Accounts";
import ConversationBlockedListNav from "../ConversationBlockedListNav";
import ConversationListNav from "../ConversationListNav";
import ConversationRequestsListNav from "../ConversationRequestsListNav";
import ConverseMatchMakerNav from "../ConverseMatchMakerNav";
import { stackGroupScreenOptions } from "../navHelpers";

export type NavigationParamList = {
  Accounts: undefined;
  Chats: undefined;
  ChatsRequests: undefined;
  ConverseMatchMaker: undefined;
  Blocked: undefined;
};

export const NativeStack = createNativeStackNavigator<NavigationParamList>();

export const navigationAnimation = Platform.OS === "ios" ? "default" : "none";

const SplitLeftStackNavigation = memo(function SplitLeftStackNavigation() {
  const colorScheme = useColorScheme();
  const router = useRouter();

  return (
    <NavigationContainer
      independent
      initialState={{
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
      }}
      ref={(r) => {
        if (r) {
          converseNavigations["splitLeftStack"] = r;
        }
      }}
      onUnhandledAction={() => {
        // Since we're handling multiple navigators,
        // let's silence errors when the action
        // is not meant for this one
      }}
    >
      <NativeStack.Navigator screenOptions={{ gestureEnabled: !isDesktop }}>
        <NativeStack.Group screenOptions={stackGroupScreenOptions(colorScheme)}>
          <NativeStack.Screen
            name="Accounts"
            component={Accounts}
            options={{
              headerLargeTitle: true,
              headerShadowVisible: false,
              headerLeft: () => (
                <ScreenHeaderModalCloseButton onPress={router.goBack} />
              ),
            }}
          />
          {ConversationListNav()}
          {ConversationRequestsListNav()}
          {ConverseMatchMakerNav()}
          {ConversationBlockedListNav()}
        </NativeStack.Group>
      </NativeStack.Navigator>
    </NavigationContainer>
  );
});

export default SplitLeftStackNavigation;
