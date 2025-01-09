import RNFetchBlob from "rn-fetch-blob";

import { getPresignedUriForUpload } from "../api";
import { InboxId } from "@xmtp/react-native-sdk";

export const uploadFile = async ({
  inboxId,
  filePath,
  contentType,
}: {
  inboxId: InboxId;
  filePath?: string;
  contentType?: string;
}) => {
  if (!filePath) {
    throw new Error("filePath needed to upload file from mobile");
  }
  if (!contentType) {
    throw new Error("contentType needed to upload file from mobile");
  }
  const { url } = await getPresignedUriForUpload({
    inboxId,
    contentType,
  });
  await RNFetchBlob.fetch(
    "PUT",
    url,
    {
      "content-type": contentType || "application/octet-stream",
      "x-amz-acl": "public-read",
    },
    RNFetchBlob.wrap(filePath.replace("file:///", "/"))
  );
  const fileURL = new URL(url);
  const publicURL = fileURL.origin + fileURL.pathname;
  return publicURL;
};
