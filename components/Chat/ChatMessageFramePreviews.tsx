import { Image } from "expo-image";
import * as Linking from "expo-linking";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableHighlight,
  useColorScheme,
  View,
} from "react-native";
import { TouchableWithoutFeedback } from "react-native-gesture-handler";
import uuid from "react-native-uuid";

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
  FrameToDisplay,
  getFrameButtonLinkTarget,
  getFrameButtons,
  getMetadaTagsForMessage,
} from "../../utils/frames";
import { MessageToDisplay } from "./ChatMessage";

type Props = {
  message: MessageToDisplay;
};

export default function ChatMessageFramePreviews({ message }: Props) {
  const messageId = useRef(message.id);
  const tagsFetchedOnce = useRef(false);
  const account = useCurrentAccount() as string;
  const [famesToDisplay, setFramesToDisplay] = useState<FrameToDisplay[]>([]);

  const fetchTagsIfNeeded = useCallback(() => {
    if (!tagsFetchedOnce.current) {
      tagsFetchedOnce.current = true;
      getMetadaTagsForMessage(account, message).then(
        (frames: FrameToDisplay[]) => {
          if (frames.length > 0) {
            setFramesToDisplay(frames);
          }
        }
      );
    }
  }, [account, message]);

  // Components are recycled, let's fix when stuff changes
  if (message.id !== messageId.current) {
    messageId.current = message.id;
    tagsFetchedOnce.current = false;
    if (famesToDisplay.length > 0) {
      setFramesToDisplay([]);
    }
    fetchTagsIfNeeded();
  }

  useEffect(fetchTagsIfNeeded, [fetchTagsIfNeeded, message.id]);

  return (
    <View>
      {famesToDisplay.map((frameToDisplay) => {
        return (
          <ChatMessageFramePreview
            message={message}
            initialFrame={frameToDisplay}
            key={frameToDisplay.url}
          />
        );
      })}
    </View>
  );
}

const ChatMessageFramePreview = ({
  initialFrame,
  message,
}: {
  initialFrame: FrameToDisplay;
  message: MessageToDisplay;
}) => {
  const styles = useStyles();
  const { conversation, setFrameInputFocused } = useConversationContext([
    "conversation",
    "setFrameInputFocused",
  ]);
  const account = useCurrentAccount() as string;
  const [posting, setPosting] = useState(undefined as undefined | number);
  const [imageLoading, setImageLoading] = useState(false);
  const [frame, setFrame] = useState({
    ...initialFrame,
    uniqueId: uuid.v4().toString(),
  });
  const [frameUrl, setFrameUrl] = useState(
    frame.extractedTags["of:post_url"] ||
      frame.extractedTags["fc:frame:post_url"]
  );
  useEffect(() => {
    // If a new frame precises a new frame post url, we use it
    if (
      frame.extractedTags["of:post_url"] ||
      frame.extractedTags["fc:frame:post_url"]
    ) {
      setFrameUrl(
        frame.extractedTags["of:post_url"] ||
          frame.extractedTags["fc:frame:post_url"]
      );
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
        if (
          !link ||
          !link.startsWith("https") ||
          !(await Linking.canOpenURL(link))
        )
          return;
        Linking.openURL(link);
        return;
      }
      if (!conversation) return;
      setPosting(button.index);
      setImageLoading(true);
      try {
        if (button.action === "post") {
          const payload = await frame.framesClient.signFrameAction({
            frameUrl,
            buttonIndex: button.index,
            conversationTopic: message.topic,
            participantAccountAddresses: [account, conversation.peerAddress],
          });
          const frameResponse = await frame.framesClient.proxy.post(
            frameUrl,
            payload
          );
          // post action will update frame
          setFrame({
            ...frameResponse,
            type: "XMTP_FRAME",
            uniqueId: uuid.v4().toString(),
            framesClient: frame.framesClient,
          });
        } else if (button.action === "post_redirect") {
          const payload = await frame.framesClient.signFrameAction({
            frameUrl,
            buttonIndex: button.index,
            conversationTopic: message.topic,
            participantAccountAddresses: [account, conversation.peerAddress],
          });
          const { redirectedTo } = await frame.framesClient.proxy.postRedirect(
            frameUrl,
            payload
          );
          if (
            redirectedTo &&
            redirectedTo.startsWith("https") &&
            (await Linking.canOpenURL(redirectedTo))
          ) {
            Linking.openURL(redirectedTo);
          }
        }
      } catch (e: any) {
        console.error(e);
      }
      setPosting(undefined);
    },
    [account, conversation, frame, frameUrl, message.topic]
  );

  const showBottom =
    (frame.type === "PREVIEW" && frame.extractedTags["og:title"]) ||
    buttons.length > 0 ||
    textInput;
  const frameImage =
    frame.type === "PREVIEW"
      ? frame.extractedTags["og:image"]
      : frame.extractedTags["fc:frame:image"];

  return (
    <View style={styles.frameWrapper}>
      <View style={styles.frameContainer}>
        <View
          style={{
            opacity: imageLoading ? (message.fromMe ? 0.8 : 0.4) : 1,
          }}
        >
          <FrameImage
            frameImage={frame.framesClient.proxy.mediaUrl(frameImage)}
            initialFrameURL={initialFrame.url}
            uniqueId={frame.uniqueId}
            setImageLoading={setImageLoading}
          />
        </View>

        {showBottom && (
          <FrameBottom
            message={message}
            frame={frame}
            textInput={textInput}
            buttons={buttons}
            setFrameInputFocused={setFrameInputFocused}
            posting={posting}
            onButtonPress={onButtonPress}
          />
        )}
      </View>
    </View>
  );
};

