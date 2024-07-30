import { MessageToDisplay } from "@components/Chat/Message/Message";
import { MessageReactionsList } from "@components/Chat/Message/MessageReactionsList";
import { useAppStore } from "@data/store/appStore";
import { useSelect } from "@data/store/storeHelpers";
import Clipboard from "@react-native-clipboard/clipboard";
import { isAttachmentMessage } from "@utils/attachment/helpers";
import { converseEventEmitter } from "@utils/events";
import { MessageReaction } from "@utils/reactions";
import { isTransactionMessage } from "@utils/transaction";
import { FC, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DeviceEventEmitter, EmitterSubscription, View } from "react-native";
import { TouchableWithoutFeedback } from "react-native-gesture-handler";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import * as ContextMenu from "zeego/context-menu";

interface MessageContextMenuWrapperProps {
  message: MessageToDisplay;
  messageContent: React.ReactNode;
  children: React.ReactNode;
  reactions: {
    [senderAddress: string]: MessageReaction | undefined;
  };
}

export const MessageContextMenuWrapper: FC<MessageContextMenuWrapperProps> = ({
  children,
  message,
  reactions,
}) => {
  const height = useSharedValue(0);
  const { setContextMenuShown, contextMenuShownId } = useAppStore(
    useSelect(["setContextMenuShown", "contextMenuShownId"])
  );
  const isAttachment = isAttachmentMessage(message.contentType);
  const isTransaction = isTransactionMessage(message.contentType);
  const currentlyShown = contextMenuShownId === message.id;

  const contextMenuItems = useMemo(() => {
    const items = [];
    items.push({ title: "Reply", systemIcon: "arrowshape.turn.up.left" });
    if (!isAttachment && !isTransaction) {
      items.push({ title: "Copy message", systemIcon: "doc.on.doc" });
    }

    return items;
  }, [isAttachment, isTransaction]);

  useEffect(() => {
    height.value = withTiming(currentlyShown ? 70 : 0, { duration: 300 });
  }, [currentlyShown, height]);

  const animatedStyle = useAnimatedStyle(() => ({
    height: height.value,
  }));
  const viewRef = useRef<View>(null);
  const openRef = useRef<EmitterSubscription>(null);
  const [willShowAbove, setWillShowAbove] = useState(false);

  useEffect(() => {
    // let openEventSubscription: EmitterSubscription | null = null;
    let closeEventSubscription: EmitterSubscription | null = null;
    if (!currentlyShown) {
      // openEventSubscription = DeviceEventEmitter.addListener(
      //   "CONTEXT_MENU_OPENED",
      //   () => {
      //     setContextMenuShown(message.id);
      //     openEventSubscription?.remove();
      //   }
      // );
    }
    if (currentlyShown) {
      closeEventSubscription = DeviceEventEmitter.addListener(
        "CONTEXT_MENU_CLOSED",
        () => {
          setContextMenuShown(null);
          closeEventSubscription?.remove();
        }
      );
    }
    return () => {
      if (closeEventSubscription) {
        closeEventSubscription?.remove();
      }
      // if (openEventSubscription) {
      //   openEventSubscription?.remove();
      // }
    };
  }, [currentlyShown, message.id, setContextMenuShown]);

  const triggerReplyToMessage = useCallback(() => {
    converseEventEmitter.emit("triggerReplyToMessage", message);
  }, [message]);

  const handleContextMenuAction = useCallback(
    (event: { nativeEvent: { index: number } }) => {
      const { index } = event.nativeEvent;
      switch (contextMenuItems[index].title) {
        case "Reply":
          triggerReplyToMessage();
          break;
        case "Copy message":
          if (message.content) {
            Clipboard.setString(message.content);
          } else if (message.contentFallback) {
            Clipboard.setString(message.contentFallback);
          }
          break;
      }
      setContextMenuShown(null);
    },
    [
      contextMenuItems,
      setContextMenuShown,
      triggerReplyToMessage,
      message.content,
      message.contentFallback,
    ]
  );

  const handleOpenChange = useCallback(
    (isOpen: boolean) => {
      if (!isOpen) {
        setContextMenuShown(null);
      } else {
        setContextMenuShown(message.id);
      }
    },
    [setContextMenuShown, message.id]
  );

  return (
    <View style={{ flexGrow: 1, borderColor: "orange", borderWidth: 1 }}>
      <ContextMenu.Root onOpenChange={handleOpenChange}>
        <ContextMenu.Content
          loop={false}
          avoidCollisions
          collisionPadding={30}
          alignOffset={10}
        >
          {contextMenuItems.map((item, index) => (
            <ContextMenu.Item
              key={item.title}
              onSelect={() =>
                handleContextMenuAction({ nativeEvent: { index } })
              }
            >
              <ContextMenu.ItemTitle style={{ color: "white" }}>
                {item.title}
              </ContextMenu.ItemTitle>
              <ContextMenu.ItemIcon
                ios={{ name: item.systemIcon }}
                androidIconName={item.systemIcon}
              />
            </ContextMenu.Item>
          ))}
        </ContextMenu.Content>

        <ContextMenu.Trigger>
          <>
            {currentlyShown && (
              <Animated.View
                style={[
                  animatedStyle,
                  {
                    borderColor: "blue",
                    borderWidth: 1,
                  },
                ]}
              >
                <MessageReactionsList reactions={reactions} message={message} />
              </Animated.View>
            )}
            <TouchableWithoutFeedback
              onLongPress={() => {
                console.log("long press");
                setContextMenuShown(message.id);
              }}
              onPressIn={() => {
                console.log("press in");
                openRef.current = DeviceEventEmitter.addListener(
                  "CONTEXT_MENU_OPENED",
                  () => {
                    setContextMenuShown(message.id);
                    openRef.current?.remove();
                  }
                );
              }}
              onPressOut={() => {
                openRef.current?.remove();
              }}
              delayLongPress={500}
              style={{
                borderColor: "green",
                borderWidth: 1,
              }}
            >
              <View
                style={{
                  borderColor: "red",
                  borderWidth: 1,
                }}
              >
                {children}
              </View>
            </TouchableWithoutFeedback>
          </>
        </ContextMenu.Trigger>
      </ContextMenu.Root>
    </View>
  );
};
