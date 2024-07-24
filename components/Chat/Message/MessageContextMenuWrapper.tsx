import { useAppStore } from "@data/store/appStore";
import { useSelect } from "@data/store/storeHelpers";
import Clipboard from "@react-native-clipboard/clipboard";
import { messageBubbleColor, myMessageBubbleColor } from "@styles/colors";
import { isAttachmentMessage } from "@utils/attachment/helpers";
import { converseEventEmitter } from "@utils/events";
import { MessageReaction } from "@utils/reactions";
import { isTransactionMessage } from "@utils/transaction";
import React, { FC, useCallback, useEffect, useMemo } from "react";
import {
  DeviceEventEmitter,
  EmitterSubscription,
  Platform,
  useColorScheme,
  useWindowDimensions,
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
  const colorScheme = useColorScheme();
  const { setContextMenuShown, contextMenuShownId } = useAppStore(
    useSelect(["setContextMenuShown", "contextMenuShownId"])
  );
  const { width } = useWindowDimensions();
  const isAttachment = isAttachmentMessage(message.contentType);
  const isTransaction = isTransactionMessage(message.contentType);
  const canAddReaction =
    message.status !== "sending" && message.status !== "error";
  const currentlyShown = contextMenuShownId === message.id;

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
    let openEventSubscription: EmitterSubscription | null = null;
    let closeEventSubscription: EmitterSubscription | null = null;
    if (Platform.OS !== "ios" && !currentlyShown) {
      openEventSubscription = DeviceEventEmitter.addListener(
        "CONTEXT_MENU_OPENED",
        () => {
          setContextMenuShown(message.id);
          openEventSubscription?.remove();
        }
      );
    }
    if (Platform.OS !== "ios" && currentlyShown) {
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
      if (openEventSubscription) {
        openEventSubscription?.remove();
      }
    };
  }, [currentlyShown, message.id, setContextMenuShown]);

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
      setContextMenuShown(null);
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

  const handleOpenWillChange = useCallback(
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
    <View>
      <ContextMenu.Root onOpenWillChange={handleOpenWillChange}>
        <ContextMenu.Content
          loop={false}
          avoidCollisions
          collisionPadding={30}
          alignOffset={10}
        >
          <ContextMenu.Auxiliary
            anchorPosition="automatic"
            transitionEntranceDelay="RECOMMENDED"
            marginPreview={60}
            marginWithScreenEdge={20}
            alignmentHorizontal={
              message.fromMe ? "previewTrailing" : "previewLeading"
            }
            key="reactions"
            width={width * 0.8}
            height={200}
          >
            {({ dismissMenu }) => (
              <MessageReactionsList
                dismissMenu={dismissMenu}
                reactions={reactions}
                message={message}
              />
            )}
          </ContextMenu.Auxiliary>
          <ContextMenu.Preview
            borderRadius={14}
            backgroundColor={
              message.fromMe
                ? myMessageBubbleColor(colorScheme)
                : messageBubbleColor(colorScheme)
            }
          >
            {() => {
              return children;
            }}
          </ContextMenu.Preview>
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
            {currentlyShown && Platform.OS !== "ios" && (
              <MessageReactionsList reactions={reactions} message={message} />
            )}
            {children}
          </>
        </ContextMenu.Trigger>
      </ContextMenu.Root>
    </View>
  );
};
