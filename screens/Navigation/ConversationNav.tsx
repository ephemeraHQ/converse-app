import { NavigationProp } from "@react-navigation/native";
import { textPrimaryColor } from "@styles/colors";
import { PictoSizes } from "@styles/sizes";
import { useCallback } from "react";
import {
  Platform,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
} from "react-native";
import { StackAnimationTypes } from "react-native-screens";

import Picto from "../../components/Picto/Picto";
import Conversation from "../Conversation";
import {
  NativeStack,
  NavigationParamList,
  navigationAnimation,
} from "./Navigation";
import type { ConversationTopic } from "@xmtp/react-native-sdk";

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
  const colorScheme = useColorScheme();

  const navigationOptions = useCallback(
    ({ navigation }: { navigation: NavigationProp<NavigationParamList> }) => ({
      headerShadowVisible: false,
      animation: navigationAnimation as StackAnimationTypes,
      title: "",
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
        <Conversation navigation={navigation} route={route} />
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
