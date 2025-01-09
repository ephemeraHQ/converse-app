import {
  EncryptedLocalAttachment,
  RemoteAttachmentContent,
} from "@xmtp/react-native-sdk";
import { uploadFile } from "./uploadFile";
import { getCurrentInboxId } from "@/data/store/accountsStore";

export const uploadRemoteAttachmentForCurrentUser = async (args: {
  attachment: EncryptedLocalAttachment;
}): Promise<RemoteAttachmentContent> => {
  const publicURL = await uploadFile({
    inboxId: getCurrentInboxId()!,
    filePath: args.attachment.encryptedLocalFileUri,
  });

  return {
    scheme: "https://",
    url: publicURL,
    ...args.attachment.metadata,
  };
};
