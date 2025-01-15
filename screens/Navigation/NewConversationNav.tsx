import { headerTitleStyle } from "@styles/colors";
import { useColorScheme } from "react-native";

import { NativeStack } from "./Navigation";
import logger from "@/utils/logger";
import NewConversation from "../NewConversation/NewConversation";

export const NewChatScreenConfig = {
  path: "/newConversation",
  parse: {
    peer: decodeURIComponent,
  },
  stringify: {
    peer: encodeURIComponent,
  },
};

export function NewConversationNav() {
  const colorScheme = useColorScheme();

  logger.debug("[NewConversationNav] Configuring navigation", {
    colorScheme,
  });

  return (
    <NativeStack.Screen
      name="NewConversation"
      component={NewConversation}
      options={{
        headerShown: true,
        headerTitleStyle: headerTitleStyle(colorScheme),
      }}
    />
  );
}
