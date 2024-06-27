import { useGroupConsent } from "@hooks/useGroupConsent";
import { useGroupMembers } from "@hooks/useGroupMembers";
import { useGroupName } from "@hooks/useGroupName";
import { useGroupQuery } from "@queries/useGroupQuery";
import { actionSheetColors, textPrimaryColor } from "@styles/colors";
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

import {
  useCurrentAccount,
  useSettingsStore,
} from "../../../data/store/accountsStore";
import { useConversationContext } from "../../../utils/conversation";
import { sendMessage } from "../../../utils/message";
import { consentToPeersOnProtocol } from "../../../utils/xmtpRN/conversations";
import ActivityIndicator from "../../ActivityIndicator/ActivityIndicator";
import Button from "../../Button/Button";
import { showActionSheetWithOptions } from "../../StateHandlers/ActionSheetStateHandler";

type Props = {
  messagesCount: number;
};

export function GroupChatPlaceholder({ messagesCount }: Props) {
  const { conversation, onReadyToFocus } = useConversationContext([
    "conversation",
    "isBlockedPeer",
    "onReadyToFocus",
  ]);
  const currentAccount = useCurrentAccount();
  const { data: group } = useGroupQuery(
    currentAccount ?? "",
    conversation?.topic ?? ""
  );
  const { consent } = useGroupConsent(conversation?.topic ?? "");
  const { groupName } = useGroupName(conversation?.topic ?? "");
  const { members } = useGroupMembers(conversation?.topic ?? "");
  const isBlockedGroup = consent === "denied";

  const colorScheme = useColorScheme();
  const styles = useStyles();
  const setPeersStatus = useSettingsStore((s) => s.setPeersStatus);
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

  const onUnblock = useCallback(() => {
    showActionSheetWithOptions(
      {
        options: ["Unblock", "Cancel"],
        cancelButtonIndex: 1,
        destructiveButtonIndex: isBlockedGroup ? undefined : 0,
        title:
          "If you unblock this contact, they will be able to send you messages again.",
        ...actionSheetColors(colorScheme),
      },
      (selectedIndex?: number) => {
        if (selectedIndex === 0 && conversation?.peerAddress) {
          const { peerAddress } = conversation;
          consentToPeersOnProtocol(
            currentAccount ?? "",
            [peerAddress],
            "allow"
          );
          setPeersStatus({ [peerAddress]: "consented" });
        }
      }
    );
  }, [
    colorScheme,
    conversation,
    currentAccount,
    isBlockedGroup,
    setPeersStatus,
  ]);

  return (
    <TouchableWithoutFeedback onPress={handleDismiss}>
      <View onLayout={onLayout} style={styles.chatPlaceholder}>
        {!conversation && (
          <View>
            <ActivityIndicator style={styles.activitySpinner} />
            <Text style={styles.chatPlaceholderText}>
              Opening your conversation
            </Text>
          </View>
        )}
        {conversation && isBlockedGroup && (
          <View>
            <Text style={styles.chatPlaceholderText}>
              This group is blocked
            </Text>
            <Button
              variant="secondary"
              picto="lock.open"
              title="Unblock"
              style={styles.cta}
              onPress={onUnblock}
            />
          </View>
        )}
        {conversation &&
          !isBlockedGroup &&
          messagesCount === 0 &&
          !groupCreatedByUser && (
            <View>
              <Text style={styles.chatPlaceholderText}>
                This is the beginning of your{"\n"}conversation with {groupName}
              </Text>

              <Button
                variant="secondary"
                picto="hand.wave"
                title="Say hi"
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