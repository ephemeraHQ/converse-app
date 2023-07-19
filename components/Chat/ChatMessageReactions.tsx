import { ContentTypeReaction } from "@xmtp/content-type-reaction";
import { useCallback, useContext } from "react";
import {
  ColorSchemeName,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  useColorScheme,
  View,
} from "react-native";

import { AppContext } from "../../data/store/context";
import {
  actionSheetColors,
  messageBubbleColor,
  textSecondaryColor,
} from "../../utils/colors";
import { getMessageReactions } from "../../utils/reactions";
import { shortAddress } from "../../utils/str";
import { showActionSheetWithOptions } from "../StateHandlers/ActionSheetStateHandler";
import { MessageToDisplay } from "./ChatMessage";

type Props = {
  message: MessageToDisplay;
  sendMessage: (content: string, contentType?: string) => Promise<void>;
};

export default function ChatMessageReactions({ message, sendMessage }: Props) {
  const colorScheme = useColorScheme();
  const styles = getStyles(colorScheme);
  const { state } = useContext(AppContext);
  const reactions = getMessageReactions(message);
  const reactionsList = Object.values(reactions).sort(
    (r1, r2) => r1.sent - r2.sent
  );
  const showReactionsActionsSheet = useCallback(() => {
    const methods: any = {};
    reactionsList.forEach((r) => {
      const peerAddress = r.senderAddress;
      const fromMe =
        peerAddress.toLowerCase() === state.xmtp.address?.toLowerCase();
      const socials = state.profiles[peerAddress]?.socials;
      const ensName = socials?.ensNames?.find((e) => e.isPrimary)?.name;
      const unsDomain = socials?.unstoppableDomains?.find(
        (d) => d.isPrimary
      )?.domain;
      const peer = ensName || unsDomain || shortAddress(peerAddress);
      methods[`${r.content} ${fromMe ? "you - tap to remove" : peer}`] = () => {
        if (!fromMe) return;
        sendMessage(
          JSON.stringify({
            reference: message.id,
            action: "removed",
            content: r.content,
            schema: "unicode",
          }),
          ContentTypeReaction.toString()
        );
      };
    });
    methods["Back"] = () => {};
    const isAttachment = message.contentType.startsWith(
      "xmtp.org/remoteStaticAttachment:"
    );

    const options = Object.keys(methods);

    showActionSheetWithOptions(
      {
        options,
        title: isAttachment ? "Image" : message.content,
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
    message.content,
    message.contentType,
    message.id,
    reactionsList,
    sendMessage,
    state.profiles,
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
            {reactionsList.map((r) => r.content)}
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
      borderColor: "white",
      borderRadius: 30,
      flexDirection: "row",
    },
    emojis: {
      fontSize: 15,
    },
    count: {
      fontSize: 15,
      color: textSecondaryColor(colorScheme),
      marginLeft: 5,
    },
  });
