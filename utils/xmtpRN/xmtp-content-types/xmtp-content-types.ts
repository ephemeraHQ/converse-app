import { ObjectTyped } from "@/utils/object-typed";
import { logger } from "@utils/logger";

export const contentTypesPrefixes = {
  text: "xmtp.org/text:",
  remoteAttachment: "xmtp.org/remoteStaticAttachment:",
  attachment: "xmtp.org/attachment:",
  reaction: "xmtp.org/reaction:",
  reply: "xmtp.org/reply:",
  readReceipt: "xmtp.org/readReceipt:",
  coinbasePayment: "coinbase.com/coinbase-messaging-payment-activity:",
  transactionReference: "xmtp.org/transactionReference:",
  groupUpdated: "xmtp.org/group_updated:",
};

export type IConvosContentType = keyof typeof contentTypesPrefixes;

export function isContentType(args: {
  type: IConvosContentType;
  contentType?: string;
}) {
  const { type, contentType } = args;
  if (!contentType) {
    return false;
  }
  const prefix = contentTypesPrefixes[type];
  return contentType.startsWith(prefix);
}

export function getMessageContentType(contentType: string | undefined) {
  if (!contentType) {
    logger.info("[getMessageContentType] Content type is undefined");
    return undefined;
  }

  const result = ObjectTyped.keys(contentTypesPrefixes).find((key) =>
    contentType.startsWith(contentTypesPrefixes[key])
  )!;

  return result;
}
