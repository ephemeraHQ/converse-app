import { FramesClient } from "@xmtp/frames-client";
import { Image } from "expo-image";
import * as Linking from "expo-linking";
import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableHighlight,
  useColorScheme,
  View,
} from "react-native";
import { TouchableWithoutFeedback } from "react-native-gesture-handler";

import FrameLinkIcon from "../../assets/frameLink.svg";
import { useCurrentAccount } from "../../data/store/accountsStore";
import {
  backgroundColor,
  clickedItemBackgroundColor,
  messageInnerBubbleColor,
  myMessageInnerBubbleColor,
  textPrimaryColor,
  textSecondaryColor,
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
  const { conversation, setFrameInputFocused } = useConversationContext([
    "conversation",
    "setFrameInputFocused",
  ]);
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
  const textInput = undefined; // Until XMTP supports it
  // const textInput = frame.extractedTags["fc:frame:input:text"] as
  //   | string
  //   | undefined;
  const onButtonPress = useCallback(
    async (button: FrameButtonType) => {
      if (button.action === "link") {
        const link = getFrameButtonLinkTarget(frame, button.index);
        if (!link || !link.startsWith("https") || !Linking.canOpenURL(link))
          return;
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
        <TouchableWithoutFeedback
          onPress={() => {
            const initialFrameURL =
              initialFrame.extractedTags["xmtp:frame:post-url"];
            if (initialFrameURL && initialFrameURL.startsWith("https")) {
              Linking.openURL(initialFrameURL);
            }
          }}
        >
          <Image
            source={{ uri: frame.extractedTags["fc:frame:image"] }}
            contentFit="cover"
            style={[styles.frameImage, { opacity: posting ? 0.8 : 1 }]}
          />
        </TouchableWithoutFeedback>

        {(buttons.length > 0 || textInput) && (
          <View
            style={[
              styles.frameActions,
              {
                backgroundColor: message.fromMe
                  ? myMessageInnerBubbleColor(colorScheme)
                  : messageInnerBubbleColor(colorScheme),
              },
            ]}
          >
            {textInput && (
              <TextInput
                autoCorrect={false}
                autoComplete="off"
                autoCapitalize="none"
                style={styles.frameTextInput}
                onFocus={() => {
                  setFrameInputFocused(true);
                }}
                onBlur={() => {
                  setFrameInputFocused(false);
                }}
                placeholder={textInput}
              />
            )}
            {buttons.length > 0 &&
              buttons.map((button) => (
                <FrameButton
                  key={`${button.title}-${button.index}`}
                  posting={posting}
                  button={button}
                  fullWidth={buttons.length === 1}
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
  fullWidth: boolean;
};

const FrameButton = ({
  button,
  onPress,
  posting,
  fullWidth,
}: FrameButtonProps) => {
  const styles = useStyles();
  const colorScheme = useColorScheme();
  return (
    <TouchableHighlight
      underlayColor={clickedItemBackgroundColor(colorScheme)}
      onPress={posting ? undefined : onPress}
      style={[
        styles.frameButton,
        {
          marginRight: button.index % 2 === 1 && !fullWidth ? "4%" : 0,
          opacity: posting && posting !== button.index ? 0.6 : 1,
          width: fullWidth ? "100%" : "48%",
        },
      ]}
    >
      <View style={styles.frameButtonContent}>
        <Text style={styles.frameButtonText} numberOfLines={1}>
          {button.title}
        </Text>
        {(button.action === "post_redirect" || button.action === "link") && (
          <FrameLinkIcon
            color={textSecondaryColor(colorScheme)}
            fill={textSecondaryColor(colorScheme)}
            style={styles.frameButtonPicto}
          />
        )}
      </View>
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
    frameActions: {
      flexDirection: "row",
      flexWrap: "wrap",
      paddingTop: 3,
      paddingBottom: 6,
      paddingHorizontal: 8,
      borderBottomLeftRadius: 14,
      borderBottomRightRadius: 14,
    },
    frameButton: {
      borderRadius: 9,
      paddingHorizontal: 6,
      paddingVertical: 9,
      marginVertical: 4,
      backgroundColor: backgroundColor(colorScheme),
    },
    frameButtonContent: {
      flexDirection: "row",
      alignItems: "center",
      alignSelf: "center",
    },
    frameButtonPicto: {
      width: 10,
      height: 10,
      marginHorizontal: 7,
    },
    frameButtonText: {
      color: textPrimaryColor(colorScheme),
      fontSize: 12,
      flexShrink: 1,
    },
    frameTextInput: {
      backgroundColor: backgroundColor(colorScheme),
      padding: 4,
      borderRadius: 4,
      width: "100%",
      marginVertical: 4,
      fontSize: 12,
      paddingVertical: 9,
      paddingHorizontal: 6,
    },
  });
};
