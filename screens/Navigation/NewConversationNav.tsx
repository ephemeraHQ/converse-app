import { NativeStackNavigationOptions } from "@react-navigation/native-stack";
import {
  headerTitleStyle,
  navigationSecondaryBackgroundColor,
} from "@styles/colors";
import { useColorScheme } from "react-native";

import { NativeStack } from "./Navigation";
import NewConversationModal from "../NewConversation/NewConversationModal";
import type { ConversationTopic } from "@xmtp/react-native-sdk";
import logger from "@/utils/logger";

export type NewChatNavParams = {
  // peer?: string;
  // addingToGroupTopic?: ConversationTopic;
};

export const NewChatScreenConfig = {
  path: "/newConversation",
  parse: {
    peer: decodeURIComponent,
  },
  stringify: {
    peer: encodeURIComponent,
  },
};

export default function NewConversationNav() {
  const colorScheme = useColorScheme();

  logger.debug("[NewConversationNav] Configuring navigation", {
    colorScheme,
  });

  return (
    <NativeStack.Screen
      name="NewConversation"
      component={NewConversationModal}
      options={{
        headerShown: false,
        headerTitleStyle: headerTitleStyle(colorScheme),
      }}
    />
  );
}
