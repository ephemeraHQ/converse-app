import { MessageToDisplay } from "@components/Chat/Message/Message";
import { MessageReactionsList } from "@components/Chat/Message/MessageReactionsList";
import HoldItem from "@components/HoldMenu/HoldItem";
import { HoldMenuProvider } from "@components/HoldMenu/HoldProvider";
import { useAppStore } from "@data/store/appStore";
import { useFramesStore } from "@data/store/framesStore"; // Add this import
import { useSelect } from "@data/store/storeHelpers";
import Clipboard from "@react-native-clipboard/clipboard";
import { messageBubbleColor, myMessageBubbleColor } from "@styles/colors";
import { isAttachmentMessage } from "@utils/attachment/helpers";
import { converseEventEmitter } from "@utils/events";
import { isFrameMessage } from "@utils/frames"; // Add this import
import { navigate } from "@utils/navigation";
import { MessageReaction } from "@utils/reactions";
import { isTransactionMessage } from "@utils/transaction";
import React, { FC, useCallback, useMemo, useRef } from "react";
import { useColorScheme, View } from "react-native";
import { ContextMenuView } from "react-native-ios-context-menu";

enum ContextMenuActions {
  REPLY = "Reply",
  COPY_MESSAGE = "Copy",
  SHARE_FRAME = "Share",
}

interface MessageContextMenuWrapperIOSProps {
  message: MessageToDisplay;
  children: React.ReactNode;
  reactions: {
    [senderAddress: string]: MessageReaction[];
  };
  hideBackground: boolean;
}

const MessageContextMenuWrapperIOSInner: FC<
  MessageContextMenuWrapperIOSProps
> = ({ children, message, reactions, hideBackground }) => {
  const colorScheme = useColorScheme();
  const { setContextMenuShown } = useAppStore(
    useSelect(["setContextMenuShown", "contextMenuShownId"])
  );
  const isAttachment = isAttachmentMessage(message.contentType);
  const isTransaction = isTransactionMessage(message.contentType);

  const frameURL = useMemo(() => {
    const isFrame = isFrameMessage(message);
    if (isFrame) {
      const frames = useFramesStore
        .getState()
        .getFramesForURLs(message.converseMetadata?.frames || []);
      return frames[0]?.url;
    }
    return null;
  }, [message]);

  const contextMenuItems = useMemo(() => {
    const items = [];
    items.push({
      title: "Reply",
      systemIcon: "arrowshape.turn.up.left",
      actionKey: ContextMenuActions.REPLY,
    });
    if (!isAttachment && !isTransaction) {
      items.push({
        title: "Copy",
        systemIcon: "doc.on.doc",
        actionKey: ContextMenuActions.COPY_MESSAGE,
      });
    }
    if (frameURL) {
      items.push({
        title: "Share",
        systemIcon: "square.and.arrow.up",
        actionKey: ContextMenuActions.SHARE_FRAME,
      });
    }

    return items;
  }, [isAttachment, isTransaction, frameURL]);

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
        case ContextMenuActions.SHARE_FRAME:
          if (frameURL) {
            navigate("ShareFrame", { frameURL });
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
      frameURL,
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
    <HoldMenuProvider>
      <HoldItem
        items={[
          {
            text: "Reply",
          },
        ]}
      >
        <View>{children}</View>
      </HoldItem>
    </HoldMenuProvider>
  );

  return (
    <ContextMenuView
      ref={ref}
      onMenuWillHide={handleMenuWillHide}
      onMenuWillShow={handleMenuWillShow}
      isAuxiliaryPreviewEnabled
      isContextMenuEnabled
      onPressMenuItem={handleContextMenuAction}
      shouldPreventLongPressGestureFromPropagating
      renderPreview={() => <>{children}</>}
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
        backgroundColor: hideBackground
          ? undefined
          : message.fromMe
          ? myMessageBubbleColor(colorScheme)
          : messageBubbleColor(colorScheme),
        borderRadius: 16,
        previewSize: "INHERIT",
        previewType: "CUSTOM",
      }}
      auxiliaryPreviewConfig={{
        transitionEntranceDelay: "RECOMMENDED",
        verticalAnchorPosition: "top",
        alignmentHorizontal: message.fromMe
          ? "previewTrailing"
          : "previewLeading",
        horizontalAlignment: message.fromMe
          ? "targetTrailing"
          : "targetLeading",
        anchorPosition: "top",
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

export const MessageContextMenuWrapperIOS = MessageContextMenuWrapperIOSInner;
