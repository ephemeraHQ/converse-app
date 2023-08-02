import { useCallback, useContext } from "react";
import {
  ColorSchemeName,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  useColorScheme,
  View,
} from "react-native";

import { AppContext } from "../../data/deprecatedStore/context";
import { useProfilesStore } from "../../data/store/accountsStore";
import { isAttachmentMessage } from "../../utils/attachment";
import {
  actionSheetColors,
  backgroundColor,
  messageBubbleColor,
  textSecondaryColor,
} from "../../utils/colors";
import {
  MessageReaction,
  getReactionContent,
  removeReactionFromMessage,
} from "../../utils/reactions";
import { shortAddress } from "../../utils/str";
import { showActionSheetWithOptions } from "../StateHandlers/ActionSheetStateHandler";
import { MessageToDisplay } from "./ChatMessage";

type Props = {
  message: MessageToDisplay;
  reactions: {
    [senderAddress: string]: MessageReaction;
  };
  sendMessage: (
    content: string,
    contentType?: string,
    contentFallback?: string
  ) => Promise<void>;
};

export default function ChatMessageReactions({
  message,
  reactions,
  sendMessage,
}: Props) {
  const colorScheme = useColorScheme();
  const styles = getStyles(colorScheme);
  const { state } = useContext(AppContext);
  const profiles = useProfilesStore((state) => state.profiles);
  const reactionsList = Object.values(reactions).sort(
    (r1, r2) => r1.sent - r2.sent
  );
  const showReactionsActionsSheet = useCallback(() => {
    const methods: any = {};
    reactionsList.forEach((r) => {
      const peerAddress = r.senderAddress;
      const fromMe =
        peerAddress.toLowerCase() === state.xmtp.address?.toLowerCase();
      const socials = profiles[peerAddress]?.socials;
      const ensName = socials?.ensNames?.find((e) => e.isPrimary)?.name;
      const unsDomain = socials?.unstoppableDomains?.find(
        (d) => d.isPrimary
      )?.domain;
      const peer = ensName || unsDomain || shortAddress(peerAddress);
      methods[
        `${getReactionContent(r)} ${fromMe ? "you - tap to remove" : peer}`
      ] = () => {
        if (!fromMe) return;
        removeReactionFromMessage(message, r.content, sendMessage);
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
    colorScheme,
    message,
    reactionsList,
    sendMessage,
    profiles,
    state.xmtp.address,
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

const getStyles = (colorScheme: ColorSchemeName) =>
  StyleSheet.create({
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
