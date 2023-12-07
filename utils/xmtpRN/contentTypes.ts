const contentTypesPrefixes = {
  text: "xmtp.org/text:",
  remoteAttachment: "xmtp.org/remoteStaticAttachment:",
  attachment: "xmtp.org/attachment:",
  reaction: "xmtp.org/reaction:",
  readReceipt: "xmtp.org/readReceipt:",
};

export const isContentType = (
  type: keyof typeof contentTypesPrefixes,
  contentType?: string | undefined
) => {
  if (!contentType) return false;
  const prefix = contentTypesPrefixes[type];
  return contentType.startsWith(prefix);
};
