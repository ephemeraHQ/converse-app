import React, { useCallback, useRef } from "react";
import { Platform, useColorScheme } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import AndroidBackAction from "../../components/AndroidBackAction";
import Button from "../../components/Button/Button";
import ConversationFlashList from "../../components/ConversationFlashList";
import { showActionSheetWithOptions } from "../../components/StateHandlers/ActionSheetStateHandler";
import {
  useChatStore,
  useCurrentAccount,
} from "../../data/store/accountsStore";
import { actionSheetColors } from "../../utils/colors";
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
  const clearAllSpam = useCallback(() => {
    const methods = {
      "Clear all": async () => {
        const peers = Array.from(
          new Set(
            sortedConversationsWithPreview.conversationsRequests.map(
              (c) => c.peerAddress
            )
          )
        );
        await consentToPeersOnProtocol(account, peers, "deny");
        await updateConsentStatus(account);
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
        headerTitle: "Spam",
        headerLeft:
          Platform.OS === "ios"
            ? undefined
            : () => <AndroidBackAction navigation={navigation} />,
        headerRight: () => (
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
