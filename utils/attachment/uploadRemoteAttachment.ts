import {
  EncryptedLocalAttachment,
  RemoteAttachmentContent,
} from "@xmtp/react-native-sdk";
import { uploadFile } from "./uploadFile";

export const uploadRemoteAttachment = async (
  attachment: EncryptedLocalAttachment,
): Promise<RemoteAttachmentContent> => {
  const publicURL = await uploadFile({
    filePath: attachment.encryptedLocalFileUri,
  });

  return {
    scheme: "https://",
    url: publicURL,
    ...attachment.metadata,
  };
};
