import RequestsSegmentedController from "@components/ConversationList/RequestsSegmentedController";
import { RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import {
  actionSheetColors,
  backgroundColor,
  textPrimaryColor,
  textSecondaryColor,
} from "@styles/colors";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { StyleSheet, Text, useColorScheme, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StackAnimationTypes } from "react-native-screens";

import {
  NativeStack,
  navigationAnimation,
  NavigationParamList,
} from "./Navigation";
import ActivityIndicator from "../../components/ActivityIndicator/ActivityIndicator";
import Button from "../../components/Button/Button";
import ConversationFlashList from "../../components/ConversationFlashList";
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

  const [selectedSegment, setSelectedSegment] = useState(0);
  const allRequests = sortedConversationsWithPreview.conversationsRequests;
  const { likelySpam, likelyNotSpam } = sortRequestsBySpamScore(allRequests);
  const styles = useStyles();

  const clearAllSpam = useCallback(() => {
    const methods = {
      "Clear all!": async () => {
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
      route,
      navigation,
    }: {
      route: RouteProp<NavigationParamList, "ChatsRequests">;
      navigation: NativeStackNavigationProp<
        NavigationParamList,
        "ChatsRequests"
      >;
    }) => ({
      animation: navigationAnimation as StackAnimationTypes,
      headerTitle: clearingAll
        ? () => (
            <View style={styles.headerContainer}>
              <ActivityIndicator />
              <Text style={styles.headerText}>Clearing</Text>
            </View>
          )
        : "Message requests",
      headerLeft: undefined,
      headerRight: () =>
        clearingAll ? undefined : (
          <Button variant="text" title="Clear all" onPress={clearAllSpam} />
        ),
    }),
    [clearAllSpam, clearingAll, styles.headerContainer, styles.headerText]
  );

  // Navigate back to the main screen when no request to display
  useEffect(() => {
    const unsubscribe = navRef.current?.addListener("focus", () => {
      if (allRequests.length === 0) {
        navRef.current?.goBack();
      }
    });
    return unsubscribe;
  }, [allRequests]);

  const handleSegmentChange = (index: number) => {
    setSelectedSegment(index);
  };

  const renderSegmentedController = () => {
    if (likelyNotSpam.length > 0 && likelySpam.length > 0) {
      return (
        <RequestsSegmentedController
          options={["You might know", "Spam"]}
          selectedIndex={selectedSegment}
          onSelect={handleSegmentChange}
        />
      );
    }
    return null;
  };

  const renderSuggestionText = () => {
    if (likelyNotSpam.length > 0) {
      return (
        <Text style={styles.suggestionText}>
          Based on your onchain history, we've made some suggestions on who you
          may know.
        </Text>
      );
    }
    return null;
  };

  const renderContent = (navigationProps: {
    route: RouteProp<NavigationParamList, "ChatsRequests">;
    navigation: NativeStackNavigationProp<NavigationParamList, "ChatsRequests">;
  }) => {
    if (likelyNotSpam.length === 0 && likelySpam.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            No message requests at this time.
          </Text>
        </View>
      );
    }

    if (likelyNotSpam.length === 0 && likelySpam.length > 0) {
      return (
        <>
          <Text style={styles.spamOnlyText}>
            You have some message requests that might be spam. Review them
            carefully.
          </Text>
          <ConversationFlashList {...navigationProps} items={likelySpam} />
        </>
      );
    }

    return (
      <>
        {renderSegmentedController()}
        {renderSuggestionText()}
        <ConversationFlashList
          {...navigationProps}
          items={selectedSegment === 0 ? likelyNotSpam : likelySpam}
        />
      </>
    );
  };

  return (
    <NativeStack.Screen name="ChatsRequests" options={navigationOptions}>
      {(navigationProps) => {
        navRef.current = navigationProps.navigation;
        return (
          <>
            <GestureHandlerRootView style={styles.root}>
              <View style={styles.container}>
                {renderContent(navigationProps)}
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
      paddingTop: 4,
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
      width: 110,
    },
    headerText: {
      marginLeft: 10,
      color: textPrimaryColor(colorScheme),
    },
    suggestionText: {
      fontSize: 12,
      color: textSecondaryColor(colorScheme),
      textAlign: "center",
      marginTop: 14,
      marginBottom: 10,
      marginHorizontal: 16,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    emptyText: {
      fontSize: 12,
      color: textSecondaryColor(colorScheme),
      textAlign: "center",
    },
    spamOnlyText: {
      fontSize: 12,
      color: textSecondaryColor(colorScheme),
      textAlign: "center",
      marginTop: 14,
      marginBottom: 10,
      marginHorizontal: 16,
    },
  });
};
