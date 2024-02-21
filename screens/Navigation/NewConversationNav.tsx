import { useColorScheme } from "react-native";

import { headerTitleStyle } from "../../utils/colors";
import NewConversationModal from "../NewConversation/NewConversationModal";
import { NativeStack } from "./Navigation";

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
