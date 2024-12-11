import { NavigationProp } from "@react-navigation/native";
import { useCallback } from "react";
import {
  Platform,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
} from "react-native";
import { StackAnimationTypes } from "react-native-screens";

import { Icon } from "@design-system/Icon/Icon";
import Conversation from "../Conversation";
import {
  NativeStack,
  NavigationParamList,
  navigationAnimation,
} from "./Navigation";
import type { ConversationTopic } from "@xmtp/react-native-sdk";
import { useAppTheme } from "@theme/useAppTheme";

export type ConversationNavParams = {
  topic?: ConversationTopic;
  text?: string;
  mainConversationWithPeer?: string;
  skipLoading?: boolean;
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
  const { theme, themed } = useAppTheme();

  const navigationOptions = useCallback(
    ({ navigation }: { navigation: NavigationProp<NavigationParamList> }) => ({
      headerShadowVisible: false,
      animation: navigationAnimation as StackAnimationTypes,
      title: "",
      headerStyle: {
        backgroundColor: theme.colors.background.surface,
      } as any,
      headerLeft: () => {
        const handleBack = () => {
          navigation.canGoBack() && navigation.goBack();
        };
        return (
          <TouchableOpacity
            onPress={handleBack}
            style={themed($iconContainer)}
            hitSlop={{ top: 20, bottom: 20, left: 20, right: 10 }}
          >
            <Icon
              icon="chevron.left"
              size={theme.iconSize.md}
              color={theme.colors.text.primary}
            />
          </TouchableOpacity>
        );
      },
    }),
    [theme, themed]
  );
  return (
    <NativeStack.Screen name="Conversation" options={navigationOptions}>
      {({ route, navigation }) => (
        <Conversation navigation={navigation} route={route} />
      )}
    </NativeStack.Screen>
  );
}

const $iconContainer: ViewStyle = {
  height: 40,
  justifyContent: "center",
  paddingRight: Platform.OS === "ios" ? 16 : 30,
};
