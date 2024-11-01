import { $globalStyles } from "@theme/styles";
import React, { memo } from "react";

import { ConversationList } from "./ConversationList";
import { ConversationListContextProvider } from "./ConversationList.context";
import { useConversationListHeader } from "./ConversationList.screen.header";
import { Screen } from "../../../components/Screen/ScreenComp/Screen";

export const ConversationListScreen = memo(function ConversationListScreen() {
  return (
    <ConversationListContextProvider>
      <Content />
    </ConversationListContextProvider>
  );
});

const Content = memo(function Content() {
  useConversationListHeader();

  return (
    <Screen contentContainerStyle={$globalStyles.flex1}>
      <ConversationList />
    </Screen>
  );
});
