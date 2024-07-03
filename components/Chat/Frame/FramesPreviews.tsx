import { useCallback, useEffect, useRef, useState } from "react";
import { View } from "react-native";

import FramePreview from "./FramePreview";
import { useCurrentAccount } from "../../../data/store/accountsStore";
import { useFramesStore } from "../../../data/store/framesStore";
import {
  FrameWithType,
  FramesForMessage,
  fetchFramesForMessage,
} from "../../../utils/frames";
import { MessageToDisplay } from "../Message/Message";

type Props = {
  message: MessageToDisplay;
};

export default function FramesPreviews({ message }: Props) {
  const messageId = useRef(message.id);
  const tagsFetchedOnce = useRef(false);
  const account = useCurrentAccount() as string;
  const [framesForMessage, setFramesForMessage] = useState<{
    [messageId: string]: FrameWithType[];
  }>({
    [message.id]: useFramesStore
      .getState()
      .getFramesForURLs(message.converseMetadata?.frames || []),
  });

  const fetchTagsIfNeeded = useCallback(() => {
    if (!tagsFetchedOnce.current) {
      tagsFetchedOnce.current = true;
      fetchFramesForMessage(account, message).then(
        (frames: FramesForMessage) => {
          // Call is async and we have cell recycling so make sure
          // we're still on the same message as before
          setFramesForMessage({ [frames.messageId]: frames.frames });
        }
      );
    }
  }, [account, message]);

  // Components are recycled, let's fix when stuff changes
  if (message.id !== messageId.current) {
    messageId.current = message.id;
    tagsFetchedOnce.current = false;
    fetchTagsIfNeeded();
    setFramesForMessage({
      [message.id]: useFramesStore
        .getState()
        .getFramesForURLs(message.converseMetadata?.frames || []),
    });
  }

  useEffect(fetchTagsIfNeeded, [fetchTagsIfNeeded, message.id]);

  const framesToDisplay = framesForMessage[message.id] || [];

  return (
    <View>
      {framesToDisplay.map((frameToDisplay) => {
        return (
          <FramePreview
            message={message}
            initialFrame={frameToDisplay}
            key={frameToDisplay.url}
          />
        );
      })}
    </View>
  );
}
