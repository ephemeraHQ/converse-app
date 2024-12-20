import {
  BubbleContainer,
  BubbleContentContainer,
} from "@/features/conversation/conversation-message/conversation-message-bubble";
import { MessageText } from "@/features/conversation/conversation-message/conversation-message-text";
import { useMessageContextStoreContext } from "@/features/conversation/conversation-message/conversation-message.store-context";
import { useSelect } from "@/data/store/storeHelpers";
import { DecodedMessage, TextCodec } from "@xmtp/react-native-sdk";
import { memo } from "react";

export const MessageBigEmoji = memo(function MessageBigEmoji(props: {
  message: DecodedMessage<TextCodec>;
}) {
  const { message } = props;
  const textContent = message.content();

  const { hasNextMessageInSeries, fromMe } = useMessageContextStoreContext(
    useSelect(["hasNextMessageInSeries", "fromMe"])
  );

  return (
    <BubbleContainer fromMe={fromMe} transparent>
      <BubbleContentContainer
        fromMe={fromMe}
        hasNextMessageInSeries={hasNextMessageInSeries}
        noPadding
        transparent
      >
        <MessageText inverted={fromMe} isBigEmoji>
          {textContent}
        </MessageText>
      </BubbleContentContainer>
    </BubbleContainer>
  );
});
