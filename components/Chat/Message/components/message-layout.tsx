import { V3MessageSenderAvatar } from "@/components/Chat/Message/MessageSenderAvatar";
import { MessageContainer } from "@/components/Chat/Message/components/message-container";
import { MessageContentContainer } from "@/components/Chat/Message/components/message-content-container";
import { MessageRepliable } from "@/components/Chat/Message/components/message-repliable";
import { MessageSpaceBetweenMessages } from "@/components/Chat/Message/components/message-space-between-messages";
import { MessageDateChange } from "@/components/Chat/Message/message-date-change";
import {
  IMessageGesturesOnLongPressArgs,
  MessageGestures,
} from "@/components/Chat/Message/message-gestures";
import { MessageTimestamp } from "@/components/Chat/Message/message-timestamp";
import {
  getMessageById,
  getMessageStringContent,
  isRemoteAttachmentMessage,
  isStaticAttachmentMessage,
  isTransactionReferenceMessage,
} from "@/components/Chat/Message/message-utils";
import {
  useMessageContextStore,
  useMessageContextStoreContext,
} from "@/components/Chat/Message/stores/message-store";
import { showSnackbar } from "@/components/Snackbar/Snackbar.service";
import { TableViewItemType } from "@/components/TableView/TableView";
import { TableViewPicto } from "@/components/TableView/TableViewImage";
import { useSelect } from "@/data/store/storeHelpers";
import { VStack } from "@/design-system/VStack";
import {
  resetMessageContextMenuData,
  setCurrentConversationReplyToMessageId,
} from "@/features/conversation/conversation-service";
import { useConversationStore } from "@/features/conversation/conversation-store";
import { translate } from "@/i18n";
import { useAppTheme } from "@/theme/useAppTheme";
import { captureErrorWithToast } from "@/utils/capture-error";
import Clipboard from "@react-native-clipboard/clipboard";
import { ReactNode, useCallback } from "react";

type IMessageLayoutProps = {
  children: ReactNode;
};

const CONTEXT_MENU_ACTIONS = {
  REPLY: "Reply",
  COPY_MESSAGE: "Copy",
  SHARE_FRAME: "Share",
} as const;

export function MessageLayout({ children }: IMessageLayoutProps) {
  const { theme } = useAppTheme();

  const { senderAddress, fromMe, messageId } = useMessageContextStoreContext(
    useSelect(["senderAddress", "fromMe", "messageId"])
  );

  const messageStore = useMessageContextStore();

  const handleReply = useCallback(() => {
    setCurrentConversationReplyToMessageId(messageId);
  }, [messageId]);

  const handleTap = useCallback(() => {
    const isShowingTime = !messageStore.getState().isShowingTime;
    messageStore.setState({
      isShowingTime,
    });
  }, [messageStore]);

  const triggerMessageContextMenu = useTriggerMessageContextMenu(children);

  const handleLongPress = useCallback(
    (e: IMessageGesturesOnLongPressArgs) => {
      triggerMessageContextMenu(e);
    },
    [triggerMessageContextMenu]
  );

  return (
    <>
      <MessageDateChange />
      <MessageTimestamp />
      <MessageRepliable onReply={handleReply}>
        <MessageContainer fromMe={fromMe}>
          <MessageContentContainer fromMe={fromMe}>
            {!fromMe && (
              <>
                <V3MessageSenderAvatar inboxId={senderAddress} />
                <VStack style={{ width: theme.spacing.xxs }} />
              </>
            )}

            <MessageGestures onTap={handleTap} onLongPress={handleLongPress}>
              {children}
            </MessageGestures>
          </MessageContentContainer>
        </MessageContainer>
      </MessageRepliable>
      <MessageSpaceBetweenMessages />
    </>
  );
}

function useTriggerMessageContextMenu(children: ReactNode) {
  const messageStore = useMessageContextStore();

  return useCallback(
    (e: IMessageGesturesOnLongPressArgs) => {
      const fromMe = messageStore.getState().fromMe;
      const messageId = messageStore.getState().messageId;

      const message = getMessageById(messageId);

      if (!message) {
        captureErrorWithToast(
          new Error("No message found in triggerMessageContextMenu"),
          { message: "Couldn't find message" }
        );
        return;
      }

      const items: TableViewItemType[] = [];

      items.push({
        title: translate("reply"),
        action: () => {
          setCurrentConversationReplyToMessageId(messageId);
          resetMessageContextMenuData();
        },
        id: CONTEXT_MENU_ACTIONS.REPLY,
        rightView: <TableViewPicto symbol="arrowshape.turn.up.left" />,
      });

      const isAttachment =
        isRemoteAttachmentMessage(message) ||
        isStaticAttachmentMessage(message);
      const isTransaction = isTransactionReferenceMessage(message);

      if (!isAttachment && !isTransaction) {
        items.push({
          title: translate("copy"),
          rightView: <TableViewPicto symbol="doc.on.doc" />,
          id: CONTEXT_MENU_ACTIONS.COPY_MESSAGE,
          action: () => {
            const messageStringContent = getMessageStringContent(message);
            if (!!messageStringContent) {
              Clipboard.setString(messageStringContent);
            } else {
              showSnackbar({
                message: `Couldn't copy message content`,
              });
            }

            resetMessageContextMenuData();
          },
        });
      }

      // TODO: Implement share frame
      // if (frameURL) {
      //   items.push({
      //     title: translate("share"),
      //     rightView: <TableViewPicto symbol="square.and.arrow.up" />,
      //     id: CONTEXT_MENU_ACTIONS.SHARE_FRAME,
      //     action: () => {
      //       if (frameURL) {
      //         navigate("ShareFrame", { frameURL });
      //       }
      //       onContextClose();
      //     },
      //   });
      // }

      useConversationStore.setState({
        messageContextMenuData: {
          fromMe: fromMe,
          itemRectX: e.pageX,
          itemRectY: e.pageY,
          itemRectHeight: e.height,
          itemRectWidth: e.width,
          items: items,
          Content: children,
        },
      });
    },
    [messageStore, children]
  );
}
