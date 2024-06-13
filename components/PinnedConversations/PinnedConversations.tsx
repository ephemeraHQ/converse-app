import { Text, View, useColorScheme } from "react-native";
import { TouchableOpacity } from "react-native-gesture-handler";

import { useChatStore, useProfilesStore } from "../../data/store/accountsStore";
import { XmtpConversation } from "../../data/store/chatStore";
import { textSecondaryColor } from "../../utils/colors";
import { navigate } from "../../utils/navigation";
import { getPreferredAvatar } from "../../utils/profile";
import Avatar from "../Avatar";

type Props = {
  convos?: XmtpConversation[];
};
export default function PinnedConversations({ convos }: Props) {
  const colorScheme = useColorScheme();
  const profiles = useProfilesStore((s) => s.profiles);
  const setPinnedConversations = useChatStore((s) => s.setPinnedConversations);
  const pinnedConvos = !convos
    ? []
    : convos?.map((convo) => {
        const title = convo.isGroup ? convo.groupName : convo.conversationTitle;
        const socials = profiles[convo.peerAddress as string]?.socials;
        const avatar = getPreferredAvatar(socials);

        return (
          <TouchableOpacity
            style={{
              margin: 8,
              padding: 4,
            }}
            onPress={() => {
              navigate("Conversation", {
                topic: convo.topic,
              });
            }}
            onLongPress={() => {
              setPinnedConversations([convo]);
            }}
          >
            <Avatar
              key={convo.topic}
              uri={avatar}
              size={80}
              style={{ margin: 8 }}
            />
            <Text
              style={{
                color: textSecondaryColor(colorScheme),
                textAlign: "center",
                flexWrap: "wrap",
                maxWidth: 100,
              }}
            >
              {title}
            </Text>
          </TouchableOpacity>
        );
      });
  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "center",
        flexWrap: "wrap",
      }}
    >
      {pinnedConvos}
    </View>
  );
}
