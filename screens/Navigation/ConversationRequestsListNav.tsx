import {
  useChatStore,
  useCurrentAccount,
} from "@features/accounts/accounts.store";
import { translate } from "@i18n";
import { RouteProp } from "@react-navigation/native";
import {
  actionSheetColors,
  backgroundColor,
  textPrimaryColor,
} from "@styles/colors";
import { ConversationFlatListItem } from "@utils/conversation";
import { converseEventEmitter } from "@utils/events";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Platform, StyleSheet, useColorScheme, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StackAnimationTypes } from "react-native-screens";

import {
  NativeStack,
  navigationAnimation,
  NavigationParamList,
} from "./Navigation";
import AndroidBackAction from "../../components/AndroidBackAction";
import Button from "../../components/Button/Button";
import ConversationFlashList from "../../components/ConversationFlashList";
import { showActionSheetWithOptions } from "../../components/StateHandlers/ActionSheetStateHandler";
import {
  consentToPeersOnProtocol,
  sortRequestsBySpamScore,
  updateConsentStatus,
} from "../../utils/xmtpRN/conversations";

// TODO: Remove iOS-specific code due to the existence of a .ios file
// TODO: Alternatively, implement an Android equivalent for the segmented controller
// See issue: https://github.com/ephemeraHQ/converse-app/issues/659

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
  const { likelySpam, likelyNotSpam } = useMemo(
    () => sortRequestsBySpamScore(allRequests),
    [allRequests]
  );
  const styles = useStyles();

  const clearAllSpam = useCallback(() => {
    const options = {
      clearAll: translate("clear_all"),
      cancel: translate("cancel"),
    };

    const methods = {
      [options.clearAll]: async () => {
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
      [options.cancel]: () => {},
    };

    const optionKeys = [options.clearAll, options.cancel];

    showActionSheetWithOptions(
      {
        options: optionKeys,
        destructiveButtonIndex: optionKeys.indexOf(options.clearAll),
        cancelButtonIndex: optionKeys.indexOf(options.cancel),
        title: translate("clear_confirm"),
        ...actionSheetColors(colorScheme),
      },
      (selectedIndex?: number) => {
        if (selectedIndex === undefined) return;
        const method = (methods as any)[optionKeys[selectedIndex]];
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
      headerTitle: clearingAll ? "Clearing..." : "Requests",
      headerLeft: () => <AndroidBackAction navigation={navigation} />,
      headerRight: () =>
        clearingAll ? undefined : (
          <Button
            variant="text"
            title={translate("clear_all")}
            onPress={clearAllSpam}
          />
        ),
    }),
    [clearAllSpam, clearingAll]
  );

  const toggleSpamRequests = useCallback(() => {
    setIsSpamToggleEnabled((prev) => !prev);
  }, []);

  useEffect(() => {
    converseEventEmitter.on("toggleSpamRequests", toggleSpamRequests);
    return () => {
      converseEventEmitter.off("toggleSpamRequests", toggleSpamRequests);
    };
  }, [toggleSpamRequests]);

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
        let items: ConversationFlatListItem[] = likelyNotSpam;
        if (likelySpam.length > 0) {
          items = isSpamToggleEnabled
            ? [
                ...likelyNotSpam,
                {
                  topic: "hiddenRequestsButton",
                  toggleActivated: true,
                  spamCount: likelySpam.length,
                },
                ...likelySpam,
              ]
            : [
                ...likelyNotSpam,
                {
                  topic: "hiddenRequestsButton",
                  toggleActivated: false,
                  spamCount: likelySpam.length,
                },
              ];
        }
        return (
          <>
            <GestureHandlerRootView style={styles.root}>
              <View style={styles.container}>
                <ConversationFlashList {...navigationProps} items={items} />
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
      width: 130,
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
