import {
  BubbleContainer,
  BubbleContentContainer,
} from "@/features/conversation/conversation-message/conversation-message-bubble";
import { MessageText } from "@/features/conversation/conversation-message/conversation-message-text";
import { useMessageContextStoreContext } from "@/features/conversation/conversation-message/conversation-message.store-context";
import { useSelect } from "@/data/store/storeHelpers";
import { DecodedMessage, TextCodec } from "@xmtp/react-native-sdk";
import { memo } from "react";
import { shouldRenderBigEmoji } from "@/features/conversation/conversation-message/conversation-message.utils";
import { VStack } from "@design-system/VStack";
import { Text } from "@design-system/Text";
import { textSizeStyles } from "@design-system/Text/Text.styles";
import { useAppTheme } from "@theme/useAppTheme";

export const MessageSimpleText = memo(function MessageSimpleText(props: {
  message: DecodedMessage<TextCodec>;
}) {
  const { message } = props;

  const { theme } = useAppTheme();

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
        <Text
          style={{
            ...textSizeStyles.xxl,
            color: fromMe
              ? theme.colors.text.inverted.primary
              : theme.colors.text.primary,
          }}
        >
          {textContent}
        </Text>
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
