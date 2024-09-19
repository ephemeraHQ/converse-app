import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { NavigationParamList } from "@screens/Navigation/Navigation";
import { MutableRefObject } from "react";
import { createContext, useContextSelector } from "use-context-selector";

export type ConversationListContextType = {
  navigationRef: MutableRefObject<
    | NativeStackScreenProps<
        NavigationParamList,
        "Chats" | "ShareFrame" | "ChatsRequests" | "Blocked"
      >["navigation"]
    | undefined
  >;
  routeName: "Chats" | "ShareFrame" | "ChatsRequests" | "Blocked";
  routeParams: NativeStackScreenProps<
    NavigationParamList,
    "Chats" | "ShareFrame" | "ChatsRequests" | "Blocked"
  >["route"]["params"];
};

export const ConversationListContext =
  createContext<ConversationListContextType>({} as ConversationListContextType);

export const useConversationListContext = <
  K extends keyof ConversationListContextType,
>(
  key: K
) => useContextSelector(ConversationListContext, (s) => s[key]);
