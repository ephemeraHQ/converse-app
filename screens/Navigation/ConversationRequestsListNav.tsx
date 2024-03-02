import React, { useCallback, useRef, useState } from "react";
import { Platform, View, useColorScheme, Text } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import ActivityIndicator from "../../components/ActivityIndicator/ActivityIndicator";
import AndroidBackAction from "../../components/AndroidBackAction";
import Button from "../../components/Button/Button";
import ConversationFlashList from "../../components/ConversationFlashList";
import { showActionSheetWithOptions } from "../../components/StateHandlers/ActionSheetStateHandler";
import {
  useChatStore,
  useCurrentAccount,
} from "../../data/store/accountsStore";
import { actionSheetColors, textPrimaryColor } from "../../utils/colors";
import {
  consentToPeersOnProtocol,
  updateConsentStatus,
} from "../../utils/xmtpRN/conversations";
import { NativeStack, navigationAnimation } from "./Navigation";

export default function ConversationRequestsListNav() {
  const sortedConversationsWithPreview = useChatStore(
    (s) => s.sortedConversationsWithPreview
  );
  const colorScheme = useColorScheme();
  const account = useCurrentAccount() as string;
  const navRef = useRef<any>();
  const [clearingAll, setClearingAll] = useState(false);
  const clearAllSpam = useCallback(() => {
    const methods = {
      "Clear all": async () => {
        setClearingAll(true);
        const peers = Array.from(
          new Set(
            sortedConversationsWithPreview.conversationsRequests.map(
              (c) => c.peerAddress
            )
          )
        );
        await consentToPeersOnProtocol(account, peers, "deny");
        await updateConsentStatus(account);
        setClearingAll(false);
        navRef.current?.goBack();
      },
      Cancel: () => {},
    };

    const options = Object.keys(methods);

    showActionSheetWithOptions(
      {
        options,
        destructiveButtonIndex: options.indexOf("Clear all"),
        cancelButtonIndex: options.indexOf("Cancel"),
        title:
          "Do you confirm? This will block all accounts that are currently tagged as spam.",
        ...actionSheetColors(colorScheme),
      },
      (selectedIndex?: number) => {
        if (selectedIndex === undefined) return;
        const method = (methods as any)[options[selectedIndex]];
        if (method) {
          method();
        }
      }
    );
  }, [
    account,
    colorScheme,
    sortedConversationsWithPreview.conversationsRequests,
  ]);
  return (
    <NativeStack.Screen
      name="ChatsRequests"
      options={({ navigation }) => ({
        animation: navigationAnimation,
        headerTitle: clearingAll
          ? Platform.OS === "ios"
            ? () => (
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    width: Platform.OS === "ios" ? 110 : 130,
                  }}
                >
                  <ActivityIndicator />
                  <Text
                    style={{
                      marginLeft: 10,
                      color: textPrimaryColor(colorScheme),
                      ...Platform.select({
                        android: { fontSize: 22, fontFamily: "Roboto" },
                      }),
                    }}
                  >
                    Clearing
                  </Text>
                </View>
              )
            : "Clearing..."
          : "Spam",
        headerLeft:
          Platform.OS === "ios"
            ? undefined
            : () => <AndroidBackAction navigation={navigation} />,
        headerRight: () =>
          clearingAll ? undefined : (
            <Button variant="text" title="Clear all" onPress={clearAllSpam} />
          ),
      })}
    >
      {(navigationProps) => {
        navRef.current = navigationProps.navigation;
        return (
          <GestureHandlerRootView style={{ flex: 1 }}>
            <ConversationFlashList
              {...navigationProps}
              items={sortedConversationsWithPreview.conversationsRequests}
            />
          </GestureHandlerRootView>
        );
      }}
    </NativeStack.Screen>
  );
}
