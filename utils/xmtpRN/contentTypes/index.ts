export const contentTypesPrefixes = {
  text: "xmtp.org/text:",
  remoteAttachment: "xmtp.org/remoteStaticAttachment:",
  attachment: "xmtp.org/attachment:",
  reaction: "xmtp.org/reaction:",
  reply: "xmtp.org/reply:",
  readReceipt: "xmtp.org/readReceipt:",
  coinbasePayment: "coinbase.com/coinbase-messaging-payment-activity:",
  transactionReference: "xmtp.org/transactionReference:",
};

export const isContentType = (
  type: keyof typeof contentTypesPrefixes,
  contentType?: string | undefined
) => {
  if (!contentType) return false;
  const prefix = contentTypesPrefixes[type];
  return contentType.startsWith(prefix);
};

export const getMessageContentType = (contentType: string) => {
  return Object.keys(contentTypesPrefixes).find((key) =>
    contentType.startsWith((contentTypesPrefixes as any)[key])
  );
};
