import { useColorScheme } from "react-native";
import { TouchableOpacity } from "react-native-gesture-handler";

import Picto from "../../components/Picto/Picto.ios";
import { textPrimaryColor } from "../../utils/colors";
import { navigate } from "../../utils/navigation";
import Conversation from "../Conversation";
import { NativeStack, navigationAnimation } from "./Navigation";
import { useIsSplitScreen } from "./navHelpers";

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
  return (
    <NativeStack.Screen
      name="Conversation"
      options={{
        animation: navigationAnimation,
        headerLeft: () => (
          <TouchableOpacity
            onPress={() => navigate("Chats")}
            style={{ height: 40, justifyContent: "center", marginLeft: 8 }}
          >
            <Picto
              picto="chevron.left"
              size={16}
              color={textPrimaryColor(colorScheme)}
            />
          </TouchableOpacity>
        ),
      }}
    >
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
