import { FramesClient } from "@xmtp/frames-client";
import { Image } from "expo-image";
import * as Linking from "expo-linking";
import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  StyleSheet,
  Text,
  TouchableHighlight,
  useColorScheme,
  View,
} from "react-native";

import { useCurrentAccount } from "../../data/store/accountsStore";
import {
  backgroundColor,
  clickedItemBackgroundColor,
  messageInnerBubbleColor,
  myMessageInnerBubbleColor,
  textPrimaryColor,
} from "../../utils/colors";
import { useConversationContext } from "../../utils/conversation";
import {
  FrameButtonType,
  TagsForURL,
  getFrameButtonLinkTarget,
  getFrameButtons,
  getFramesClient,
  getMetadaTagsForMessage,
} from "../../utils/frames";
import { MessageToDisplay } from "./ChatMessage";

type Props = {
  message: MessageToDisplay;
};

export default function ChatMessageFramePreviews({ message }: Props) {
  const [tagsForURLs, setTagsForURLs] = useState<TagsForURL[]>([]);

  useEffect(() => {
    getMetadaTagsForMessage(message).then(setTagsForURLs);
  }, [message]);

  return (
    <View>
      {tagsForURLs.map((tagsForURL) => {
        if (tagsForURL.type === "FRAME" || tagsForURL.type === "XMTP_FRAME") {
          return (
            <ChatMessageFramePreview
              message={message}
              initialFrame={tagsForURL}
              key={tagsForURL.url}
            />
          );
        }
        return null;
      })}
    </View>
  );
}

const ChatMessageFramePreview = ({
  initialFrame,
  message,
}: {
  initialFrame: TagsForURL;
  message: MessageToDisplay;
}) => {
  const styles = useStyles();
  const { conversation } = useConversationContext(["conversation"]);
  const account = useCurrentAccount() as string;
  const colorScheme = useColorScheme();
  const [posting, setPosting] = useState(undefined as undefined | number);
  const [frame, setFrame] = useState(initialFrame);
  const [frameUrl, setFrameUrl] = useState(
    frame.extractedTags["xmtp:frame:post-url"]
  );
  useEffect(() => {
    // If a new frame precises a new frame post url, we use it
    if (frame.extractedTags["xmtp:frame:post-url"]) {
      setFrameUrl(frame.extractedTags["xmtp:frame:post-url"]);
    }
  }, [frame.extractedTags]);
  const buttons = getFrameButtons(frame);
  const onButtonPress = useCallback(
    async (button: FrameButtonType) => {
      if (button.action === "link") {
        const link = getFrameButtonLinkTarget(frame, button.index);
        if (!link || !Linking.canOpenURL(link)) return;
        Linking.openURL(link);
        return;
      } else if (button.action === "post_redirect") {
        Alert.alert("This frame action is not supported yet");
        return;
      }
      if (!conversation) return;
      setPosting(button.index);
      try {
        const client = await getFramesClient(account);
        const payload = await client.signFrameAction({
          frameUrl,
          buttonIndex: button.index,
          conversationTopic: message.topic,
          participantAccountAddresses: [account, conversation.peerAddress],
        });
        const frameResponse = await FramesClient.postToFrame(frameUrl, payload);
        switch (button.action) {
          case "post":
            // post action will update frame
            setFrame({ ...frameResponse, type: "XMTP_FRAME" });
            break;

          // case "post_redirect":
          //   console.log("IT WAS A POST_REDIRECT", frameResponse);
          //   // post_redirect action will redirect depending on response
          //   break;

          default:
            break;
        }
      } catch (e: any) {
        console.error(e);
      }
      setPosting(undefined);
    },
    [account, conversation, frame, frameUrl, message.topic]
  );
  return (
    <View style={styles.frameWrapper}>
      <View style={styles.frameContainer}>
        <Image
          source={{ uri: frame.extractedTags["fc:frame:image"] }}
          contentFit="cover"
          style={[styles.frameImage, { opacity: posting ? 0.8 : 1 }]}
        />
        {buttons.length > 0 && (
          <View
            style={[
              styles.frameButtons,
              {
                backgroundColor: message.fromMe
                  ? myMessageInnerBubbleColor(colorScheme)
                  : messageInnerBubbleColor(colorScheme),
              },
            ]}
          >
            {buttons.map((button) => (
              <FrameButton
                key={`${button.title}-${button.index}`}
                posting={posting}
                button={button}
                onPress={() => setTimeout(() => onButtonPress(button), 10)}
              />
            ))}
          </View>
        )}
      </View>
    </View>
  );
};

type FrameButtonProps = {
  button: FrameButtonType;
  onPress: () => void;
  posting: number | undefined;
};

const FrameButton = ({ button, onPress, posting }: FrameButtonProps) => {
  const styles = useStyles();
  const colorScheme = useColorScheme();
  return (
    <TouchableHighlight
      underlayColor={clickedItemBackgroundColor(colorScheme)}
      onPress={posting ? undefined : onPress}
      style={[
        styles.frameButton,
        { marginRight: button.index % 2 === 1 ? "4%" : 0 },
        { opacity: posting && posting !== button.index ? 0.6 : 1 },
      ]}
    >
      <Text style={styles.frameButtonText} numberOfLines={1}>
        {button.title}
      </Text>
    </TouchableHighlight>
  );
};

const useStyles = () => {
  const colorScheme = useColorScheme();
  return StyleSheet.create({
    frameWrapper: {
      padding: 4,
      paddingBottom: 0,
    },
    frameContainer: {
      borderTopLeftRadius: 14,
      borderTopRightRadius: 14,
      width: "100%",
      overflow: "hidden",
    },
    frameImage: { aspectRatio: 1.91, width: "100%" },
    frameButtons: {
      flexDirection: "row",
      flexWrap: "wrap",
      paddingTop: 3,
      paddingBottom: 6,
      paddingHorizontal: 8,
      borderBottomLeftRadius: 14,
      borderBottomRightRadius: 14,
    },
    frameButton: {
      borderRadius: 4,
      paddingHorizontal: 6,
      paddingVertical: 4,
      marginVertical: 4,
      width: "48%",
      backgroundColor: backgroundColor(colorScheme),
    },
    frameButtonText: {
      textAlign: "center",
      color: textPrimaryColor(colorScheme),
      fontSize: 15,
    },
  });
};
