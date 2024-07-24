import { NativeStackNavigationOptions } from "@react-navigation/native-stack";
import {
  headerTitleStyle,
  listItemSeparatorColor,
  navigationSecondaryBackgroundColor,
  textPrimaryColor,
} from "@styles/colors";
import { Platform, useColorScheme } from "react-native";

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
      borderBottomColor:
        Platform.OS === "web" ? listItemSeparatorColor(colorScheme) : undefined,
    } as any,
    animation: navigationAnimation,
  };
  if (Platform.OS === "web") {
    options.headerTitleStyle = {
      left: -20,
      color: textPrimaryColor(colorScheme),
    } as any;
  }
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
