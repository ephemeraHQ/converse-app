export type SerializedAttachmentContent = {
  filename: string;
  mimeType: string;
  data: string;
};

export type LocalAttachmentMetadata = {
  filename: string;
  mimeType: string | undefined;
  imageSize?: { width: number; height: number };
};
