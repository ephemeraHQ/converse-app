import { MessageSpaceBetweenMessages } from "@/features/conversation/conversation-message/conversation-message-space-between-messages";
import { MessageId } from "@xmtp/react-native-sdk";
import { ReactElement, memo } from "react";
import { FlatListProps, Platform } from "react-native";
import Animated, { AnimatedProps } from "react-native-reanimated";

export const ConversationMessagesList = memo(function ConversationMessagesList(
  props: Omit<
    AnimatedProps<FlatListProps<MessageId>>,
    "renderItem" | "data"
  > & {
    messageIds: MessageId[];
    renderMessage: (args: {
      messageId: MessageId;
      index: number;
    }) => ReactElement;
  }
) {
  const { messageIds, renderMessage, ...rest } = props;

  return (
    // @ts-ignore
    <Animated.FlatList
      inverted
      data={messageIds}
      renderItem={({ item, index }) =>
        renderMessage({
          messageId: item,
          index,
        })
      }
      keyboardDismissMode="interactive"
      automaticallyAdjustContentInsets={false}
      contentInsetAdjustmentBehavior="never"
      keyExtractor={keyExtractor}
      keyboardShouldPersistTaps="handled"
      ItemSeparatorComponent={() => <MessageSpaceBetweenMessages />}
      showsVerticalScrollIndicator={Platform.OS === "ios"} // Size glitch on Android
      pointerEvents="auto"
      /**
       * Causes a glitch on Android, no sure we need it for now
       */
      // maintainVisibleContentPosition={{
      //   minIndexForVisible: 0,
      //   autoscrollToTopThreshold: 100,
      // }}
      // estimatedListSize={Dimensions.get("screen")}
      {...rest}
    />
  );
});

const keyExtractor = (messageId: MessageId) => messageId;
