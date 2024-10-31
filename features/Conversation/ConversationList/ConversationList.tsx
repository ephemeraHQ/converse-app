import { useRouter } from "@navigation/useNavigation";
import { useRoute } from "@react-navigation/native";
import React, { memo } from "react";

import { useConversationListContextMultiple } from "./ConversationList.context";
import { ConversationListFooter } from "./ConversationListFooter";
import { ConversationListHeader } from "./ConversationListHeader";
import ChatNullState from "../../../components/Chat/ChatNullState";
import ConversationFlashList from "../../../components/ConversationFlashList";
import Recommendations from "../../../components/Recommendations/Recommendations";
import { currentAccount } from "../../../data/store/accountsStore";

export const ConversationList = memo(function ConversationList() {
  // TODO: remove when ConversationFlashList fixed
  const navigation = useRouter();
  const route = useRoute();

  const { showChatNullState, handleScroll, showInitialLoading, flatListItems } =
    useConversationListContextMultiple([
      "showChatNullState",
      "handleScroll",
      "showInitialLoading",
      "flatListItems",
    ]);

  if (showChatNullState) {
    return <ChatNullState currentAccount={currentAccount()} />;
  }

  return (
    <>
      <ConversationFlashList
        // @ts-ignore we'll remove this later anyway
        route={route}
        // @ts-ignore we'll remove this later anyway
        navigation={navigation}
        onScroll={handleScroll}
        items={showInitialLoading ? [] : flatListItems.items}
        ListHeaderComponent={<ConversationListHeader />}
        ListFooterComponent={<ConversationListFooter />}
      />
      <Recommendations visibility="HIDDEN" />
    </>
  );
});
