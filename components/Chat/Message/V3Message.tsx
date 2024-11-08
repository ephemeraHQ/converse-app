import { useGroupMessages } from "@queries/useGroupMessages";
import { isAllEmojisAndMaxThree } from "@utils/messageContent";
import { TextMessage } from "./TextMessage";
import { getMessageContentType } from "@utils/xmtpRN/contentTypes";
import { memo, useMemo } from "react";
import { hasPreviousMessageInSeries } from "../../../features/conversations/utils/hasPreviousMessageInSeries";
import { hasNextMessageInSeries } from "../../../features/conversations/utils/hasNextMessageInSeries";
import { messageFromCurrentUser } from "../../../features/conversations/utils/messageFromCurrentUser";
import { isLatestSettledFromCurrentUser } from "../../../features/conversations/utils/isLatestSettledFromCurrentUser";
import { isLatestMessageSettledFromPeer } from "../../../features/conversations/utils/isLatestMessageSettledFromPeer";
import { messageShouldShowDateChange } from "../../../features/conversations/utils/messageShouldShowDateChange";
import { ChatGroupUpdatedMessage } from "../ChatGroupUpdatedMessage";
import { GroupUpdatedContent } from "@xmtp/react-native-sdk";
import { V3MessageToDisplay } from "../../../features/conversations/Messages.types";
import { VStack } from "@design-system/VStack";

type V3MessageProps = {
  item: string;
  index: number;
  currentAccount: string;
  topic: string;
};

export const V3Message = memo(
  ({ item, index, currentAccount, topic }: V3MessageProps) => {
    const { data: messages } = useGroupMessages(currentAccount, topic);
    const message = messages?.byId[item];
    // Messages are inverted in the list
    const previousMessage = messages?.byId[index + 1];
    const nextMessage = messages?.byId[index - 1];

    const messageToDisplay: V3MessageToDisplay = useMemo(() => {
      return {
        message,
        hasPreviousMessageInSeries: hasPreviousMessageInSeries({
          currentMessage: message,
          previousMessage,
        }),
        hasNextMessageInSeries: hasNextMessageInSeries({
          currentMessage: message,
          nextMessage,
        }),
        dateChange: messageShouldShowDateChange({
          message,
          previousMessage,
        }),
        fromMe: messageFromCurrentUser({
          message,
          currentAccount,
        }),
        isLatestSettledFromMe: isLatestSettledFromCurrentUser({
          message,
          currentAccount,
        }),
        isLatestSettledFromPeer: isLatestMessageSettledFromPeer({
          message,
          currentAccount,
          nextMessage,
        }),
        isLoadingAttachment: undefined,
        nextMessageIsLoadingAttachment: undefined,
      };
    }, [message, previousMessage, nextMessage, currentAccount]);

    const content = useMemo(() => {
      try {
        return message?.content();
      } catch {
        return message?.fallback ?? "";
      }
    }, [message]);

    if (!message) return null;

    const contentType = getMessageContentType(message?.contentTypeId);
    switch (contentType) {
      case "groupUpdated":
        return (
          <VStack>
            <ChatGroupUpdatedMessage
              content={content as unknown as GroupUpdatedContent}
            />
          </VStack>
        );
      case "text":
        const textContent = content as string;
        const hideBackground = isAllEmojisAndMaxThree(textContent as string);
        return (
          <VStack>
            <TextMessage
              fromMe={messageToDisplay.fromMe}
              hideBackground={hideBackground}
              content={(content as string) + index}
            />
          </VStack>
        );

      default:
        return (
          <VStack>
            <TextMessage
              fromMe={messageToDisplay.fromMe}
              hideBackground={false}
              content={contentType + message.deliveryStatus + index}
            />
          </VStack>
        );
    }
  }
);
