import { Platform, useColorScheme } from "react-native";

import { navigationSecondaryBackgroundColor } from "../../utils/colors";
import NewConversation from "../NewConversation";
import { NativeStack, navigationAnimation } from "./Navigation";

export type NewConversationNavParams = {
  peer?: string;
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
      component={NewConversation}
      options={{
        headerTitle: "New conversation",
        presentation: "modal",
        headerStyle: {
          backgroundColor: navigationSecondaryBackgroundColor(colorScheme),
        },
        headerTitleStyle: Platform.select({
          default: {},
          web: { left: -20 } as any,
        }),
        animation: navigationAnimation,
      }}
    />
  );
}
