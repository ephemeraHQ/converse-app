import React, { memo } from "react";

import { useConversationListContextMultiple } from "./ConversationList.context";
import InitialLoad from "../../../components/InitialLoad";
import NoResult from "../../../components/Search/NoResult";

export const ConversationListFooter = memo(function ConversationListFooter() {
  const { showInitialLoading, showNoResult } =
    useConversationListContextMultiple(["showInitialLoading", "showNoResult"]);

  if (showInitialLoading) {
    return <InitialLoad />;
  }

  if (showNoResult) {
    return <NoResult />;
  }

  return null;
});
