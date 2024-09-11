import logger from "@utils/logger";
import { FrameActionInputs } from "@xmtp/frames-client";
import { Image } from "expo-image";
import * as Linking from "expo-linking";
import { useCallback, useEffect, useRef, useState } from "react";
import { Platform, StyleSheet, View } from "react-native";
import { v4 as uuidv4 } from "uuid";

import FrameBottom from "./FrameBottom";
import FrameImage from "./FrameImage";
import config from "../../../config";
import { useCurrentAccount } from "../../../data/store/accountsStore";
import { cacheForMedia, fetchAndCacheMedia } from "../../../utils/cache/cache";
import { useConversationContext } from "../../../utils/conversation";
import { useExternalProvider } from "../../../utils/evm/external";
import {
  FrameButtonType,
  FrameToDisplay,
  FrameWithType,
  framesProxy,
  getFrameButtons,
  getFrameImage,
  getFramesClient,
  handleTxAction,
  validateFrame,
} from "../../../utils/frames";
import { MessageToDisplay } from "../Message/Message";

export default function FramePreview({
  initialFrame,
  message,
}: {
  initialFrame: FrameWithType;
  message: MessageToDisplay;
}) {
  const styles = useStyles();
  const conversation = useConversationContext("conversation");
  const setFrameTextInputFocused = useConversationContext(
    "setFrameTextInputFocused"
  );
  const account = useCurrentAccount() as string;
  const [postingActionForButton, setPostingActionForButton] = useState(
    undefined as undefined | number
  );
  const [firstFrameLoaded, setFirstFrameLoaded] = useState(false);
  const [firstImageRefreshed, setFirstImageRefreshed] = useState(false);
  const [frame, setFrame] = useState({
    ...initialFrame,
    frameImage: undefined,
    isInitialFrame: true,
    uniqueId: uuidv4(),
  } as FrameToDisplay);
  const [firstImageFailure, setFirstImageFailure] = useState(false);
  const buttons = getFrameButtons(frame);
  const textInput = frame.frameInfo?.textInput?.content;
  const [frameTextInputValue, setFrameTextInputValue] = useState("");
  const messageId = useRef(message.id);
  const fetchingInitialForMessageId = useRef(undefined as undefined | string);

  const { getExternalProvider } = useExternalProvider();

  // Components are recycled, let's fix when stuff changes
  if (message.id !== messageId.current) {
    messageId.current = message.id;
    setFirstFrameLoaded(false);
    setFirstImageRefreshed(false);
    setFrame({
      ...initialFrame,
      frameImage: undefined,
      isInitialFrame: true,
      uniqueId: uuidv4(),
    });
    setFirstImageFailure(false);
    setFrameTextInputValue("");
  }

  useEffect(() => {
    const handleInitialImage = async () => {
      if (
        frame.isInitialFrame &&
        !firstFrameLoaded &&
        !fetchingInitialForMessageId.current
      ) {
        fetchingInitialForMessageId.current = message.id;
        const initialFrameImage = getFrameImage(frame);
        // We don't display anything until the frame
        // initial image is loaded !
        if (!initialFrameImage) {
          setFirstFrameLoaded(true);
          return;
        }
        const proxiedInitialImage = framesProxy.mediaUrl(initialFrameImage);
        if (fetchingInitialForMessageId.current !== messageId.current) return;
        if (initialFrameImage.startsWith("data:")) {
          // These won't change so no cache to handle
          setFirstImageRefreshed(true);
          setFrame((s) => ({ ...s, frameImage: initialFrameImage }));
          setFirstFrameLoaded(true);
          return;
        } else if (Platform.OS === "web") {
          // No caching on web for now
          setFirstImageRefreshed(true);
          const prefetched = await Image.prefetch(
            proxiedInitialImage,
            "memory"
          );
          if (prefetched) {
            setFrame((s) => ({ ...s, frameImage: proxiedInitialImage }));
          } else {
            setFirstImageFailure(true);
          }
          setFirstFrameLoaded(true);
          return;
        }
        const initialImageCache = await cacheForMedia(proxiedInitialImage);
        if (!initialImageCache) {
          const cachedImage = await fetchAndCacheMedia(proxiedInitialImage);
          if (fetchingInitialForMessageId.current !== messageId.current) return;
          if (cachedImage) {
            setFirstImageRefreshed(true);
            setFrame((s) => ({ ...s, frameImage: cachedImage }));
          } else {
            setFirstImageFailure(true);
          }
          setFirstFrameLoaded(true);
        } else {
          setFrame((s) => ({ ...s, frameImage: initialImageCache }));
          setFirstFrameLoaded(true);
          if (fetchingInitialForMessageId.current !== messageId.current) return;
          // Now let's refresh
          const imageCache = await fetchAndCacheMedia(proxiedInitialImage);
          // Now let's display the new one
          setFrame((s) => ({
            ...s,
            frameImage: `${imageCache}?refreshed=true`,
          }));
          setFirstImageRefreshed(true);
        }
        fetchingInitialForMessageId.current = undefined;
      }
    };
    handleInitialImage()
      .then(() => {})
      .catch(() => {
        fetchingInitialForMessageId.current = undefined;
      });
  }, [firstFrameLoaded, frame, message.id]);

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
      let actionPostUrl =
        button.target || frame.frameInfo?.postUrl || initialFrame.url;
      try {
        const participantAccountAddresses: string[] = conversation.isGroup
          ? conversation.groupMembers || []
          : [account, conversation.peerAddress];
        const actionInput: FrameActionInputs = {
          frameUrl: actionPostUrl,
          buttonIndex: button.index,
          conversationTopic: message.topic,
          participantAccountAddresses,
          state: frame.frameInfo?.state,
        };
        if (textInput) {
          actionInput.inputText = frameTextInputValue;
        }
        const framesClient = await getFramesClient(account);
        let newFrameHasInput = false;
        if (
          button.action === "post" ||
          button.action === "tx" ||
          !button.action
        ) {
          const payload = await framesClient.signFrameAction(actionInput);

          if (button.action === "tx") {
            if (Platform.OS !== "web" || !config.enableTransactionFrames) {
              alert("Transaction frames are not supported yet.");
              throw new Error("Transaction frames not supported yet");
            }
            // For tx, we get the tx data from target, then trigger it, then do a POST action
            const externalProvider = await getExternalProvider();
            if (!externalProvider)
              throw new Error("Could not get an external wallet provider");

            const { buttonPostUrl, txHash } = await handleTxAction(
              frame,
              button,
              payload,
              externalProvider
            );

            payload.untrustedData.transactionId = txHash;
            actionPostUrl = buttonPostUrl;
          }

          const frameResponse = await framesProxy.post(actionPostUrl, payload);
          const validatedFrameResponse = validateFrame(frameResponse);
          if (
            !validatedFrameResponse ||
            validatedFrameResponse.type !== "XMTP_FRAME"
          ) {
            // error, let's fail
            setPostingActionForButton(undefined);
            return;
          }
          // We should display a new frame, let's load image first
          const uniqueId = uuidv4();
          const frameResponseImage = getFrameImage({
            ...validatedFrameResponse,
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
          const proxiedImage = framesProxy.mediaUrl(frameImage);
          const prefetched = await Image.prefetch(proxiedImage, "memory");
          if (!prefetched) {
            // couldn't load image, let's fail
            setPostingActionForButton(undefined);
            return;
          }
          newFrameHasInput =
            !!validatedFrameResponse.frameInfo?.textInput?.content;
          // Updating frame to display
          setFrame({
            ...validatedFrameResponse,
            isInitialFrame: false,
            frameImage: proxiedImage,
            type: "XMTP_FRAME",
            uniqueId,
          });
        } else if (button.action === "post_redirect") {
          const payload = await framesClient.signFrameAction(actionInput);
          const { redirectedTo } = await framesProxy.postRedirect(
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
        if (!newFrameHasInput) {
          setFrameTextInputFocused(false);
        }
      } catch (e: any) {
        logger.error(e);
      }
      setPostingActionForButton(undefined);
    },
    [
      account,
      conversation,
      frame,
      frameTextInputValue,
      getExternalProvider,
      initialFrame.url,
      message.topic,
      setFrameTextInputFocused,
      textInput,
    ]
  );

  // const shareFrame = useCallback(() => {
  //   navigate("ShareFrame", { frameURL: initialFrame.url });
  // }, [initialFrame.url]);

  const showBottom =
    (frame.type === "PREVIEW" && frame.extractedTags["og:title"]) ||
    buttons.length > 0 ||
    textInput;

  return (
    // <View
    //   style={[
    //     styles.frameWrapper,
    //     {
    //       display: firstFrameLoaded ? "flex" : "none",
    //     },
    //   ]}
    // >
    //   {initialFrame.type === "XMTP_FRAME" && (
    //     <View
    //       style={[
    //         styles.shareFrameWrapper,
    //         message.fromMe
    //           ? styles.shareFrameWrapperMe
    //           : styles.shareFrameWrapperOther,
    //       ]}
    //     >
    //       <TouchableOpacity style={styles.shareFrame} onPress={shareFrame}>
    //         <ActionButton
    //           picto="square.and.arrow.up"
    //           pictoStyle={{ top: -1.5 }} // Because the square & arrow doesn't look centered
    //         />
    //       </TouchableOpacity>
    //     </View>
    //   )}
    <View style={styles.frameContainer}>
      {!(frame.type === "PREVIEW" && firstImageFailure) && (
        <View
          style={{
            opacity:
              postingActionForButton !== undefined || !firstImageRefreshed
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
            useMemoryCache={!frame.isInitialFrame || Platform.OS === "web"}
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
    // </View>
  );
}

const useStyles = () => {
  return StyleSheet.create({
    frameWrapper: {
      paddingBottom: 0,
      flexDirection: "row",
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
