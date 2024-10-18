import { translate } from "@i18n";
import { actionSheetColors, textPrimaryColor } from "@styles/colors";
import { isGroupTopic } from "@utils/groupUtils/groupId";
import {
  Keyboard,
  Platform,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  useColorScheme,
  View,
} from "react-native";

import {
  currentAccount,
  useProfilesStore,
  useRecommendationsStore,
  useSettingsStore,
} from "../../../data/store/accountsStore";
import { useConversationContext } from "../../../utils/conversation";
import { sendMessage } from "../../../utils/message";
import { getProfile, getProfileData } from "../../../utils/profile";
import { conversationName } from "../../../utils/str";
import { consentToPeersOnProtocol } from "../../../utils/xmtpRN/conversations";
import ActivityIndicator from "../../ActivityIndicator/ActivityIndicator";
import Button from "../../Button/Button";
import { Recommendation } from "../../Recommendations/Recommendation";
import { showActionSheetWithOptions } from "../../StateHandlers/ActionSheetStateHandler";

type Props = {
  messagesCount: number;
};

export default function ChatPlaceholder({ messagesCount }: Props) {
  const topic = useConversationContext("topic");
  const conversation = useConversationContext("conversation");
  const isBlockedPeer = useConversationContext("isBlockedPeer");
  const onReadyToFocus = useConversationContext("onReadyToFocus");
  const colorScheme = useColorScheme();
  const styles = useStyles();
  const setPeersStatus = useSettingsStore((s) => s.setPeersStatus);
  const recommendationData = useRecommendationsStore((s) =>
    conversation?.peerAddress ? s.frens[conversation.peerAddress] : undefined
  );
  const peerSocials = useProfilesStore((s) =>
    conversation?.peerAddress
      ? getProfile(conversation.peerAddress, s.profiles)?.socials
      : undefined
  );
  const profileData = getProfileData(recommendationData, peerSocials);
  return (
    <TouchableWithoutFeedback
      onPress={() => {
        Keyboard.dismiss();
      }}
    >
      <View
        onLayout={() => {
          if (conversation && !isBlockedPeer && messagesCount === 0) {
            onReadyToFocus();
          }
        }}
        style={styles.chatPlaceholder}
      >
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
        {conversation && isBlockedPeer && (
          <View>
            <Text style={styles.chatPlaceholderText}>This user is blocked</Text>
            <Button
              variant="secondary"
              picto="lock.open"
              title="Unblock"
              style={styles.cta}
              onPress={() => {
                showActionSheetWithOptions(
                  {
                    options: ["Unblock", "Cancel"],
                    cancelButtonIndex: 1,
                    destructiveButtonIndex: isBlockedPeer ? undefined : 0,
                    title: translate("if_you_unblock_contact"),
                    ...actionSheetColors(colorScheme),
                  },
                  (selectedIndex?: number) => {
                    if (selectedIndex === 0 && conversation?.peerAddress) {
                      const { peerAddress } = conversation;
                      consentToPeersOnProtocol(
                        currentAccount(),
                        [peerAddress],
                        "allow"
                      );
                      setPeersStatus({ [peerAddress]: "consented" });
                    }
                  }
                );
              }}
            />
          </View>
        )}
        {conversation && !isBlockedPeer && messagesCount === 0 && (
          <View>
            {profileData && !conversation.isGroup ? (
              <Recommendation
                address={conversation.peerAddress}
                recommendationData={profileData}
                embedInChat
                isVisible
              />
            ) : (
              <Text style={styles.chatPlaceholderText}>
                This is the beginning of your{"\n"}conversation with{" "}
                {conversation ? conversationName(conversation) : ""}
              </Text>
            )}

            <Button
              variant="secondary"
              picto="hand.wave"
              title="Say hi"
              style={styles.cta}
              onPress={() => {
                sendMessage({
                  conversation,
                  content: "👋",
                  contentType: "xmtp.org/text:1.0",
                });
              }}
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
      paddingHorizontal: 30,
    },
    cta: {
      alignSelf: "center",
      marginTop: 20,
    },
  });
};
