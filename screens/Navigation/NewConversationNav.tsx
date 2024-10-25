import { NativeStackNavigationOptions } from "@react-navigation/native-stack";
import {
  headerTitleStyle,
  navigationSecondaryBackgroundColor,
} from "@styles/colors";
import { useColorScheme } from "react-native";

import { NativeStack, navigationAnimation } from "./Navigation";
import NewConversationModal from "../NewConversation/NewConversationModal";

export type NewConversationNavParams = {
  peer?: string;
  addingToGroupTopic?: string;
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
    headerTitle: "New conversation",
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
