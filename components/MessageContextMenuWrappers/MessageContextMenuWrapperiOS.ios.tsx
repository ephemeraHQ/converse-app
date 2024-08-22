import { MessageToDisplay } from "@components/Chat/Message/Message";
import { MessageReactionsList } from "@components/Chat/Message/MessageReactionsList";
import { useAppStore } from "@data/store/appStore";
import { useSelect } from "@data/store/storeHelpers";
import Clipboard from "@react-native-clipboard/clipboard";
import { messageBubbleColor, myMessageBubbleColor } from "@styles/colors";
import { isAttachmentMessage } from "@utils/attachment/helpers";
import { converseEventEmitter } from "@utils/events";
import { MessageReaction } from "@utils/reactions";
import { isTransactionMessage } from "@utils/transaction";
import React, { FC, useCallback, useMemo, useRef } from "react";
import { useColorScheme } from "react-native";
import { ContextMenuView } from "react-native-ios-context-menu";

enum ContextMenuActions {
  REPLY = "Reply",
  COPY_MESSAGE = "Copy message",
}

interface MessageContextMenuWrapperIOSProps {
  message: MessageToDisplay;
  children: React.ReactNode;
  reactions: {
    [senderAddress: string]: MessageReaction[];
  };
}

const MessageContextMenuWrapperIOSInner: FC<
  MessageContextMenuWrapperIOSProps
> = ({ children, message, reactions }) => {
  const colorScheme = useColorScheme();
  const { setContextMenuShown } = useAppStore(
    useSelect(["setContextMenuShown", "contextMenuShownId"])
  );
  const isAttachment = isAttachmentMessage(message.contentType);
  const isTransaction = isTransactionMessage(message.contentType);

  const contextMenuItems = useMemo(() => {
    const items = [];
    items.push({
      title: "Reply",
      systemIcon: "arrowshape.turn.up.left",
      actionKey: ContextMenuActions.REPLY,
    });
    if (!isAttachment && !isTransaction) {
      items.push({
        title: "Copy message",
        systemIcon: "doc.on.doc",
        actionKey: ContextMenuActions.COPY_MESSAGE,
      });
    }

    return items;
  }, [isAttachment, isTransaction]);
  const triggerReplyToMessage = useCallback(() => {
    converseEventEmitter.emit("triggerReplyToMessage", message);
  }, [message]);

  const handleContextMenuAction = useCallback(
    (event: { nativeEvent: { actionKey: string } }) => {
      const actionKey = event.nativeEvent.actionKey as ContextMenuActions;
      switch (actionKey) {
        case ContextMenuActions.REPLY:
          triggerReplyToMessage();
          break;
        case ContextMenuActions.COPY_MESSAGE:
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
      setContextMenuShown,
      triggerReplyToMessage,
      message.content,
      message.contentFallback,
    ]
  );

  const handleMenuWillHide = useCallback(() => {
    setContextMenuShown(null);
  }, [setContextMenuShown]);

  const handleMenuWillShow = useCallback(() => {
    setContextMenuShown(message.id);
  }, [setContextMenuShown, message.id]);

  const ref = useRef<ContextMenuView>(null);

  return (
    <ContextMenuView
      ref={ref}
      onMenuWillHide={handleMenuWillHide}
      onMenuWillShow={handleMenuWillShow}
      isAuxiliaryPreviewEnabled
      isContextMenuEnabled
      onPressMenuItem={handleContextMenuAction}
      shouldPreventLongPressGestureFromPropagating
      menuConfig={{
        menuTitle: "",
        menuItems: contextMenuItems.map((item) => ({
          actionTitle: item.title,
          actionKey: item.title,
          type: "action",
          icon: {
            type: "IMAGE_SYSTEM",
            imageValue: {
              systemName: item.systemIcon,
            },
          },
        })),
      }}
      previewConfig={{
        backgroundColor: message.fromMe
          ? myMessageBubbleColor(colorScheme)
          : messageBubbleColor(colorScheme),
        borderRadius: 15,
      }}
      auxiliaryPreviewConfig={{
        anchorPosition: "automatic",
        alignmentHorizontal: message.fromMe
          ? "previewTrailing"
          : "previewLeading",
        horizontalAlignment: message.fromMe
          ? "targetTrailing"
          : "targetLeading",
        transitionConfigEntrance: {
          mode: "syncedToMenuEntranceTransition",
          shouldAnimateSize: true,
        },
        transitionExitPreset: {
          mode: "fade",
        },
      }}
      lazyPreview
      renderAuxiliaryPreview={() => {
        return (
          <MessageReactionsList
            dismissMenu={() => ref?.current?.dismissMenu()}
            reactions={reactions}
            message={message}
          />
        );
      }}
    >
      {children}
    </ContextMenuView>
  );
};

export const MessageContextMenuWrapperIOS = React.memo(
  MessageContextMenuWrapperIOSInner
);
