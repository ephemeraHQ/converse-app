import { useConversationContext } from "@utils/conversation";
import { useCallback, useRef, useState } from "react";
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
  const messageId = useRef<string | undefined>(undefined);
  const tagsFetchedOnceForMessage = useConversationContext(
    "tagsFetchedOnceForMessage"
  );
  const account = useCurrentAccount() as string;
  const [framesForMessage, setFramesForMessage] = useState<{
    [messageId: string]: FrameWithType[];
  }>({
    [message.id]: useFramesStore
      .getState()
      .getFramesForURLs(message.converseMetadata?.frames || []),
  });

  const fetchTagsIfNeeded = useCallback(() => {
    if (!tagsFetchedOnceForMessage.current[message.id]) {
      tagsFetchedOnceForMessage.current[message.id] = true;
      fetchFramesForMessage(account, message).then(
        (frames: FramesForMessage) => {
          setFramesForMessage({ [frames.messageId]: frames.frames });
        }
      );
    }
  }, [account, message, tagsFetchedOnceForMessage]);

  // Components are recycled, let's fix when stuff changes
  if (message.id !== messageId.current) {
    messageId.current = message.id;
    fetchTagsIfNeeded();
    setFramesForMessage({
      [message.id]: useFramesStore
        .getState()
        .getFramesForURLs(message.converseMetadata?.frames || []),
    });
  }

  const framesToDisplay = framesForMessage[message.id] || [];

  return (
    <View>
      {framesToDisplay.map((frameToDisplay) => {
        return (
          <FramePreview
            messageId={message.id}
            messageTopic={message.topic}
            messageFromMe={message.fromMe}
            initialFrame={frameToDisplay}
            key={frameToDisplay.url}
          />
        );
      })}
    </View>
  );
}
