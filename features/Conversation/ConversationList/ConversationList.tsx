import React, { memo } from "react";

import { useConversationListContextMultiple } from "./ConversationList.context";
import { ListFooter } from "./ConversationListFooter";
import { ListHeader } from "./ConversationListHeader";
import ChatNullState from "../../../components/Chat/ChatNullState";
import ConversationFlashList from "../../../components/ConversationFlashList";
import Recommendations from "../../../components/Recommendations/Recommendations";
import { currentAccount } from "../../../data/store/accountsStore";

export const ConversationList = memo(function ConversationList() {
  const { showChatNullState, handleScroll, showInitialLoading, flatListItems } =
    useConversationListContextMultiple((state) => ({
      showChatNullState: state.showChatNullState,
      handleScroll: state.handleScroll,
      showInitialLoading: state.showInitialLoading,
      flatListItems: state.flatListItems,
    }));

  if (showChatNullState) {
    return <ChatNullState currentAccount={currentAccount()} />;
  }

  return (
    <>
      <ConversationFlashList
        // route={route}
        // navigation={navigation}
        onScroll={handleScroll}
        items={showInitialLoading ? [] : flatListItems.items}
        ListHeaderComponent={<ListHeader />}
        ListFooterComponent={<ListFooter />}
      />
      <Recommendations visibility="HIDDEN" />
    </>
  );
});
