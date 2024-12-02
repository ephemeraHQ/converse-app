import {
  getCurrentAccount,
  useCurrentAccount,
} from "@data/store/accountsStore";
import { queryClient } from "@queries/queryClient";
import { useQuery } from "@tanstack/react-query";
import { getReadableProfile } from "@utils/str";
import { DecodedMessageWithCodecsType } from "@utils/xmtpRN/client";
import { getMessageContentType } from "@utils/xmtpRN/contentTypes";
import { CoinbaseMessagingPaymentCodec } from "@utils/xmtpRN/contentTypes/coinbasePayment";
import { getInboxId } from "@utils/xmtpRN/signIn";
import { TransactionReferenceCodec } from "@xmtp/content-type-transaction-reference";
import {
  DecodedMessage,
  GroupUpdatedCodec,
  ReactionCodec,
  ReadReceiptCodec,
  RemoteAttachmentCodec,
  ReplyCodec,
  StaticAttachmentCodec,
  TextCodec,
} from "@xmtp/react-native-sdk";

// type DecodedMessageAllTypes =
//   | DecodedMessage<[TextCodec]>
//   | DecodedMessage<[ReactionCodec]>
//   | DecodedMessage<[ReadReceiptCodec]>
//   | DecodedMessage<[GroupUpdatedCodec]>
//   | DecodedMessage<[ReplyCodec]>
//   | DecodedMessage<[RemoteAttachmentCodec]>
//   | DecodedMessage<[StaticAttachmentCodec]>
//   | DecodedMessage<[TransactionReferenceCodec]>
//   | DecodedMessage<[CoinbaseMessagingPaymentCodec]>;

/**
 * TODO: Move this somewhere else? Maybe to @xmtp/react-native-sdk? Or to @utils/xmtpRN/messages.ts?
 */

export function isTextMessage(
  message: any
): message is DecodedMessage<[TextCodec]> {
  return getMessageContentType(message.contentTypeId) === "text";
}
export function isReactionMessage(
  // message: DecodedMessageWithCodecsType
  message: any
): message is DecodedMessage<[ReactionCodec]> {
  return getMessageContentType(message.contentTypeId) === "reaction";
}
export function isReadReceiptMessage(
  // message: DecodedMessageWithCodecsType
  message: any
): message is DecodedMessage<[ReadReceiptCodec]> {
  return getMessageContentType(message.contentTypeId) === "readReceipt";
}
export function isGroupUpdatedMessage(
  // message: DecodedMessageWithCodecsType
  message: any
): message is DecodedMessage<[GroupUpdatedCodec]> {
  return getMessageContentType(message.contentTypeId) === "groupUpdated";
}
export function isReplyMessage(
  // message: DecodedMessageWithCodecsType
  message: any
): message is DecodedMessage<[ReplyCodec]> {
  return getMessageContentType(message.contentTypeId) === "reply";
}
export function isRemoteAttachmentMessage(
  // message: DecodedMessageWithCodecsType
  message: any
): message is DecodedMessage<[RemoteAttachmentCodec]> {
  return getMessageContentType(message.contentTypeId) === "remoteAttachment";
}
export function isStaticAttachmentMessage(
  // message: DecodedMessageWithCodecsType
  message: any
): message is DecodedMessage<[StaticAttachmentCodec]> {
  return getMessageContentType(message.contentTypeId) === "attachment";
}
export function isTransactionReferenceMessage(
  // message: DecodedMessageWithCodecsType
  message: any
): message is DecodedMessage<[TransactionReferenceCodec]> {
  return (
    getMessageContentType(message.contentTypeId) === "transactionReference"
  );
}
export function isCoinbasePaymentMessage(
  // message: DecodedMessageWithCodecsType
  message: any
): message is DecodedMessage<[CoinbaseMessagingPaymentCodec]> {
  return getMessageContentType(message.contentTypeId) === "coinbasePayment";
}

export function useMessageSenderReadableProfile(
  message: DecodedMessageWithCodecsType
) {
  const currentAccountAdress = useCurrentAccount();
  if (!currentAccountAdress) {
    return "";
  }
  return getReadableProfile(currentAccountAdress, message.senderAddress);
}

// TMP until we move this into an account store or something like that
// Maybe instead worth moving into account store?
export function useCurrentAccountInboxId() {
  return useQuery(getCurrentAccountInboxIdQueryOptions());
}

function getCurrentAccountInboxIdQueryOptions() {
  const currentAccount = getCurrentAccount();
  return {
    queryKey: ["inboxId", currentAccount],
    queryFn: () => getInboxId(currentAccount!),
    enabled: !!currentAccount,
  };
}

export function getCurrentUserAccountInboxId() {
  return queryClient.getQueryData(
    getCurrentAccountInboxIdQueryOptions().queryKey
  );
}