const FrameBottom = ({
  message,
  frame,
  textInput,
  buttons,
  setFrameInputFocused,
  posting,
  onButtonPress,
}: {
  message: MessageToDisplay;
  frame: FrameToDisplay;
  textInput: string | undefined;
  buttons: FrameButtonType[];
  setFrameInputFocused: (f: boolean) => void;
  posting: number | undefined;
  onButtonPress: (b: FrameButtonType) => void;
}) => {
  const styles = useStyles();
  const colorScheme = useColorScheme();
  return (
    <View
      style={[
        styles.frameBottom,
        {
          backgroundColor: message.fromMe
            ? myMessageInnerBubbleColor(colorScheme)
            : messageInnerBubbleColor(colorScheme),
        },
      ]}
    >
      {frame.type === "XMTP_FRAME" && (
        <>
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
        </>
      )}
      {(frame.type === "FRAME" || frame.type === "PREVIEW") && (
        <Text
          style={[
            styles.frameBottomText,
            {
              color: message.fromMe ? "white" : textPrimaryColor(colorScheme),
              fontWeight: frame.type === "PREVIEW" ? "600" : "400",
            },
          ]}
        >
          {frame.type === "FRAME"
            ? "This frame is not supported by XMTP yet, please use a Farcaster client to interact with it."
            : frame.extractedTags["og:title"]}
        </Text>
      )}
    </View>
  );
};

const FrameImage = ({
  frameImage,
  initialFrameURL,
  uniqueId,
  setImageLoading,
}: {
  frameImage: string;
  initialFrameURL: string;
  uniqueId: string;
  setImageLoading: (loading: boolean) => void;
}) => {
  const styles = useStyles();
  if (!frameImage) return null;

  const frameImageURL = new URL(frameImage);
  frameImageURL.searchParams.set("converseRequestId", uniqueId);

  return (
    <TouchableWithoutFeedback
      onPress={() => {
        if (initialFrameURL && initialFrameURL.startsWith("https")) {
          Linking.openURL(initialFrameURL);
        }
      }}
    >
      <Image
        // Adding a uniqueId so when a new frame comes in
        // we always reload the image and don't get stale image
        // from cache
        source={{ uri: frameImageURL.toString() }}
        contentFit="cover"
        // Also disable cache so we always refetch the initial image
        cachePolicy="none"
        style={styles.frameImage}
        onLoadEnd={() => {
          setImageLoading(false);
        }}
      />
    </TouchableWithoutFeedback>
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
    frameImage: {
      aspectRatio: 1.91,
      width: "100%",
    },
    frameBottom: {
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
    frameBottomText: {
      paddingHorizontal: 4,
      paddingVertical: 8,
      fontSize: 15,
    },
  });
};
