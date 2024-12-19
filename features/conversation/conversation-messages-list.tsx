import { VStack } from "@/design-system/VStack";
import { useConversationStore } from "@/features/conversation/conversation.store-context";
import { useAppTheme } from "@/theme/useAppTheme";
// import { LegendList } from "@legendapp/list";
import {
  AnimatedFlashList,
  FlashList,
  FlashListProps,
} from "@shopify/flash-list";
import { MessageId } from "@xmtp/react-native-sdk";
import { ReactElement, memo, useEffect } from "react";
import { Platform } from "react-native";
import { useAnimatedRef } from "react-native-reanimated";

export const ConversationMessagesList = memo(function ConversationMessagesList(
  props: Omit<
    // AnimatedProps<FlatListProps<MessageId>>,
    FlashListProps<MessageId>,
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

  const { theme } = useAppTheme();

  const scrollRef = useAnimatedRef<FlashList<MessageId>>();

  const conversationStore = useConversationStore();

  useEffect(() => {
    const unsub = conversationStore.subscribe(
      (state) => state.scrollToMessageId,
      (scrollToMessageId) => {
        if (!scrollToMessageId) return;
        scrollRef.current?.scrollToIndex({
          index: messageIds.indexOf(scrollToMessageId),
          animated: true,
          viewOffset: 100, // Random value just so that the message is not directly at the bottom
        });
        conversationStore.setState({
          scrollToMessageId: undefined,
        });
      }
    );

    return () => {
      unsub();
    };
  }, [conversationStore, messageIds, scrollRef]);

  // WIP. Lib isn't ready yet
  // return (
  //   <LegendList
  //     data={messageIds}
  //     renderItem={({ item, index }) =>
  //       renderMessage({
  //         messageId: item,
  //         index,
  //       })
  //     }
  //     itemLayoutAnimation={theme.animation.reanimatedLayoutSpringTransition}
  //     keyboardDismissMode="interactive"
  //     estimatedItemSize={100}
  //     maintainScrollAtEnd
  //     alignItemsAtEnd
  //     automaticallyAdjustContentInsets={false}
  //     contentInsetAdjustmentBehavior="never"
  //     keyExtractor={keyExtractor}
  //     keyboardShouldPersistTaps="handled"
  //     ItemSeparatorComponent={MessageSeparator}
  //     showsVerticalScrollIndicator={Platform.OS === "ios"} // Size glitch on Android
  //     pointerEvents="auto"
  //     /**
  //      * Causes a glitch on Android, no sure we need it for now
  //      */
  //     // maintainVisibleContentPosition={{
  //     //   minIndexForVisible: 0,
  //     //   autoscrollToTopThreshold: 100,
  //     // }}
  //     // estimatedListSize={Dimensions.get("screen")}
  //     {...rest}
  //   />
  // );

  return (
    <AnimatedFlashList
      inverted={true}
      ref={scrollRef}
      data={messageIds}
      renderItem={({ item, index }) =>
        renderMessage({
          messageId: item,
          index,
        })
      }
      // itemLayoutAnimation={theme.animation.reanimatedLayoutSpringTransition}
      keyboardDismissMode="interactive"
      // automaticallyAdjustContentInsets={false}
      // contentInsetAdjustmentBehavior="never"
      keyExtractor={keyExtractor}
      keyboardShouldPersistTaps="handled"
      ItemSeparatorComponent={() => <MessageSeparator />}
      showsVerticalScrollIndicator={Platform.OS === "ios"} // Size glitch on Android
      // pointerEvents="auto"
      /**
       * Causes a glitch on Android, no sure we need it for now
       */
      // maintainVisibleContentPosition={{
      //   minIndexForVisible: 0,
      //   autoscrollToTopThreshold: 100,
      // }}
      estimatedItemSize={50} // 50 is very random for now
      {...rest}
    />
  );
});

const keyExtractor = (messageId: MessageId) => messageId;

const MessageSeparator = memo(function MessageSeparator() {
  const { theme } = useAppTheme();
  return <VStack style={{ height: theme.spacing["4xs"] }} />;
});
