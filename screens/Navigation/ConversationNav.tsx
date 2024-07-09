import { NavigationProp } from "@react-navigation/native";
import { textPrimaryColor } from "@styles/colors";
import { PictoSizes } from "@styles/sizes";
import { useCallback } from "react";
import { Platform, StyleSheet, useColorScheme } from "react-native";
import { TouchableOpacity } from "react-native-gesture-handler";
import { StackAnimationTypes } from "react-native-screens";

import {
  NativeStack,
  navigationAnimation,
  NavigationParamList,
} from "./Navigation";
import { useIsSplitScreen } from "./navHelpers";
import Picto from "../../components/Picto/Picto";
import Conversation from "../Conversation";

export type ConversationNavParams = {
  topic?: string;
  message?: string;
  focus?: boolean;
  mainConversationWithPeer?: string;
};

export const ConversationScreenConfig = {
  path: "/conversation",
  parse: {
    topic: decodeURIComponent,
  },
  stringify: {
    topic: encodeURIComponent,
  },
};

export default function ConversationNav(
  routeParams?: ConversationNavParams | undefined
) {
  // If we're in split screen mode, the topic is not passed via the usual StackNavigation
  // but via the DrawerNavigation that passes it back to this component via prop
  // so we override the route when instantiating Conversation
  const isSplitScreen = useIsSplitScreen();
  const colorScheme = useColorScheme();
  const navigationOptions = useCallback(
    ({ navigation }: { navigation: NavigationProp<NavigationParamList> }) => ({
      headerShadowVisible: false,
      animation: navigationAnimation as StackAnimationTypes,
      headerLeft: () => {
        const handleBack = () => {
          navigation.canGoBack() && navigation.goBack();
        };
        return (
          <TouchableOpacity
            onPress={handleBack}
            style={styles.iconContainer}
            hitSlop={{ top: 20, bottom: 20, left: 20, right: 10 }}
          >
            <Picto
              picto="chevron.left"
              size={PictoSizes.conversationNav}
              color={textPrimaryColor(colorScheme)}
            />
          </TouchableOpacity>
        );
      },
    }),
    [colorScheme]
  );
  return (
    <NativeStack.Screen name="Conversation" options={navigationOptions}>
      {({ route, navigation }) => (
        <Conversation
          navigation={navigation}
          key={
            isSplitScreen
              ? `conversation-${JSON.stringify(routeParams || {})}`
              : "conversation"
          }
          route={{
            ...route,
            params: isSplitScreen ? routeParams || {} : route.params,
          }}
        />
      )}
    </NativeStack.Screen>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    height: 40,
    justifyContent: "center",
    paddingRight: Platform.OS === "ios" ? 16 : 30,
  },
});
