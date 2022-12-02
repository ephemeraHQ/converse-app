import React from "react";
import * as SplashScreen from "expo-splash-screen";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { ActionSheetProvider } from "@expo/react-native-action-sheet";
import { useContext, useEffect } from "react";
import { AppContext } from "../store/context";
import Conversation from "./Conversation";
import ConversationList from "./ConversationList";
import { shortAddress } from "../utils/str";

export type NavigationParamList = {
  Messages: undefined;
  Conversation: {
    peerAddress: string;
  };
};

const Stack = createNativeStackNavigator<NavigationParamList>();

export default function Navigation() {
  const { state } = useContext(AppContext);
  useEffect(() => {
    if (state.xmtp.webviewLoaded) {
      SplashScreen.hideAsync();
    }
  }, [state.xmtp.webviewLoaded]);

  if (!state.xmtp.connected) return null;

  return (
    <ActionSheetProvider>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Messages">
          <Stack.Screen
            name="Messages"
            component={ConversationList}
            options={{
              headerTitle: "Messages",
              headerLargeTitle: true,
            }}
          />
          <Stack.Screen
            name="Conversation"
            component={Conversation}
            options={({ route }) => ({
              title: shortAddress(route.params.peerAddress),
            })}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </ActionSheetProvider>
  );
}
