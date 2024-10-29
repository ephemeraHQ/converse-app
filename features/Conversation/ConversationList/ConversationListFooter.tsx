import React, { memo } from "react";

import { useConversationListContextMultiple } from "./ConversationList.context";
import InitialLoad from "../../../components/InitialLoad";
import NoResult from "../../../components/Search/NoResult";

export const ListFooter = memo(function ListFooter() {
  const { showInitialLoading, showNoResult } =
    useConversationListContextMultiple((state) => ({
      showInitialLoading: state.showInitialLoading,
      showNoResult: state.showNoResult,
    }));

  if (showInitialLoading) {
    return <InitialLoad />;
  }

  if (showNoResult) {
    return <NoResult />;
  }

  return null;
});
