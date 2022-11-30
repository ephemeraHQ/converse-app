import React from "react";
import * as SplashScreen from "expo-splash-screen";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useContext, useEffect } from "react";
import { AppContext } from "../store/context";
import Conversation from "./Conversation";
import ConversationList from "./ConversationList";
import { Button } from "react-native";
import { sendMessageToWebview } from "../components/XmtpWebview";

export type NavigationParamList = {
  ConversationList: undefined;
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
    <NavigationContainer>
      <Stack.Navigator initialRouteName="ConversationList">
        <Stack.Screen
          name="ConversationList"
          component={ConversationList}
          options={{
            headerTitle: "XMTP",
            headerRight: () =>
              state.xmtp.connected ? (
                <Button
                  onPress={() => {
                    sendMessageToWebview("DISCONNECT");
                  }}
                  title="Disconnect"
                />
              ) : null,
          }}
        />
        <Stack.Screen name="Conversation" component={Conversation} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
