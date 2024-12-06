import {
  getMessageById,
  isRemoteAttachmentMessage,
  isStaticAttachmentMessage,
  isTransactionReferenceMessage,
  getMessageStringContent,
} from "@/components/Chat/Message/message-utils";
import { showSnackbar } from "@/components/Snackbar/Snackbar.service";
import { TableViewItemType } from "@/components/TableView/TableView";
import { TableViewPicto } from "@/components/TableView/TableViewImage";
import {
  setCurrentConversationReplyToMessageId,
  resetMessageContextMenuData,
} from "@/features/conversation/conversation-service";
import { translate } from "@/i18n";
import { captureErrorWithToast } from "@/utils/capture-error";
import Clipboard from "@react-native-clipboard/clipboard";
import { MessageId } from "@xmtp/react-native-sdk";

const CONTEXT_MENU_ACTIONS = {
  REPLY: "Reply",
  COPY_MESSAGE: "Copy",
  SHARE_FRAME: "Share",
} as const;

export function getMessageContextMenuItems(args: { messageId: MessageId }) {
  const { messageId } = args;

  const message = getMessageById(messageId);

  if (!message) {
    captureErrorWithToast(
      new Error("No message found in triggerMessageContextMenu"),
      { message: "Couldn't find message" }
    );
    return [];
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
    isRemoteAttachmentMessage(message) || isStaticAttachmentMessage(message);
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
  return items;
}
