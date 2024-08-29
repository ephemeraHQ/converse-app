import { MessageToDisplay } from "@components/Chat/Message/Message";
import { MessageReactionsList } from "@components/Chat/Message/MessageReactionsList";
import { useAppStore } from "@data/store/appStore";
import { useSelect } from "@data/store/storeHelpers";
import Clipboard from "@react-native-clipboard/clipboard";
import { isAttachmentMessage } from "@utils/attachment/helpers";
import {
  ConversationContext,
  ConversationContextType,
  useConversationContext,
} from "@utils/conversation";
import { converseEventEmitter } from "@utils/events";
import { MessageReaction } from "@utils/reactions";
import { isTransactionMessage } from "@utils/transaction";
import { FC, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useWindowDimensions, View } from "react-native";
import { Menu, Portal } from "react-native-paper";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

interface MessageContextMenuWrapperProps {
  message: MessageToDisplay;
  messageContent: React.ReactNode;
  children: React.ReactNode;
  reactions: {
    [senderAddress: string]: MessageReaction[];
  };
}

// This is the height of the menu as well as extra for the input bar etc.
const MENU_HEIGHT = 170;

export const MessageContextMenuWrapper: FC<MessageContextMenuWrapperProps> = ({
  children,
  message,
  reactions,
}) => {
  const height = useSharedValue(0);
  const lowerHeight = useSharedValue(0);
  const anchor = useRef({
    x: 0,
    y: 0,
    height: 0,
  });
  const viewRef = useRef<View>(null);
  const [lowerPadding, setLowerPadding] = useState(0);
  const [messageTop, setMessageTop] = useState(0);
  const { height: screenHeight } = useWindowDimensions();
  const { setContextMenuShown, contextMenuShownId } = useAppStore(
    useSelect(["setContextMenuShown", "contextMenuShownId"])
  );
  const isAttachment = isAttachmentMessage(message.contentType);
  const isTransaction = isTransactionMessage(message.contentType);
  const currentlyShown = contextMenuShownId === message.id;
  const closeMenu = useCallback(() => {
    setContextMenuShown(null);
  }, [setContextMenuShown]);

  const triggerReplyToMessage = useCallback(() => {
    converseEventEmitter.emit("triggerReplyToMessage", message);
    closeMenu();
  }, [message, closeMenu]);

  const handleCopyMessage = useCallback(() => {
    if (message.content) {
      Clipboard.setString(message.content);
    } else if (message.contentFallback) {
      Clipboard.setString(message.contentFallback);
    }
    closeMenu();
  }, [message.content, message.contentFallback, closeMenu]);

  const contextMenuItems = useMemo(() => {
    const items = [];
    items.push({
      title: "Reply",
      systemIcon: "arrowshape.turn.up.left",
      onPress: triggerReplyToMessage,
    });
    if (!isAttachment && !isTransaction) {
      items.push({
        title: "Copy message",
        systemIcon: "doc.on.doc",
        onPress: handleCopyMessage,
      });
    }

    return items;
  }, [isAttachment, isTransaction, triggerReplyToMessage, handleCopyMessage]);

  useEffect(() => {
    height.value = withTiming(currentlyShown ? 70 : 0, { duration: 300 });
  }, [currentlyShown, height]);

  useEffect(() => {
    if (lowerPadding !== 0) {
      lowerHeight.value = withTiming(currentlyShown ? lowerPadding : 0, {
        duration: 300,
      });
    }
  }, [currentlyShown, lowerHeight, lowerPadding]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      height: height.value,
      elevation: 200,
      position: "absolute",
    };
  }, [height, anchor]);

  const lowerAnimatedStyle = useAnimatedStyle(() => ({
    height: lowerHeight.value,
    width: 10,
  }));

  const onLayout = useCallback(() => {
    if (viewRef.current) {
      viewRef.current.measureInWindow((x, y, width, height) => {
        // Check if the element is too low on the screen
        const newHeight = y + height + MENU_HEIGHT - screenHeight;
        setLowerPadding(Math.max(10, newHeight));
        anchor.current = { x: x + width / 2, y: y + height, height };
        setMessageTop(y - height);
      });
    }
  }, [screenHeight]);

  useEffect(() => {
    if (currentlyShown) {
      onLayout();
    }
  }, [currentlyShown, onLayout]);
  const conversationContext = useConversationContext(["conversation"]);

  return (
    <>
      <Menu
        visible={currentlyShown}
        onDismiss={closeMenu}
        anchor={
          <View ref={viewRef} onLayout={onLayout} style={{ width: "100%" }}>
            {children}
          </View>
        }
        anchorPosition="bottom"
      >
        {contextMenuItems.map((item) => (
          <Menu.Item
            key={item.title}
            onPress={item.onPress}
            title={item.title}
          />
        ))}
      </Menu>
      {currentlyShown && (
        <Portal>
          {/* Portal has it's own context, so pass what is needed */}
          <ConversationContext.Provider
            value={conversationContext as ConversationContextType}
          >
            <Animated.View style={[animatedStyle, { top: messageTop - 80 }]}>
              <MessageReactionsList
                dismissMenu={closeMenu}
                reactions={reactions}
                message={message}
              />
            </Animated.View>
          </ConversationContext.Provider>
        </Portal>
      )}
      {currentlyShown && <Animated.View style={lowerAnimatedStyle} />}
    </>
  );
};
