import RequestsSegmentedController from "@components/ConversationList/RequestsSegmentedController";
import { translate } from "@i18n";
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
import ConversationFlashList from "@components/ConversationFlastList/ConversationFlashList";
import { showActionSheetWithOptions } from "../../components/StateHandlers/ActionSheetStateHandler";
import { useCurrentAccount } from "../../data/store/accountsStore";
import { consentToAddressesOnProtocolByAccount } from "../../utils/xmtpRN/contacts";
import { useRequestItems } from "../../features/conversation-requests-list/useRequestItems";

export default function ConversationRequestsListNav() {
  const colorScheme = useColorScheme();
  const account = useCurrentAccount() as string;
  const navRef = useRef<any>();
  const [clearingAll, setClearingAll] = useState(false);

  const [selectedSegment, setSelectedSegment] = useState(0);
  const { likelySpam, likelyNotSpam, isRefetching, refetch } =
    useRequestItems();

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
          new Set(
            likelyNotSpam.map((c) =>
              "addedByInboxId" in c ? c.addedByInboxId : undefined
            )
          )
        ).filter((peer) => !!peer) as string[];
        await consentToAddressesOnProtocolByAccount({
          account,
          addresses: peers,
          consent: "deny",
        });
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
  }, [account, colorScheme, likelyNotSpam]);

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
              <Text style={styles.headerText}>{translate("clearing")}</Text>
            </View>
          )
        : translate("message_requests"),
      headerLeft: undefined,
      headerRight: () =>
        clearingAll ? undefined : (
          <Button
            variant="text"
            title={translate("clear_all")}
            onPress={clearAllSpam}
          />
        ),
    }),
    [clearAllSpam, clearingAll, styles.headerContainer, styles.headerText]
  );

  // Navigate back to the main screen when no request to display
  useEffect(() => {
    const unsubscribe = navRef.current?.addListener("focus", () => {
      if (likelyNotSpam.length === 0 && likelySpam.length === 0) {
        navRef.current?.goBack();
      }
    });
    return unsubscribe;
  }, [likelyNotSpam.length, likelySpam.length]);

  const hasLikelyNotSpam = likelyNotSpam.length > 0;

  const handleSegmentChange = (index: number) => {
    setSelectedSegment(index);
  };

  const renderSegmentedController = () => {
    return (
      <RequestsSegmentedController
        options={[translate("you_might_know"), translate("hidden_requests")]}
        selectedIndex={selectedSegment}
        onSelect={handleSegmentChange}
      />
    );
  };

  const renderContent = (navigationProps: {
    route: RouteProp<NavigationParamList, "ChatsRequests">;
    navigation: NativeStackNavigationProp<NavigationParamList, "ChatsRequests">;
  }) => {
    const showSuggestionText = selectedSegment === 0 && hasLikelyNotSpam;
    const showNoSuggestionsText = selectedSegment === 0 && !hasLikelyNotSpam;
    const showSpamWarning = selectedSegment === 1;
    const itemsToShow = selectedSegment === 0 ? likelyNotSpam : likelySpam;

    return (
      <>
        {renderSegmentedController()}
        {showSuggestionText && (
          <Text style={styles.suggestionText}>
            {translate("suggestion_text")}
          </Text>
        )}
        {showNoSuggestionsText && (
          <Text style={styles.suggestionText}>
            {translate("no_suggestions_text")}
          </Text>
        )}
        {showSpamWarning && (
          <Text style={styles.suggestionText}>
            {translate("hidden_requests_warn")}
          </Text>
        )}
        <ConversationFlashList
          {...navigationProps}
          isRefetching={isRefetching}
          refetch={refetch}
          items={itemsToShow}
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
    emptyContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    suggestionText: {
      fontSize: 12,
      color: textSecondaryColor(colorScheme),
      textAlign: "center",
      paddingHorizontal: 16,
      marginTop: 14,
      marginBottom: 12,
      marginHorizontal: 16,
    },
  });
};
