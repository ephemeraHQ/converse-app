import { z } from "zod";
import { api } from "@/utils/api/api";
import { logger } from "@/utils/logger";
import RNFetchBlob from "rn-fetch-blob";

const PresignedUrlResponseSchema = z.object({
  objectKey: z.string(),
  url: z.string().url(),
});

export type IPresignedUrlResponse = z.infer<typeof PresignedUrlResponseSchema>;

/**
 * Gets a presigned URL for uploading a file to S3
 * @param contentType - The MIME type of the file to upload
 * @returns A presigned URL and object key for the upload
 */
export const getPresignedUploadUrl = async (
  contentType?: string,
): Promise<IPresignedUrlResponse> => {
  logger.debug(
    "[API ATTACHMENTS] Getting presigned URL for content type:",
    contentType,
  );
  const { data } = await api.get("/api/v1/attachments/presigned", {
    params: { contentType },
  });
  logger.debug("[API ATTACHMENTS] getPresignedUploadUrl response:", data);
  return PresignedUrlResponseSchema.parse(data);
};

/**
 * Extracts the public URL from a presigned URL by removing query parameters
 */
const getPublicUrlFromPresignedUrl = (presignedUrl: string): string => {
  const fileURL = new URL(presignedUrl);
  return fileURL.origin + fileURL.pathname;
};

/**
 * Uploads a file using a presigned URL
 * @param presignedUrl - The presigned URL to upload to
 * @param filePath - The local file path
 * @param contentType - The MIME type of the file
 * @returns The public URL of the uploaded file
 */
export const uploadFileWithPresignedUrl = async (
  presignedUrl: string,
  filePath: string,
  contentType: string,
): Promise<string> => {
  logger.debug("[API ATTACHMENTS] Uploading file to presigned URL:", {
    presignedUrl,
    filePath,
    contentType,
  });

  // Remove file:// prefix for RNFetchBlob
  const normalizedPath = filePath.replace("file://", "");

  await RNFetchBlob.fetch(
    "PUT",
    presignedUrl,
    {
      "Content-Type": contentType,
      "x-amz-acl": "public-read",
    },
    RNFetchBlob.wrap(normalizedPath),
  );

  const publicUrl = getPublicUrlFromPresignedUrl(presignedUrl);
  logger.debug("[API ATTACHMENTS] File uploaded successfully:", { publicUrl });
  return publicUrl;
};
