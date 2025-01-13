import { NativeStackNavigationOptions } from "@react-navigation/native-stack";
import {
  headerTitleStyle,
  navigationSecondaryBackgroundColor,
} from "@styles/colors";
import { useColorScheme } from "react-native";

import { NativeStack } from "./Navigation";
import logger from "@/utils/logger";
import NewConversation from "../NewConversation/NewConversation";

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
      component={NewConversation}
      options={{
        headerShown: false,
        headerTitleStyle: headerTitleStyle(colorScheme),
      }}
    />
  );
}
