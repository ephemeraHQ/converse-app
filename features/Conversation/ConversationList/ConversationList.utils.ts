import { RouteProp, useRoute } from "@react-navigation/native";
import { useMemo } from "react";

import { useChatStore } from "../../../data/store/accountsStore";
import { useSelect } from "../../../data/store/storeHelpers";
import { NavigationParamList } from "../../../navigation/Navigation.types";

export function useShowChatNullState() {
  const conversationsCount = useChatStore(
    (state) => Object.keys(state.conversations).length
  );

  const { searchQuery, initialLoadDoneOnce } = useChatStore(
    useSelect(["searchQuery", "initialLoadDoneOnce"])
  );

  return useMemo(
    () => conversationsCount === 0 && !searchQuery && initialLoadDoneOnce,
    [conversationsCount, searchQuery, initialLoadDoneOnce]
  );
}

export function useIsSharingMode() {
  const route = useRoute<RouteProp<NavigationParamList, "Chats">>();
  return !!route.params?.frameURL;
}
