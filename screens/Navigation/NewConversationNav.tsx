import { NativeStackNavigationOptions } from "@react-navigation/native-stack";
import {
  headerTitleStyle,
  navigationSecondaryBackgroundColor,
} from "@styles/colors";
import { useColorScheme } from "react-native";

import { NativeStack, navigationAnimation } from "./Navigation";
import NewConversationModal from "../NewConversation/NewConversationModal";
import type { ConversationTopic } from "@xmtp/react-native-sdk";
import { translate } from "@/i18n";

export type NewConversationNavParams = {
  peer?: string;
  addingToGroupTopic?: ConversationTopic;
};

export const NewConversationScreenConfig = {
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
  const options: NativeStackNavigationOptions = {
    headerTitle: translate("new_conversation.new_conversation"),
    presentation: "modal",
    headerStyle: {
      backgroundColor: navigationSecondaryBackgroundColor(colorScheme),
    } as any,
    animation: navigationAnimation,
  };

  return (
    <NativeStack.Screen
      name="NewConversation"
      component={NewConversationModal}
      options={{
        headerShown: false,
        presentation: "modal",
        headerTitleStyle: headerTitleStyle(colorScheme),
      }}
    />
  );
}
