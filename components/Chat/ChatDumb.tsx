import { FlashList, ListRenderItem } from "@shopify/flash-list";
import {
  backgroundColor,
  itemSeparatorColor,
  tertiaryBackgroundColor,
} from "@styles/colors";
import React, { useCallback, useEffect, useMemo, useRef } from "react";
import {
  FlatList,
  Platform,
  StyleSheet,
  View,
  useColorScheme,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { RemoteAttachmentContent } from "@xmtp/react-native-sdk";
import { ReanimatedFlashList } from "../../utils/animations";
import { useKeyboardAnimation } from "../../utils/animations/keyboardAnimation";
import { converseEventEmitter } from "../../utils/events";

type ChatDumbProps<T> = {
  onReadyToFocus: () => void;
  frameTextInputFocused: boolean;
  items: T[];
  renderItem: ListRenderItem<T>;
  keyExtractor: (item: T) => string;
  showChatInput: boolean;
  ListFooterComponent: React.JSX.Element | null;
  showPlaceholder: boolean;
  key?: string;
  displayList: boolean;
  refreshing: boolean;
  getItemType: (
    item: T,
    index: number,
    extraData?: any
  ) => string | number | undefined;
  placeholderComponent: React.JSX.Element | null;
  extraData?: any;
  itemToId: (id: T) => string;
  onSend: (payload: {
    text?: string;
    referencedMessageId?: string;
    attachment?: RemoteAttachmentContent;
  }) => Promise<void>;
};

const useStyles = () => {
  const colorScheme = useColorScheme();
  return useMemo(
    () =>
      StyleSheet.create({
        chatContainer: {
          flex: 1,
          justifyContent: "flex-end",
          backgroundColor: backgroundColor(colorScheme),
        },
        chatContent: {
          backgroundColor: backgroundColor(colorScheme),
          flex: 1,
        },
        chatPreviewContent: {
          backgroundColor: backgroundColor(colorScheme),
          flex: 1,
          paddingBottom: 0,
        },
        chat: {
          backgroundColor: backgroundColor(colorScheme),
        },
        inputBottomFiller: {
          position: "absolute",
          width: "100%",
          bottom: 0,
          backgroundColor: backgroundColor(colorScheme),
          zIndex: 0,
        },
        inChatRecommendations: {
          borderBottomWidth: 0.5,
          borderBottomColor: itemSeparatorColor(colorScheme),
          marginHorizontal: 20,
          marginBottom: 10,
        },
      }),
    [colorScheme]
  );
};

export function ChatDumb<T>({
  onReadyToFocus,
  frameTextInputFocused,
  items,
  renderItem,
  keyExtractor,
  showChatInput,
  showPlaceholder,
  key,
  displayList,
  refreshing,
  ListFooterComponent,
  getItemType,
  placeholderComponent,
  extraData,
  itemToId,
  onSend,
}: ChatDumbProps<T>) {
  const colorScheme = useColorScheme();
  const styles = useStyles();

  const hideInputIfFrameFocused = Platform.OS !== "web";

  const DEFAULT_INPUT_HEIGHT = 58;
  const chatInputHeight = useSharedValue(0);
  const chatInputDisplayedHeight = useDerivedValue(() => {
    return frameTextInputFocused && hideInputIfFrameFocused
      ? 0
      : chatInputHeight.value + DEFAULT_INPUT_HEIGHT;
  });

  const insets = useSafeAreaInsets();

  const { height: keyboardHeight } = useKeyboardAnimation();
  const tertiary = tertiaryBackgroundColor(colorScheme);
  const textInputStyle = useAnimatedStyle(
    () => ({
      position: "absolute",
      width: "100%",
      backgroundColor: tertiary,
      height: "auto",
      zIndex: 1,
      transform: [
        { translateY: -Math.max(insets.bottom, keyboardHeight.value) },
      ] as any,
    }),
    [keyboardHeight, colorScheme, insets.bottom]
  );

  const chatContentStyle = useAnimatedStyle(
    () => ({
      ...styles.chatContent,
      paddingBottom: showChatInput
        ? chatInputDisplayedHeight.value +
          Math.max(insets.bottom, keyboardHeight.value)
        : insets.bottom,
    }),
    [showChatInput, keyboardHeight, chatInputDisplayedHeight, insets.bottom]
  );

  const messageListRef = useRef<FlatList<T> | FlashList<T> | undefined>();

  const scrollToMessage = useCallback(
    (data: { messageId?: string; index?: number; animated?: boolean }) => {
      let index = data.index;
      if (index === undefined && data.messageId) {
        index = items.findIndex((m) => itemToId(m) === data.messageId);
      }
      if (index !== undefined) {
        messageListRef.current?.scrollToIndex({
          index,
          viewPosition: 0.5,
          animated: !!data.animated,
        });
      }
    },
    [itemToId, items]
  );

  useEffect(() => {
    converseEventEmitter.on("scrollChatToMessage", scrollToMessage);
    return () => {
      converseEventEmitter.off("scrollChatToMessage", scrollToMessage);
    };
  }, [scrollToMessage]);

  const handleOnLayout = useCallback(() => {
    setTimeout(() => {
      onReadyToFocus();
    }, 50);
  }, [onReadyToFocus]);

  return (
    <View style={styles.chatContainer} key={key}>
      <Animated.View style={chatContentStyle}>
        {displayList && (
          <ReanimatedFlashList
            contentContainerStyle={styles.chat}
            data={items}
            refreshing={refreshing}
            extraData={extraData}
            renderItem={renderItem}
            onLayout={handleOnLayout}
            keyboardDismissMode="interactive"
            automaticallyAdjustContentInsets={false}
            contentInsetAdjustmentBehavior="never"
            // Causes a glitch on Android, no sure we need it for now
            // maintainVisibleContentPosition={{
            //   minIndexForVisible: 0,
            //   autoscrollToTopThreshold: 100,
            // }}
            // estimatedListSize={Dimensions.get("screen")}
            inverted
            keyExtractor={keyExtractor}
            getItemType={getItemType}
            keyboardShouldPersistTaps="handled"
            estimatedItemSize={34}
            // Size glitch on Android
            showsVerticalScrollIndicator={Platform.OS === "ios"}
            pointerEvents="auto"
            ListFooterComponent={ListFooterComponent}
          />
        )}
        {showPlaceholder && placeholderComponent}
      </Animated.View>
      {/* {showChatInput && (
          <>
            <ReanimatedView
              style={[
                textInputStyle,
                {
                  display:
                    frameTextInputFocused && hideInputIfFrameFocused
                      ? "none"
                      : "flex",
                },
              ]}
            >
              <ChatInputDumb onSend={onSend} inputHeight={chatInputHeight} />
            </ReanimatedView>
            <View
              style={[
                styles.inputBottomFiller,
                { height: insets.bottom + DEFAULT_INPUT_HEIGHT },
              ]}
            />
          </>
        )} */}
    </View>
  );
}
