import { useSelect } from "@/stores/stores.utils";
import {
  BubbleContainer,
  BubbleContentContainer,
} from "@/features/conversation/conversation-message/conversation-message-bubble";
import { MessageText } from "@/features/conversation/conversation-message/conversation-message-text";
import { useMessageContextStoreContext } from "@/features/conversation/conversation-message/conversation-message.store-context";
import { shouldRenderBigEmoji } from "@/features/conversation/conversation-message/conversation-message.utils";
import { Text } from "@design-system/Text";
import { textSizeStyles } from "@design-system/Text/Text.styles";
import { VStack } from "@design-system/VStack";
import { DecodedMessage, TextCodec } from "@xmtp/react-native-sdk";
import { memo } from "react";

export const MessageSimpleText = memo(function MessageSimpleText(props: {
  message: DecodedMessage<TextCodec>;
}) {
  const { message } = props;

  const textContent = message.content();

  const { hasNextMessageInSeries, fromMe } = useMessageContextStoreContext(
    useSelect(["hasNextMessageInSeries", "fromMe"])
  );

  if (shouldRenderBigEmoji(textContent)) {
    return (
      <VStack
        style={{
          alignItems: fromMe ? "flex-end" : "flex-start",
        }}
      >
        <Text style={textSizeStyles["5xl"]}>{textContent}</Text>
      </VStack>
    );
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
