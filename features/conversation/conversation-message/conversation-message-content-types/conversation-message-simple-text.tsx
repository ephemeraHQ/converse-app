import {
  BubbleContainer,
  BubbleContentContainer,
} from "@/features/conversation/conversation-message/conversation-message-bubble";
import { MessageText } from "@/features/conversation/conversation-message/conversation-message-text";
import { useMessageContextStoreContext } from "@/features/conversation/conversation-message/conversation-message.store-context";
import { useSelect } from "@/data/store/storeHelpers";
import { DecodedMessage, TextCodec } from "@xmtp/react-native-sdk";
import { memo } from "react";
import { MessageBigEmoji } from "./conversation-message-big-emoji";
import { shouldRenderBigEmoji } from "@/features/conversation/conversation-message/conversation-message.utils";

export const MessageSimpleText = memo(function MessageSimpleText(props: {
  message: DecodedMessage<TextCodec>;
}) {
  const { message } = props;

  const textContent = message.content();

  const { hasNextMessageInSeries, fromMe } = useMessageContextStoreContext(
    useSelect(["hasNextMessageInSeries", "fromMe"])
  );

  if (shouldRenderBigEmoji(textContent)) {
    return <MessageBigEmoji message={message} />;
  }

  return (
    <BubbleContainer fromMe={fromMe}>
      <BubbleContentContainer
        fromMe={fromMe}
        hasNextMessageInSeries={hasNextMessageInSeries}
      >
        <MessageText inverted={fromMe}>{textContent}</MessageText>
      </BubbleContentContainer>
    </BubbleContainer>
  );
});
