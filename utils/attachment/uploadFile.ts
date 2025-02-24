import RNFetchBlob from "rn-fetch-blob";
import { getPresignedUriForUpload } from "@/utils/api/upload";

export const uploadFile = async ({
  filePath,
  contentType,
}: {
  filePath?: string | undefined;
  blob?: Blob | undefined;
  contentType?: string | undefined;
}) => {
  if (!filePath) {
    throw new Error("filePath needed to upload file from mobile");
  }
  const { url } = await getPresignedUriForUpload(contentType);
  await RNFetchBlob.fetch(
    "PUT",
    url,
    {
      "content-type": contentType || "application/octet-stream",
      "x-amz-acl": "public-read",
    },
    RNFetchBlob.wrap(filePath.replace("file:///", "/")),
  );
  const fileURL = new URL(url);
  const publicURL = fileURL.origin + fileURL.pathname;
  return publicURL;
};
