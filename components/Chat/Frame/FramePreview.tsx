import { FrameActionInputs, OpenFramesProxy } from "@xmtp/frames-client";
import * as Linking from "expo-linking";
import { useCallback, useState } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import uuid from "react-native-uuid";

import { useCurrentAccount } from "../../../data/store/accountsStore";
import { useConversationContext } from "../../../utils/conversation";
import {
  FrameButtonType,
  FrameToDisplay,
  getFrameAspectRatio,
  getFrameButtonTarget,
  getFrameButtons,
  getFrameImage,
  getFramePostURL,
  getFrameTextInput,
  getFramesClient,
} from "../../../utils/frames";
import { navigate } from "../../../utils/navigation";
import ActionButton from "../ActionButton";
import { MessageToDisplay } from "../Message/Message";
import FrameBottom from "./FrameBottom";
import FrameImage from "./FrameImage";

type Props = {
  message: MessageToDisplay;
};

const framesProxy = new OpenFramesProxy();

export default function FramePreview({
  initialFrame,
  message,
}: {
  initialFrame: FrameToDisplay;
  message: MessageToDisplay;
}) {
  const styles = useStyles();
  const { conversation, setFrameTextInputFocused } = useConversationContext([
    "conversation",
    "setFrameTextInputFocused",
  ]);
  const account = useCurrentAccount() as string;
  const [posting, setPosting] = useState(undefined as undefined | number);
  const [imageLoading, setImageLoading] = useState(false);
  const [frame, setFrame] = useState({
    ...initialFrame,
    uniqueId: uuid.v4().toString(),
  });
  const buttons = getFrameButtons(frame);
  const textInput = getFrameTextInput(frame);
  const [frameTextInputValue, setFrameTextInputValue] = useState("");
  const onButtonPress = useCallback(
    async (button: FrameButtonType) => {
      if (button.action === "link") {
        const link = getFrameButtonTarget(frame, button.index);
        if (
          !link ||
          !link.startsWith("http") ||
          !(await Linking.canOpenURL(link))
        )
          return;
        Linking.openURL(link);
        return;
      }
      if (!conversation) return;
      setPosting(button.index);
      setImageLoading(true);
      const actionPostUrl =
        getFrameButtonTarget(frame, button.index) ||
        getFramePostURL(frame) ||
        initialFrame.url;
      try {
        const actionInput: FrameActionInputs = {
          frameUrl: actionPostUrl,
          buttonIndex: button.index,
          conversationTopic: message.topic,
          participantAccountAddresses: [account, conversation.peerAddress],
        };
        if (textInput) {
          actionInput.inputText = frameTextInputValue;
        }
        const framesClient = await getFramesClient(account);
        if (button.action === "post") {
          const payload = await framesClient.signFrameAction(actionInput);
          const frameResponse = await framesClient.proxy.post(
            actionPostUrl,
            payload
          );
          // post action will update frame
          setFrame({
            ...frameResponse,
            type: "XMTP_FRAME",
            uniqueId: uuid.v4().toString(),
          });
        } else if (button.action === "post_redirect") {
          const payload = await framesClient.signFrameAction(actionInput);
          const { redirectedTo } = await framesClient.proxy.postRedirect(
            actionPostUrl,
            payload
          );
          if (
            redirectedTo &&
            redirectedTo.startsWith("http") &&
            (await Linking.canOpenURL(redirectedTo))
          ) {
            Linking.openURL(redirectedTo);
          }
        }
        // Reset input
        setFrameTextInputValue("");
        setFrameTextInputFocused(false);
      } catch (e: any) {
        console.error(e);
      }
      setPosting(undefined);
    },
    [
      account,
      conversation,
      frame,
      frameTextInputValue,
      initialFrame.url,
      message.topic,
      setFrameTextInputFocused,
      textInput,
    ]
  );

  const shareFrame = useCallback(() => {
    navigate("ShareFrame", { frameURL: initialFrame.url });
  }, [initialFrame.url]);

  const showBottom =
    (frame.type === "PREVIEW" && frame.extractedTags["og:title"]) ||
    buttons.length > 0 ||
    textInput;
  const frameImage = getFrameImage(frame);
  const frameImageAspectRatio = getFrameAspectRatio(frame);

  return (
    <View style={styles.frameWrapper}>
      {initialFrame.type === "XMTP_FRAME" && (
        <View
          style={[
            styles.shareFrameWrapper,
            message.fromMe
              ? styles.shareFrameWrapperMe
              : styles.shareFrameWrapperOther,
          ]}
        >
          <TouchableOpacity style={styles.shareFrame} onPress={shareFrame}>
            <ActionButton
              picto="square.and.arrow.up"
              pictoStyle={{ top: -1.5 }} // Because the square & arrow doesn't look centered
            />
          </TouchableOpacity>
        </View>
      )}
      <View style={styles.frameContainer}>
        <View
          style={{
            opacity: imageLoading ? (message.fromMe ? 0.8 : 0.4) : 1,
          }}
        >
          <FrameImage
            frameImage={framesProxy.mediaUrl(frameImage)}
            initialFrameURL={initialFrame.url}
            uniqueId={frame.uniqueId}
            setImageLoading={setImageLoading}
            frameImageAspectRatio={frameImageAspectRatio}
          />
        </View>
        {showBottom && (
          <FrameBottom
            message={message}
            frame={frame}
            textInput={textInput}
            buttons={buttons}
            setFrameTextInputFocused={setFrameTextInputFocused}
            posting={posting}
            onButtonPress={onButtonPress}
            frameTextInputValue={frameTextInputValue}
            setFrameTextInputValue={setFrameTextInputValue}
          />
        )}
      </View>
    </View>
  );
}

const useStyles = () => {
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
    shareFrameWrapper: {
      width: 36,
      height: "100%",
      position: "absolute",
      top: 4,
      alignItems: "center",
      justifyContent: "center",
    },
    shareFrameWrapperMe: {
      left: -46,
    },
    shareFrameWrapperOther: {
      right: -46,
    },
    shareFrame: {
      width: 36,
      height: 36,
      top: 0,
      left: 0,
    },
  });
};
