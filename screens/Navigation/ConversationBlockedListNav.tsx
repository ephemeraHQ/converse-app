import { RouteProp } from "@react-navigation/native";
import { backgroundColor } from "@styles/colors";
import React, { useCallback, useRef } from "react";
import { Platform, StyleSheet, useColorScheme, View } from "react-native";
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
      headerTitle: "Blocked Chats",
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
                <ConversationFlashList
                  {...navigationProps}
                  items={allBlockedChats}
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
  });
};
