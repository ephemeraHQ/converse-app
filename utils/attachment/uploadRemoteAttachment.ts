import {
  EncryptedLocalAttachment,
  RemoteAttachmentContent,
} from "@xmtp/react-native-sdk";
import { uploadFile } from "./uploadFile";

export const uploadRemoteAttachment = async (
  account: string,
  attachment: EncryptedLocalAttachment
): Promise<RemoteAttachmentContent> => {
  const publicURL = await uploadFile({
    account,
    filePath: attachment.encryptedLocalFileUri,
  });

  return {
    scheme: "https://",
    url: publicURL,
    ...attachment.metadata,
  };
};
