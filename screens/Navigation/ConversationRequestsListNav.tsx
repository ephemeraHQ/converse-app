import { RouteProp } from "@react-navigation/native";
import {
  actionSheetColors,
  backgroundColor,
  textPrimaryColor,
} from "@styles/colors";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Platform, StyleSheet, Text, useColorScheme, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StackAnimationTypes } from "react-native-screens";

import {
  NativeStack,
  navigationAnimation,
  NavigationParamList,
} from "./Navigation";
import ActivityIndicator from "../../components/ActivityIndicator/ActivityIndicator";
import AndroidBackAction from "../../components/AndroidBackAction";
import Button from "../../components/Button/Button";
import ConversationFlashList from "../../components/ConversationFlashList";
import SuspectedSpamButton from "../../components/ConversationList/SuspectedSpamButton";
import { showActionSheetWithOptions } from "../../components/StateHandlers/ActionSheetStateHandler";
import {
  useChatStore,
  useCurrentAccount,
} from "../../data/store/accountsStore";
import {
  consentToPeersOnProtocol,
  sortRequestsBySpamScore,
  updateConsentStatus,
} from "../../utils/xmtpRN/conversations";

export default function ConversationRequestsListNav() {
  const sortedConversationsWithPreview = useChatStore(
    (s) => s.sortedConversationsWithPreview
  );
  const colorScheme = useColorScheme();
  const account = useCurrentAccount() as string;
  const navRef = useRef<any>();
  const [clearingAll, setClearingAll] = useState(false);

  const [isSpamToggleEnabled, setIsSpamToggleEnabled] = useState(false);
  const allRequests = sortedConversationsWithPreview.conversationsRequests;
  const { likelySpam, likelyNotSpam } = sortRequestsBySpamScore(allRequests);
  const styles = useStyles();

  const clearAllSpam = useCallback(() => {
    const methods = {
      "Clear all": async () => {
        setClearingAll(true);
        // @todo => handle groups here
        const peers = Array.from(
          new Set(allRequests.map((c) => c.peerAddress))
        ).filter((peer) => !!peer) as string[];
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
          "Do you confirm? This will block all accounts that are currently tagged as requests.",
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
  }, [account, colorScheme, allRequests]);

  const navigationOptions = useCallback(
    ({
      navigation,
    }: {
      route: RouteProp<NavigationParamList, "ChatsRequests">;
      navigation: any;
    }) => ({
      animation: navigationAnimation as StackAnimationTypes,
      headerTitle: clearingAll
        ? Platform.OS === "ios"
          ? () => (
              <View style={styles.headerContainer}>
                <ActivityIndicator />
                <Text style={styles.headerText}>Clearing</Text>
              </View>
            )
          : "Clearing..."
        : "Requests",
      headerLeft:
        Platform.OS === "ios"
          ? undefined
          : () => <AndroidBackAction navigation={navigation} />,
      headerRight: () =>
        clearingAll ? undefined : (
          <Button variant="text" title="Clear all" onPress={clearAllSpam} />
        ),
    }),
    [clearAllSpam, clearingAll, styles.headerContainer, styles.headerText]
  );

  const handleSpamToggle = useCallback(() => {
    setIsSpamToggleEnabled((prev) => !prev);
  }, []);

  // Navigate back to the main screen when no request to display
  useEffect(() => {
    const unsubscribe = navRef.current?.addListener("focus", () => {
      if (allRequests.length === 0) {
        navRef.current?.goBack();
      }
    });
    return unsubscribe;
  }, [allRequests]);

  return (
    <NativeStack.Screen name="ChatsRequests" options={navigationOptions}>
      {(navigationProps) => {
        navRef.current = navigationProps.navigation;
        return (
          <>
            <GestureHandlerRootView style={styles.root}>
              <View style={styles.container}>
                <ConversationFlashList
                  {...navigationProps}
                  items={likelyNotSpam}
                  ListFooterComponent={
                    <View>
                      {likelySpam.length ? (
                        <SuspectedSpamButton
                          spamCount={likelySpam.length}
                          handlePress={handleSpamToggle}
                          toggleActivated={isSpamToggleEnabled}
                        />
                      ) : (
                        <></>
                      )}
                      {isSpamToggleEnabled ? (
                        <ConversationFlashList
                          {...navigationProps}
                          items={likelySpam}
                        />
                      ) : (
                        <></>
                      )}
                    </View>
                  }
                />
              </View>
            </GestureHandlerRootView>
          </>
        );
      }}
    </NativeStack.Screen>
  );
}

const useStyles = () => {
  const colorScheme = useColorScheme();
  return StyleSheet.create({
    container: {
      flex: 1,
    },
    root: {
      flex: 1,
      backgroundColor: backgroundColor(colorScheme),
    },

    headerContainer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      width: Platform.OS === "ios" ? 110 : 130,
    },
    headerText: {
      marginLeft: 10,
      color: textPrimaryColor(colorScheme),
      ...Platform.select({
        android: { fontSize: 22, fontFamily: "Roboto" },
      }),
    },
  });
};
