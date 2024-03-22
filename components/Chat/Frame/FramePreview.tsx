import { FrameActionInputs, OpenFramesProxy } from "@xmtp/frames-client";
import { Image } from "expo-image";
import * as Linking from "expo-linking";
import { useCallback, useEffect, useState } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import uuid from "react-native-uuid";

import { useCurrentAccount } from "../../../data/store/accountsStore";
import { useConversationContext } from "../../../utils/conversation";
import {
  FrameButtonType,
  FrameToDisplay,
  FrameWithType,
  getFrameButtons,
  getFrameImage,
  getFramesClient,
} from "../../../utils/frames";
import { navigate } from "../../../utils/navigation";
import ActionButton from "../ActionButton";
import { MessageToDisplay } from "../Message/Message";
import FrameBottom from "./FrameBottom";
import FrameImage from "./FrameImage";

const framesProxy = new OpenFramesProxy();

export default function FramePreview({
  initialFrame,
  message,
}: {
  initialFrame: FrameWithType;
  message: MessageToDisplay;
}) {
  const styles = useStyles();
  const { conversation, setFrameTextInputFocused } = useConversationContext([
    "conversation",
    "setFrameTextInputFocused",
  ]);
  const account = useCurrentAccount() as string;
  const [postingActionForButton, setPostingActionForButton] = useState(
    undefined as undefined | number
  );
  const [firstFrameLoaded, setFirstFrameLoaded] = useState(false);
  const [frame, setFrame] = useState({
    ...initialFrame,
    initialImageRefreshed: false,
    frameImage: getFrameImage(initialFrame)
      ? framesProxy.mediaUrl(getFrameImage(initialFrame) as string)
      : undefined,
    isInitialFrame: true,
    uniqueId: uuid.v4().toString(),
  } as FrameToDisplay);
  const [firstImageFailure, setFirstImageFailure] = useState(false);
  const buttons = getFrameButtons(frame);
  const textInput = frame.frameInfo?.textInput?.content;
  const [frameTextInputValue, setFrameTextInputValue] = useState("");

  useEffect(() => {
    const handleInitialImage = async () => {
      if (frame.isInitialFrame && !firstFrameLoaded) {
        // We don't display anything until the frame
        // initial image is loaded !
        if (!frame.frameImage) {
          setFirstFrameLoaded(true);
          return;
        }
        const prefetched = await Image.prefetch(
          frame.frameImage,
          "memory-disk"
        );
        setFirstFrameLoaded(true);
        if (!prefetched) {
          setFirstImageFailure(true);
        }
      }
    };
    handleInitialImage();
  }, [firstFrameLoaded, frame.frameImage, frame.isInitialFrame]);

  const onButtonPress = useCallback(
    async (button: FrameButtonType) => {
      if (button.action === "link") {
        const link = button.target;
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
      setPostingActionForButton(button.index);
      const actionPostUrl =
        button.target || frame.frameInfo?.postUrl || initialFrame.url;
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
        if (button.action === "post" || !button.action) {
          const payload = await framesClient.signFrameAction(actionInput);
          const frameResponse = await framesClient.proxy.post(
            actionPostUrl,
            payload
          );
          // We should display a new frame, let's load image first
          const uniqueId = uuid.v4().toString();
          const frameResponseImage = getFrameImage({
            ...frameResponse,
            type: "XMTP_FRAME",
          });
          if (!frameResponseImage) {
            // couldn't load image, let's fail
            setPostingActionForButton(undefined);
            return;
          }
          const frameImageURL = new URL(frameResponseImage);
          frameImageURL.searchParams.set("converseRequestId", uniqueId);
          const frameImage = frameImageURL.toString();
          const prefetched = await Image.prefetch(frameImage, "memory");
          if (!prefetched) {
            // couldn't load image, let's fail
            setPostingActionForButton(undefined);
            return;
          }
          // Updating frame to display
          setFrame({
            ...frameResponse,
            isInitialFrame: false,
            frameImage,
            type: "XMTP_FRAME",
            uniqueId,
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
      setPostingActionForButton(undefined);
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

  return (
    <View
      style={[
        styles.frameWrapper,
        {
          display: firstFrameLoaded ? "flex" : "none",
        },
      ]}
    >
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
        {!(frame.type === "PREVIEW" && firstImageFailure) && (
          <View
            style={{
              opacity:
                postingActionForButton !== undefined
                  ? message.fromMe
                    ? 0.8
                    : 0.4
                  : 1,
            }}
          >
            <FrameImage
              frameImage={frame.frameImage}
              frameImageAspectRatio={
                frame.frameInfo?.image?.aspectRatio || "1.91.1"
              }
              linkToOpen={initialFrame.url}
            />
          </View>
        )}

        {showBottom && (
          <FrameBottom
            message={message}
            frame={frame}
            textInput={textInput}
            buttons={buttons}
            setFrameTextInputFocused={setFrameTextInputFocused}
            postingActionForButton={postingActionForButton}
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
