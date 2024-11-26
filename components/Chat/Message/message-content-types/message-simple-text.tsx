import {
  BubbleContainer,
  BubbleContentContainer,
} from "@/components/Chat/Message/components/message-bubble";
import { MessageLayout } from "@/components/Chat/Message/components/message-layout";
import { MessageText } from "@/components/Chat/Message/components/message-text";
import { useMessageContextStoreContext } from "@/components/Chat/Message/stores/message-store";
import { useSelect } from "@/data/store/storeHelpers";
import { DecodedMessage, TextCodec } from "@xmtp/react-native-sdk";
import { memo } from "react";

export const MessageSimpleText = memo(function MessageSimpleText(props: {
  message: DecodedMessage<[TextCodec]>;
}) {
  const { message } = props;

  const textContent = message.content();

  const { hasNextMessageInSeries, fromMe } = useMessageContextStoreContext(
    useSelect(["hasNextMessageInSeries", "fromMe"])
  );

  return (
    <MessageLayout>
      <BubbleContainer fromMe={fromMe}>
        <BubbleContentContainer
          fromMe={fromMe}
          hasNextMessageInSeries={hasNextMessageInSeries}
        >
          <MessageText inverted={fromMe}>{textContent}</MessageText>
        </BubbleContentContainer>
      </BubbleContainer>
    </MessageLayout>
  );
});
