import { RouteProp } from "@react-navigation/native";
import {
  backgroundColor,
  primaryColor,
  textPrimaryColor,
} from "@styles/colors";
import React, { useCallback, useRef } from "react";
import { Platform, StyleSheet, useColorScheme, View, Text } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StackAnimationTypes } from "react-native-screens";

import {
  NativeStack,
  navigationAnimation,
  NavigationParamList,
} from "./Navigation";
import AndroidBackAction from "../../components/AndroidBackAction";
import ConversationFlashList from "../../components/ConversationFlashList";
import { useChatStore } from "../../data/store/accountsStore";

export default function ConversationBlockedListNav() {
  const sortedConversationsWithPreview = useChatStore(
    (s) => s.sortedConversationsWithPreview
  );
  const navRef = useRef<any>();
  const allBlockedChats = sortedConversationsWithPreview.conversationsBlocked;
  const styles = useStyles();

  const navigationOptions = useCallback(
    ({
      navigation,
    }: {
      route: RouteProp<NavigationParamList, "Blocked">;
      navigation: any;
    }) => ({
      animation: navigationAnimation as StackAnimationTypes,
      headerTitle: "Removed Chats",
      headerLeft:
        Platform.OS === "ios"
          ? undefined
          : () => <AndroidBackAction navigation={navigation} />,
    }),
    []
  );

  return (
    <NativeStack.Screen name="Blocked" options={navigationOptions}>
      {(navigationProps) => {
        navRef.current = navigationProps.navigation;
        return (
          <>
            <GestureHandlerRootView style={styles.root}>
              <View style={styles.container}>
                {allBlockedChats.length > 0 ? (
                  <ConversationFlashList
                    {...navigationProps}
                    items={allBlockedChats}
                  />
                ) : (
                  <NoResult />
                )}
              </View>
            </GestureHandlerRootView>
          </>
        );
      }}
    </NativeStack.Screen>
  );
}

const NoResult = () => {
  const styles = useStyles();

  return (
    <>
      <Text style={styles.emoji}>👀</Text>
      <Text style={styles.title}>
        <Text>
          We could not find any removed group chat in your existing
          conversations.
        </Text>
      </Text>
    </>
  );
};

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
    emoji: {
      ...Platform.select({
        default: {
          textAlign: "center",
          marginTop: 150,
          fontSize: 34,
          marginBottom: 12,
        },
        android: {
          display: "none",
        },
      }),
    },
    title: {
      color: textPrimaryColor(colorScheme),
      ...Platform.select({
        default: {
          textAlign: "center",
          fontSize: 17,
          paddingHorizontal: 32,
        },
        android: {
          textAlign: "left",
          fontSize: 16,
          lineHeight: 22,
          paddingTop: 10,
          paddingHorizontal: 16,
        },
      }),
    },
    clickableText: {
      color: primaryColor(colorScheme),
      fontWeight: "500",
    },
  });
};
