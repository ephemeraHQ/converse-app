import { NativeStack } from "@navigation/AppNavigator";

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
  return (
    <NativeStack.Screen
      name="NewConversation"
      component={NewConversationModal}
      options={{
        headerShown: false,
        presentation: "modal",
      }}
    />
  );
}
