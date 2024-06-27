import { StyleSheet, View } from "react-native";

import { XmtpConversation } from "../../data/store/chatStore";
import { PinnedConversation } from "./PinnedConversation";

type Props = {
  convos?: XmtpConversation[];
};

export default function PinnedConversations({ convos }: Props) {
  const pinnedConvos = !convos
    ? []
    : convos?.map((convo) => {
        return <PinnedConversation conversation={convo} key={convo.topic} />;
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
