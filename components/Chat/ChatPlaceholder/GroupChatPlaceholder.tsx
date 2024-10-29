import { Button } from "@design-system/Button/Button";
import { useGroupMembers } from "@hooks/useGroupMembers";
import { useGroupName } from "@hooks/useGroupName";
import { translate } from "@i18n";
import { useGroupQuery } from "@queries/useGroupQuery";
import { textPrimaryColor } from "@styles/colors";
import { isGroupTopic } from "@utils/groupUtils/groupId";
import { useCallback, useMemo } from "react";
import {
  Keyboard,
  Platform,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  useColorScheme,
  View,
} from "react-native";

import { useCurrentAccount } from "../../../data/store/accountsStore";
import { useConversationContext } from "../../../utils/conversation";
import { sendMessage } from "../../../utils/message";
import ActivityIndicator from "../../ActivityIndicator/ActivityIndicator";

type Props = {
  messagesCount: number;
};

export function GroupChatPlaceholder({ messagesCount }: Props) {
  const topic = useConversationContext("topic");
  const conversation = useConversationContext("conversation");
  const onReadyToFocus = useConversationContext("onReadyToFocus");

  const currentAccount = useCurrentAccount();
  const { data: group } = useGroupQuery(
    currentAccount ?? "",
    conversation?.topic ?? ""
  );
  const { groupName } = useGroupName(conversation?.topic ?? "");
  const { members } = useGroupMembers(conversation?.topic ?? "");

  const styles = useStyles();
  const groupCreatedByUser = useMemo(() => {
    if (!group || !currentAccount) {
      return false;
    }
    const creatorInfo = members?.byId[group.creatorInboxId];

    return creatorInfo?.addresses.some(
      (a) => a.toLowerCase() === currentAccount.toLowerCase()
    );
  }, [group, currentAccount, members?.byId]);

  const handleSend = useCallback(() => {
    if (!conversation) {
      return;
    }
    sendMessage({
      conversation,
      content: "👋",
      contentType: "xmtp.org/text:1.0",
    });
  }, [conversation]);

  const handleDismiss = useCallback(() => {
    Keyboard.dismiss();
  }, []);

  const onLayout = useCallback(() => {
    if (conversation && messagesCount === 0) {
      onReadyToFocus();
    }
  }, [conversation, messagesCount, onReadyToFocus]);

  return (
    <TouchableWithoutFeedback onPress={handleDismiss}>
      <View onLayout={onLayout} style={styles.chatPlaceholder}>
        {!conversation && (
          <View>
            {!topic && <ActivityIndicator style={{ marginBottom: 20 }} />}
            <Text style={styles.chatPlaceholderText}>
              {topic
                ? isGroupTopic(topic)
                  ? translate("group_not_found")
                  : translate("conversation_not_found")
                : translate("opening_conversation")}
            </Text>
          </View>
        )}
        {conversation && messagesCount === 0 && !groupCreatedByUser && (
          <View>
            <Text style={styles.chatPlaceholderText}>
              This is the beginning of your{"\n"}conversation in {groupName}
            </Text>

            <Button
              variant="fill"
              picto="hand.wave"
              text={translate("say_hi")}
              style={styles.cta}
              onPress={handleSend}
            />
          </View>
        )}
      </View>
    </TouchableWithoutFeedback>
  );
}

const useStyles = () => {
  const colorScheme = useColorScheme();
  return StyleSheet.create({
    chatPlaceholder: {
      flex: 1,
      justifyContent: "center",
    },
    chatPlaceholderContent: {
      paddingVertical: 20,
      flex: 1,
    },
    chatPlaceholderText: {
      textAlign: "center",
      fontSize: Platform.OS === "android" ? 16 : 17,
      color: textPrimaryColor(colorScheme),
    },
    cta: {
      alignSelf: "center",
      marginTop: 20,
    },
    activitySpinner: {
      marginBottom: 20,
    },
  });
};
