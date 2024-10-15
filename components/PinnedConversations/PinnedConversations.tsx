import { useChatStore } from "@data/store/accountsStore";
import { useSelect } from "@data/store/storeHelpers";
import { useMemo } from "react";
import { StyleSheet, View } from "react-native";

import { PinnedConversation } from "./PinnedConversation";
import { ChatStoreType, XmtpConversation } from "../../data/store/chatStore";

const chatStoreSelectedKeys: (keyof ChatStoreType)[] = ["topicsData"];

export function PinnedConversations({
  convos,
}: {
  convos: XmtpConversation[];
}) {
  const { topicsData } = useChatStore(useSelect(chatStoreSelectedKeys));

  const pinnedTopics = useMemo(() => {
    const pinnedConvoIds: string[] = [];
    for (const topic in topicsData) {
      if (topicsData[topic]?.isPinned) {
        pinnedConvoIds.push(topic);
      }
    }
    return pinnedConvoIds;
  }, [topicsData]);

  const pinnedConvos = !pinnedTopics
    ? []
    : pinnedTopics?.map((topic) => {
        return <PinnedConversation topic={topic} key={topic} />;
      });
  return <View style={styles.container}>{pinnedConvos}</View>;
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "center",
    flexWrap: "wrap",
  },
});
