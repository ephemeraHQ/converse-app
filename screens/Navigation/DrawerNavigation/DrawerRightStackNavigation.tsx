import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import * as Linking from "expo-linking";
import { Platform, useColorScheme } from "react-native";

import config from "../../../config";
import { useAppStore } from "../../../data/store/appStore";
import { backgroundColor, headerTitleStyle } from "../../../utils/colors";
import { isDesktop } from "../../../utils/device";
import ConversationNav from "../ConversationNav";
import ConverseMatchMakerNav from "../ConverseMatchMakerNav";
import EnableTransactionsNav from "../EnableTransactionsNav";
import NewConversationNav from "../NewConversationNav";
import ProfileNav from "../ProfileNav";
import ShareProfileNav from "../ShareProfileNav";
import TopUpNav from "../TopUpNav";
import WebviewPreviewNav from "../WebviewPreviewNav";

export type NavigationParamList = {
  Conversation: {
    topic?: string;
    message?: string;
    focus?: boolean;
    mainConversationWithPeer?: string;
  };
  NewConversation: {
    peer?: string;
  };
  EnableTransactions: undefined;
  ConverseMatchMaker: undefined;
  ShareProfile: undefined;
  TopUp: undefined;
  Profile: {
    address: string;
  };
  WebviewPreview: {
    uri: string;
  };
};

export const NativeStack = createNativeStackNavigator<NavigationParamList>();
const prefix = Linking.createURL("/");
const linking = {
  prefixes: [prefix, ...config.universalLinks],
  config: {
    initialRouteName: "Conversation",
    screens: {
      Conversation: {
        path: "/conversation",
        parse: {
          topic: decodeURIComponent,
        },
        stringify: {
          topic: encodeURIComponent,
        },
      },
      NewConversation: {
        path: "/newConversation",
        parse: {
          peer: decodeURIComponent,
        },
        stringify: {
          peer: encodeURIComponent,
        },
      },
      Profile: {
        path: "/profile",
      },
      ShareProfile: {
        path: "/shareProfile",
      },
      WebviewPreview: {
        path: "/webviewPreview",
        parse: {
          uri: decodeURIComponent,
        },
        stringify: {
          uri: encodeURIComponent,
        },
      },
    },
  },
};

export const navigationAnimation = Platform.OS === "ios" ? "default" : "none";

export default function DrawerRightStackNavigation({
  topic,
}: {
  topic: string | undefined;
}) {
  console.log({ topic });
  const colorScheme = useColorScheme();
  const splashScreenHidden = useAppStore((s) => s.splashScreenHidden);
  return (
    <NavigationContainer
      linking={splashScreenHidden ? (linking as any) : undefined}
      independent
    >
      <NativeStack.Navigator screenOptions={{ gestureEnabled: !isDesktop }}>
        <NativeStack.Group
          screenOptions={{
            headerStyle: {
              backgroundColor: backgroundColor(colorScheme),
            },
            headerTitleStyle: headerTitleStyle(colorScheme),
            headerShadowVisible: Platform.OS !== "android",
          }}
        >
          {ConversationNav(topic)}
          {NewConversationNav()}
          {ConverseMatchMakerNav()}
          {ShareProfileNav()}
          {WebviewPreviewNav()}
          {ProfileNav()}
          {TopUpNav()}
          {EnableTransactionsNav()}
        </NativeStack.Group>
      </NativeStack.Navigator>
    </NavigationContainer>
  );
}
