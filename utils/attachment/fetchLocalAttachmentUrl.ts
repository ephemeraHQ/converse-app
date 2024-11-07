import { getLocalAttachment } from "./getLocalAttachment";

export const fetchLocalAttachmentUrl = async (messageId: string) => {
  const localAttachment = await getLocalAttachment(messageId);
  if (localAttachment && localAttachment.mediaType === "IMAGE") {
    return localAttachment.mediaURL;
  }
  return undefined;
};
