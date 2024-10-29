import { memo } from "react";
import { StyleSheet } from "react-native";

import { NativeStack } from "./Navigation";
import { ConversationListScreen } from "../../features/Conversation/ConversationList/ConversationList.screen";

export const ConversationListNav = memo(function ConversationListNav() {
  return (
    <NativeStack.Screen name="Chats">
      {(navigationProps) => (
        <ConversationListScreen
          {...navigationProps}
          searchBarRef={searchBarRef}
        />
      )}
    </NativeStack.Screen>
  );
});

const styles = StyleSheet.create({
  connectingContainer: {
    marginTop: -5,
    flexDirection: "row",
    alignItems: "center",
  },
  warn: {
    marginLeft: 8,
  },
  headerRightContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: -8,
  },
  headerLeftContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginTop: -10,
  },
  offsetComposeIcon: {
    top: -2,
  },
  headerLeftTouchable: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
  },
  headerLeftText: {
    fontSize: 16,
    paddingBottom: 6,
  },
});
