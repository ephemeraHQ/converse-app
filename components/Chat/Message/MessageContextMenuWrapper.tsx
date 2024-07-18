import { useAppStore } from "@data/store/appStore";
import { useSelect } from "@data/store/storeHelpers";
import Clipboard from "@react-native-clipboard/clipboard";
import { isAttachmentMessage } from "@utils/attachment/helpers";
import { converseEventEmitter } from "@utils/events";
import { MessageReaction } from "@utils/reactions";
import { isTransactionMessage } from "@utils/transaction";
import React, { FC, useCallback, useEffect, useMemo } from "react";
import {
  DeviceEventEmitter,
  EmitterSubscription,
  Platform,
  Text,
  View,
} from "react-native";
import * as ContextMenu from "zeego/context-menu";

import { MessageToDisplay } from "./Message";
import { MessageReactionsList } from "./MessageReactionsList";

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
  messageContent,
  reactions,
}) => {
  const { setContextMenuShown, contextMenuShown } = useAppStore(
    useSelect(["setContextMenuShown", "contextMenuShown"])
  );
  const isAttachment = isAttachmentMessage(message.contentType);
  const isTransaction = isTransactionMessage(message.contentType);
  const canAddReaction =
    message.status !== "sending" && message.status !== "error";

  const contextMenuItems = useMemo(() => {
    const items = [];

    if (canAddReaction) {
      items.push({ title: "Add a reaction", systemIcon: "smiley" });
    }
    items.push({ title: "Reply", systemIcon: "arrowshape.turn.up.left" });
    if (!isAttachment && !isTransaction) {
      items.push({ title: "Copy message", systemIcon: "doc.on.doc" });
    }

    return items;
  }, [canAddReaction, isAttachment, isTransaction]);

  const showReactionModal = useCallback(() => {
    // setEmojiPickerShown(true);
  }, []);

  useEffect(() => {
    let eventSubscription: EmitterSubscription | null = null;
    if (Platform.OS === "android" && contextMenuShown) {
      eventSubscription = DeviceEventEmitter.addListener(
        "CONTEXT_MENU_CLOSED",
        () => {
          setContextMenuShown(false);
          eventSubscription?.remove();
        }
      );
    }
    return () => {
      if (eventSubscription) {
        eventSubscription?.remove();
      }
    };
  }, [contextMenuShown, setContextMenuShown]);

  const triggerReplyToMessage = useCallback(() => {
    converseEventEmitter.emit("triggerReplyToMessage", message);
  }, [message]);

  const handleContextMenuAction = useCallback(
    (event: { nativeEvent: { index: number } }) => {
      const { index } = event.nativeEvent;
      switch (contextMenuItems[index].title) {
        case "Add a reaction":
          showReactionModal();
          break;
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
      setContextMenuShown(false);
    },
    [
      contextMenuItems,
      setContextMenuShown,
      showReactionModal,
      triggerReplyToMessage,
      message.content,
      message.contentFallback,
    ]
  );

  return (
    <ContextMenu.Root onOpenChange={setContextMenuShown}>
      <ContextMenu.Content
        loop={false}
        avoidCollisions
        collisionPadding={30}
        alignOffset={10}
      >
        <ContextMenu.Preview
          backgroundColor="#ffffff01"
          onPress={(e) => {
            e.preventDefault();
          }}
        >
          {() => (
            <>
              <View
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                }}
              >
                <View style={{ flex: 1 }}>
                  <View style={{ height: 300, width: 200 }}>
                    <MessageReactionsList reactions={reactions} />
                  </View>
                  <View
                    style={{
                      alignItems: "flex-start",
                      justifyContent: "flex-start",
                      alignSelf: "flex-start",
                    }}
                  >
                    <View
                      style={{
                        height: 200,
                        width: 200,
                        right: 0,
                        alignSelf: "flex-end",
                      }}
                    >
                      {messageContent}
                    </View>
                  </View>
                </View>
              </View>
            </>
          )}
        </ContextMenu.Preview>
        {contextMenuItems.map((item, index) => (
          <ContextMenu.Item
            key={item.title}
            onSelect={() => handleContextMenuAction({ nativeEvent: { index } })}
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
        <View style={{ flexShrink: 1 }}>
          {contextMenuShown && (
            <View>
              <Text
                style={{
                  color: "white",
                  backgroundColor: "black",
                  padding: 10,
                }}
              >
                Showing menu
              </Text>
            </View>
          )}
          {children}
        </View>
      </ContextMenu.Trigger>
    </ContextMenu.Root>
  );
};
