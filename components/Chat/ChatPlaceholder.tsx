import {
  useColorScheme,
  StyleSheet,
  Text,
  View,
  TouchableWithoutFeedback,
  Keyboard,
  Platform,
} from "react-native";

import {
  currentAccount,
  useProfilesStore,
  useRecommendationsStore,
  useSettingsStore,
} from "../../data/store/accountsStore";
import { blockPeer } from "../../utils/api";
import { actionSheetColors, textPrimaryColor } from "../../utils/colors";
import { useConversationContext } from "../../utils/conversation";
import { sendMessage } from "../../utils/message";
import { getProfileData } from "../../utils/profile";
import { conversationName } from "../../utils/str";
import ActivityIndicator from "../ActivityIndicator/ActivityIndicator";
import Button from "../Button/Button";
import { Recommendation } from "../Recommendations/Recommendation";
import { showActionSheetWithOptions } from "../StateHandlers/ActionSheetStateHandler";

type Props = {
  messagesCount: number;
};

export default function ChatPlaceholder({ messagesCount }: Props) {
  const { conversation, isBlockedPeer, onReadyToFocus } =
    useConversationContext(["conversation", "isBlockedPeer", "onReadyToFocus"]);
  const colorScheme = useColorScheme();
  const styles = useStyles();
  const setBlockedPeerStatus = useSettingsStore((s) => s.setBlockedPeerStatus);
  const recommendationData = useRecommendationsStore((s) =>
    conversation?.peerAddress ? s.frens[conversation.peerAddress] : undefined
  );
  const peerSocials = useProfilesStore((s) =>
    conversation?.peerAddress
      ? s.profiles[conversation.peerAddress]?.socials
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
            <ActivityIndicator style={{ marginBottom: 20 }} />
            <Text style={styles.chatPlaceholderText}>
              Opening your conversation
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
                    title:
                      "If you unblock this contact, they will be able to send you messages again.",
                    ...actionSheetColors(colorScheme),
                  },
                  (selectedIndex?: number) => {
                    if (selectedIndex === 0 && conversation?.peerAddress) {
                      blockPeer({
                        peerAddress: conversation.peerAddress,
                        blocked: false,
                        account: currentAccount(),
                      });
                      setBlockedPeerStatus(conversation.peerAddress, false);
                    }
                  }
                );
              }}
            />
          </View>
        )}
        {conversation && !isBlockedPeer && messagesCount === 0 && (
          <View>
            {profileData ? (
              <Recommendation
                address={conversation.peerAddress}
                recommendationData={profileData}
                embedInChat
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
                sendMessage(conversation, "👋");
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
    },
    cta: {
      alignSelf: "center",
      marginTop: 20,
    },
  });
};
