import { useCallback } from "react";
import {
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  useColorScheme,
  View,
} from "react-native";

import {
  useCurrentAccount,
  useProfilesStore,
} from "../../data/store/accountsStore";
import { isAttachmentMessage } from "../../utils/attachment";
import {
  actionSheetColors,
  backgroundColor,
  messageBubbleColor,
  textSecondaryColor,
} from "../../utils/colors";
import { useConversationContext } from "../../utils/conversation";
import { getPreferredName } from "../../utils/profile";
import {
  MessageReaction,
  getReactionContent,
  removeReactionFromMessage,
} from "../../utils/reactions";
import { showActionSheetWithOptions } from "../StateHandlers/ActionSheetStateHandler";
import { MessageToDisplay } from "./ChatMessage";

type Props = {
  message: MessageToDisplay;
  reactions: {
    [senderAddress: string]: MessageReaction;
  };
};

export default function ChatMessageReactions({ message, reactions }: Props) {
  const { conversation } = useConversationContext(["conversation"]);
  const colorScheme = useColorScheme();
  const styles = useStyles();
  const userAddress = useCurrentAccount();
  const profiles = useProfilesStore((state) => state.profiles);
  const reactionsList = Object.values(reactions).sort(
    (r1, r2) => r1.sent - r2.sent
  );
  const showReactionsActionsSheet = useCallback(() => {
    const methods: any = {};
    reactionsList.forEach((r) => {
      const peerAddress = r.senderAddress;
      const fromMe = peerAddress.toLowerCase() === userAddress?.toLowerCase();
      const socials = profiles[peerAddress]?.socials;
      const peer = getPreferredName({
        lensHandle: null,
        userName: socials?.userNames?.find((e) => e.isPrimary)?.name || null,
        ensName: socials?.ensNames?.find((e) => e.isPrimary)?.name || null,
        unsDomain:
          socials?.unstoppableDomains?.find((d) => d.isPrimary)?.domain || null,
        peerAddress,
        preferLensHandle: false,
      });
      methods[
        `${getReactionContent(r)} ${fromMe ? "you - tap to remove" : peer}`
      ] = () => {
        if (!fromMe || !conversation) return;
        removeReactionFromMessage(conversation, message, r.content);
      };
    });
    methods["Back"] = () => {};
    const isAttachment = isAttachmentMessage(message.contentType);

    const options = Object.keys(methods);

    showActionSheetWithOptions(
      {
        options,
        title: isAttachment ? "📎 Media" : message.content,
        cancelButtonIndex: options.indexOf("Back"),
        ...actionSheetColors(colorScheme),
      },
      (selectedIndex?: number) => {
        if (selectedIndex === undefined) return;
        const method = (methods as any)[options[selectedIndex]];
        if (method) {
          method();
        }
      }
    );
  }, [
    reactionsList,
    message,
    colorScheme,
    userAddress,
    profiles,
    conversation,
  ]);
  if (reactionsList.length === 0) return null;
  return (
    <View
      style={[
        styles.reactionsWrapper,
        { justifyContent: message.fromMe ? "flex-end" : "flex-start" },
      ]}
    >
      <TouchableWithoutFeedback onPress={showReactionsActionsSheet}>
        <View
          style={[
            styles.reactionsContainer,
            { marginRight: message.fromMe ? 10 : 0 },
            { marginLeft: message.fromMe ? 0 : 10 },
          ]}
        >
          <Text style={styles.emojis}>
            {[...new Set(reactionsList.map((r) => getReactionContent(r)))]}
          </Text>
          {reactionsList.length > 1 && (
            <Text style={styles.count}>{reactionsList.length}</Text>
          )}
        </View>
      </TouchableWithoutFeedback>
    </View>
  );
}

const useStyles = () => {
  const colorScheme = useColorScheme();
  return StyleSheet.create({
    reactionsWrapper: {
      flexBasis: "100%",
      flexDirection: "row",
      justifyContent: "flex-end",
      marginTop: -5,
    },
    reactionsContainer: {
      backgroundColor: messageBubbleColor(colorScheme),
      paddingVertical: 6,
      paddingHorizontal: 10,
      borderWidth: 1,
      borderColor: backgroundColor(colorScheme),
      borderRadius: 30,
      flexDirection: "row",
    },
    emojis: {
      fontSize: 15,
      lineHeight: 18.5,
    },
    count: {
      fontSize: 15,
      color: textSecondaryColor(colorScheme),
      marginLeft: 5,
    },
  });
};
